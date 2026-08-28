import request from 'supertest';
import app from '../server';
import dotenv from 'dotenv';

dotenv.config();

describe('Order Routes', () => {
  it('should create an order', async () => {
    const response = await request(app)
      .post('/api/order')
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`)
      .set('x-currency', 'NGN')
      .send({
        cart_id: 9,
        street_address: '123 Main St',
        apt_no: 'Apt 6S',
        customerName: 'Sarah Dole',
        customerPhonenumber: '982746663',
        city: 'Lekki',
        state: 'Lagos',
        postal_code: '1010100',
        country: 'Nigeria',
      });
    expect(response.status).toBe(200);
  });
});

describe('Order Routes', () => {
  it('should get order history', async () => {
    const response = await request(app)
      .get('/api/order/orderhistory')
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`);
    expect(response.status).toBe(200);
  });
});

describe('Order Routes', () => {
  it('should update shipping info', async () => {
    const response = await request(app)
      .post('/api/order/edit-shipping-info')
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`)
      .send({
        order_id: 19,
        apt_no: 'Apt 687',
      });
    expect(response.status).toBe(200);
  });
});
