import request from 'supertest';
import app from '../server';
import dotenv from 'dotenv';

dotenv.config();

describe('Cart Routes', () => {
  it('should add item to cart', async () => {
    const response = await request(app)
      .post('/api/cart/addtocart')
      .send({
        productid: 1,
        quantity: 2,
        size: 'M',
      })
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`)
      .set('x-currency', 'NGN');
    expect(response.status).toBe(200);
  });
});

describe('Cart Routes', () => {
  it('should update quantity of item in cart', async () => {
    const response = await request(app)
      .put('/api/cart/updatequantity')
      .send({
        cartitemid: 59,
        quantity: 1,
      })
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`)
      .set('x-currency', 'NGN');
    expect(response.status).toBe(200);
  });
});

describe('Cart Routes', () => {
  it('should retrieve cart items', async () => {
    const response = await request(app)
      .get('/api/cart/')
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`);
    expect(response.status).toBe(200);
  });
});

describe('Cart Routes', () => {
  it('should delete cart items', async () => {
    const response = await request(app)
      .delete('/api/cart/deletecartitem')
      .send({
        cartitemid: 60,
      })
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`);
    expect(response.status).toBe(200);
  });
});
