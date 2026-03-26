import request from 'supertest';
import app from '../server';
import dotenv from 'dotenv';

dotenv.config();

let accesstoken: string;

beforeAll(async () => {
  const response = await request(app)
    .post('/api/auth/token')
    .set('Cookie', `refreshToken=${process.env.TEST_REFRESH_TOKEN}`);

  accesstoken = response.headers['set-cookie'][0].split(';')[0].split('=')[1];
});

describe('paystack payment routes', () => {
  it('should initialize a paystack payment', async () => {
    const response = await request(app)
      .post('/api/payment/paystack/initialize')
      .send({
        email: `${process.env.TESTEMAIL}`,
        order_id: 12,
        total_price: '185,000',
      })
      .set('Cookie', `accessToken=${accesstoken}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('auth_url');
    console.log(response.body.auth_url);
    expect(response.body).toHaveProperty('reference');
  });
});

describe('paystack payment routes', () => {
  it('should verify a paystack payment', async () => {
    const response = await request(app)
      .get('/api/payment/paystack/verify/ZAYELLE_11_1774297353466')
      .set('Cookie', `accessToken=${accesstoken}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Payment successful');
  });
});
