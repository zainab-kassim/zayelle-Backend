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
      .get(`/api/payment/paystack/verify/${process.env.reference}`)
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN_PAYSTACK}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Payment successful');
  });
});

describe('test concurrency payment or rpc Payment Routes', () => {
  let _reference1: string;
  let _reference2: string;
  let accesstoken1: string;
  let accesstoken2: string;

  it('Login both users', async () => {
    const users = [
      {
        email: process.env.TEST_USER_EMAIL,
        password: process.env.TEST_USER_PASSWORD,
      },
      {
        email: process.env.TEST_USER_PAYSTACK_EMAIL,
        password: process.env.TEST_USER_PAYSTACK_PASSWORD,
      },
    ];

    const responses = await Promise.all(
      users.map((user) => request(app).post('/api/auth/login').send(user)),
    );

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });

    accesstoken1 = responses[0].headers['set-cookie'][0]
      .split(';')[0]
      .split('=')[1];
    accesstoken2 = responses[1].headers['set-cookie'][0]
      .split(';')[0]
      .split('=')[1];
  });

  it('both users add the last stock item to cart simultaneously', async () => {
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/cart/addtocart')
        .send({ productid: 1, quantity: 1, size: 'M' })
        .set('Cookie', `accessToken=${accesstoken1}`)
        .set('x-currency', 'NGN'),
      request(app)
        .post('/api/cart/addtocart')
        .send({ productid: 1, quantity: 1, size: 'M' })
        .set('Cookie', `accessToken=${accesstoken2}`)
        .set('x-currency', 'NGN'),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });

  it('both users create an order simultaneously', async () => {
    const orderPayload = {
      cart_id: 10,
      street_address: '598 Main St',
      apt_no: 'Apt 9b',
      phone_number: '42893651898',
      city: 'Bariga',
      state: 'Lagos',
      postal_code: '1010100',
      country: 'Nigeria',
    };

    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/order')
        .set('Cookie', `accessToken=${accesstoken1}`)
        .set('x-currency', 'NGN')
        .send({ ...orderPayload, cart_id: 9 }),
      request(app)
        .post('/api/order')
        .set('Cookie', `accessToken=${accesstoken2}`)
        .set('x-currency', 'NGN')
        .send({ ...orderPayload, cart_id: 10 }), // different cart per user
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });

  it('both users initialize payment — only one should succeed if stock is 1', async () => {
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/payment/paystack/initialize')
        .send({ email: process.env.TEST_USER_EMAIL, order_id: 26 })
        .set('Cookie', `accessToken=${accesstoken1}`),
      request(app)
        .post('/api/payment/paystack/initialize')
        .send({ email: process.env.TEST_USER_PAYSTACK_EMAIL, order_id: 27 })
        .set('Cookie', `accessToken=${accesstoken2}`),
    ]);

    console.log('User 1,jane:', res1.status, res1.body);
    console.log('User 2,Jalah:', res2.status, res2.body);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(400); // OUT_OF_STOCK
  });
});
