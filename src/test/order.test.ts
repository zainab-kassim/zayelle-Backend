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

describe('Order Routes', () => {
  it('should create an order', async () => {
    const response = await request(app)
      .post('/api/order')
      .set('Cookie', `accessToken=${accesstoken}`)
      .send({
        cart_id: 6,
        street_address: '18 Edmonton',
        apt_no: 'Apt 5H',
        phone_number: '99765222',
        city: 'Calgary',
        state: 'ON',
        postal_code: 'K1C VK8',
        country: 'Canada',
      });
    expect(response.status).toBe(200);
  });
});

describe('Order Routes', () => {
  it('should get order history', async () => {
    const response = await request(app)
      .get('/api/order/orderhistory')
      .set('Cookie', `accessToken=${accesstoken}`);
    expect(response.status).toBe(200);
  });
});

describe('Order Routes', () => {
  it('should update shipping info', async () => {
    const response = await request(app)
      .post('/api/order/edit-shipping-info')
      .set('Cookie', `accessToken=${accesstoken}`)
      .send({
        order_id: 18,
        apt_no: 'Apt 501',
      });
    expect(response.status).toBe(200);
  });
});
