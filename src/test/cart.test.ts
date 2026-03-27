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

describe('Cart Routes', () => {
  it('should add item to cart', async () => {
    const response = await request(app)
      .post('/api/cart/addtocart')
      .send({
        productid: 4,
        quantity: 1,
        size: 'M',
      })
      .set('Cookie', `accessToken=${accesstoken}`);
    expect(response.status).toBe(200);
  });
});

describe('Cart Routes', () => {
  it('should update quantity of item in cart', async () => {
    const response = await request(app)
      .put('/api/cart/updatequantity')
      .send({
        cartitemid: 46,
        quantity: 2,
      })
      .set('Cookie', `accessToken=${accesstoken}`);
    expect(response.status).toBe(200);
  });
});

describe('Cart Routes', () => {
  it('should retrieve cart items', async () => {
    const response = await request(app)
      .get('/api/cart/')
      .set('Cookie', `accessToken=${accesstoken}`);
    expect(response.status).toBe(200);
  });
});

// describe('Cart Routes', () => {
//     it('should delete cart items', async () => {
//         const response = await request(app)
//             .delete('/api/cart/deletecartitem')
//             .send({
//                 "cartitemid": 35,
//             })
//             .set('Cookie', `accessToken=${accesstoken}`)
//         expect(response.status).toBe(200)
//     })
// })
