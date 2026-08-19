import request from 'supertest';
import app from '../server';
import dotenv from 'dotenv';

dotenv.config();

describe('stripe payment routes', () => {
  let sessionId = '';
  it('should create a stripe checkout session', async () => {
    const response = await request(app)
      .post('/api/payment/stripe/create-checkout-session')
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`)
      .send({
        order_id: 19,
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('url');
    expect(response.body).toHaveProperty('session_id');
    sessionId = response.body.session_id;
  });

  it('should verify a stripe payment', async () => {
    const response = await request(app)
      .get(`/api/payment/stripe/verify-payment/${sessionId}`)
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`);
    expect(response.status).toBe(200);
  });
});
