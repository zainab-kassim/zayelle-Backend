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
        street_address: '18 baycrest St',
        apt_no: 'Apt 5k',
        phone_number: '565-9899',
        city: 'Imota',
        state: 'Ikorodu',
        postal_code: 'K8V 8K8',
        country: 'Nigeria',
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
        order_id: 13,
        street_address: '31 akanbi street',
        apt_no: 'Apt 5L',
      });
    expect(response.status).toBe(200);
  });
});
