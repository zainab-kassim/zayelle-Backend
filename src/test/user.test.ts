import request from 'supertest';
import app from '../server';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../config/supabaseAdmin';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

dotenv.config();

describe('User Routes', () => {
  it('create user account', async () => {
    const response = await request(app).post('/api/auth/signup').send({
      fullName: 'Sarah Dole',
      email: process.env.TEST_USER_EMAIL,
      password: process.env.TEST_USER_PASSWORD,
    });
    // The fixture account is long-lived and shared across test runs rather
    // than re-created every time, so a rerun hitting the existing-account
    // 409 is expected too — what the rest of the suite needs is just that
    // the account exists and is reachable with TEST_USER_PASSWORD.
    expect([201, 409]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.message).toBe('user signed up successfully');
    }
  });
});

describe('User Routes', () => {
  let refreshtoken: string;
  let accesstoken: string;
  let testUserId: number;

  beforeAll(async () => {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', process.env.TEST_USER_EMAIL)
      .single();
    testUserId = data!.id;
  });

  it('Login user', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: process.env.TEST_USER_EMAIL,
      password: process.env.TEST_USER_PASSWORD,
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('user logged in successfully');

    accesstoken = response.headers['set-cookie'][0].split(';')[0].split('=')[1];
    refreshtoken = response.headers['set-cookie'][1]
      .split(';')[0]
      .split('=')[1];
  });

  it('Refresh token rotates', async () => {
    const { data: sessionBefore } = await supabaseAdmin
      .from('sessions')
      .select('refresh_token')
      .eq('user_id', testUserId)
      .single();

    const refreshResponse = await request(app)
      .post('/api/auth/token')
      .set('Cookie', `refreshToken=${refreshtoken}`);

    accesstoken = refreshResponse.headers['set-cookie'][1]
      .split(';')[0]
      .split('=')[1];

    refreshtoken = refreshResponse.headers['set-cookie'][0]
      .split(';')[0]
      .split('=')[1];

    const { data: sessionAfter } = await supabaseAdmin
      .from('sessions')
      .select('refresh_token')
      .eq('user_id', testUserId)
      .single();

    expect(sessionBefore?.refresh_token).not.toBe(sessionAfter?.refresh_token);
  });

  it('Logout user', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', `accessToken=${accesstoken}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('user logged out successfully');
  });
});

describe('Password reset', () => {
  let userId: number;

  const insertToken = async (
    rawToken: string,
    expiresAt: Date,
    usedAt: Date | null = null,
  ) => {
    const token_hash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    await supabaseAdmin.from('password_reset_tokens').insert({
      user_id: userId,
      token_hash,
      expires_at: expiresAt.toISOString(),
      used_at: usedAt ? usedAt.toISOString() : null,
    });
  };

  beforeAll(async () => {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', process.env.TEST_USER_EMAIL)
      .single();
    userId = data!.id;
  });

  afterEach(async () => {
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', userId);
  });

  it('returns a generic 200 for an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody-here@example.com' });
    expect(res.status).toBe(200);
  });

  it('returns 200 and stores a token for a real email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: process.env.TEST_USER_EMAIL });
    expect(res.status).toBe(200);

    const { data } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id')
      .eq('user_id', userId);
    expect(data?.length ?? 0).toBeGreaterThan(0);
  });

  it('rejects an expired token', async () => {
    await insertToken('expired-token', new Date(Date.now() - 1000));
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'expired-token', password: 'BrandNewPass123!' });
    expect(res.status).toBe(400);
  });

  it('rejects an already-used token', async () => {
    await insertToken('used-token', new Date(Date.now() + 60_000), new Date());
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'used-token', password: 'BrandNewPass123!' });
    expect(res.status).toBe(400);
  });

  it('resets the password with a valid token and clears sessions', async () => {
    const newPassword = 'BrandNewPass123!';
    await insertToken('valid-token', new Date(Date.now() + 60_000));

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'valid-token', password: newPassword });
    expect(res.status).toBe(200);

    // every existing session was torn down by the reset
    const { data: sessions } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('user_id', userId);
    expect(sessions?.length ?? 0).toBe(0);

    // the new password works
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: process.env.TEST_USER_EMAIL, password: newPassword });
    expect(login.status).toBe(200);

    // restore the shared fixture password for other runs
    const restored = await bcrypt.hash(process.env.TEST_USER_PASSWORD!, 10);
    await supabaseAdmin
      .from('users')
      .update({ password: restored })
      .eq('id', userId);
  });
});

// This suite runs against the same Supabase project the app runs against,
// using a long-lived shared fixture account (TEST_USER_EMAIL) rather than a
// disposable one — deleting that account isn't safe here (other tables can
// reference it) and isn't the goal anyway. What each run *does* leave behind
// is its own sessions/reset-token rows if a test fails partway through
// before the normal logout/reset flow would have cleared them. Sweep those
// up so repeated runs don't pile up rows that were never actually cleaned.
afterAll(async () => {
  const { data: testUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', process.env.TEST_USER_EMAIL)
    .single();

  if (!testUser) return;

  await supabaseAdmin.from('sessions').delete().eq('user_id', testUser.id);
  await supabaseAdmin
    .from('password_reset_tokens')
    .delete()
    .eq('user_id', testUser.id);
});
