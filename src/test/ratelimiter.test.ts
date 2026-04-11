import request from 'supertest';
import app from '../server';
import dotenv from 'dotenv';

dotenv.config();

it('should block requests after rate limit is exceeded', async () => {
  const responses = [];

  for (let i = 0; i < 8; i++) {
    const response = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '1.5.4.6')
      .send({
        email: process.env.TEST_USER_EMAIL,
        password: process.env.TEST_USER_PASSWORD,
      });
    responses.push(response.status);
  }

  const passing = responses.slice(0, 7);
  const blocked = responses[7];

  expect(passing.every((status) => status !== 429)).toBe(true);
  expect(blocked).toBe(429);
}, 30000);
