import request from 'supertest';
import app from '../server';
import dotenv from 'dotenv';

dotenv.config();

describe('stripe payment routes', () => {
  let paymentIntentId = '';
  it('should create a stripe payment intent', async () => {
    const response = await request(app)
      .post('/api/payment/stripe/create-payment-intent')
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`)
      .send({
        order_id: 19,
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('client_secret');
    expect(response.body).toHaveProperty('paymentIntent_id');
    paymentIntentId = response.body.paymentIntent_id;
  });

  it('should verify a stripe payment', async () => {
    const response = await request(app)
      .get(`/api/payment/stripe/verify-payment/${paymentIntentId}`)
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Payment not successful' });
  });
});
