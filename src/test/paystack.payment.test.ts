import request from 'supertest';
import app from '../server';
import dotenv from 'dotenv';

dotenv.config();

describe('paystack payment routes', () => {
  it('should initialize a paystack payment', async () => {
    const response = await request(app)
      .post('/api/payment/paystack/initialize')
      .send({
        email: `${process.env.TEST_USER_EMAIL}`,
        order_id: 23,
      })
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('auth_url');
    expect(response.body).toHaveProperty('reference');
  });
});

describe('paystack payment routes', () => {
  it('should verify a paystack payment', async () => {
    const response = await request(app)
      .get('/api/payment/paystack/verify/ZAYELLE_15_1774653178006')
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Payment successful');
  });
});
