import request from 'supertest';
import app from '../server';
import dotenv from 'dotenv';

dotenv.config();

describe('Cart Routes', () => {
  it('should add item to cart', async () => {
    const response = await request(app)
      .post('/api/cart/addtocart')
      .send({
        productid: 4,
        quantity: 2,
        size: 'M',
      })
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`);
    expect(response.status).toBe(200);
  });
});

describe('Cart Routes', () => {
  it('should update quantity of item in cart', async () => {
    const response = await request(app)
      .put('/api/cart/updatequantity')
      .send({
        cartitemid: 53,
        quantity: 3,
      })
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`);
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
        cartitemid: 35,
      })
      .set('Cookie', `accessToken=${process.env.TEST_ACCESS_TOKEN}`);
    expect(response.status).toBe(200);
  });
});
