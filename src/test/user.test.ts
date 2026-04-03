import request from 'supertest';
import app from '../server';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../config/supabaseAdmin';

dotenv.config();

describe('User Routes', () => {
  it('create user account', async () => {
    const response = await request(app).post('/api/auth/signup').send({
      firstName: 'John',
      lastName: 'Doe',
      email: process.env.TEST_USER_EMAIL,
      phoneNumber: '1234567890',
      password: process.env.TEST_USER_PASSWORD,
    });
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('user signed up successfully');
  });
});

describe('User Routes', () => {
  let refreshtoken: string;
  let accesstoken: string;

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
      .eq('user_id', 10)
      .single();

    const refreshResponse = await request(app)
      .post('/api/auth/token')
      .set('Cookie', `refreshToken=${refreshtoken}`);

    accesstoken = refreshResponse.headers['set-cookie'][1]
      .split(';')[0]
      .split('=')[1];

    const { data: sessionAfter } = await supabaseAdmin
      .from('sessions')
      .select('refresh_token')
      .eq('user_id', 10)
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
