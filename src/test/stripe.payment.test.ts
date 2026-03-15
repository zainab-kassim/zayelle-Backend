import request from 'supertest';
import app from '../server';
import dotenv from 'dotenv';

dotenv.config();

let accesstoken: string

beforeAll(async () => {
    const response = await request(app)
        .post('/api/auth/token')
        .set('Cookie', `refreshToken=${process.env.TEST_REFRESH_TOKEN}`)

    accesstoken = response.headers['set-cookie'][0].split(';')[0].split('=')[1];
})

describe('stripe payment routes', () => {
    it('should create a stripe payment intent', async () => {
        const response = await request(app)
        .post('/api/payment/stripe/create-payment-intent')
        .set('Cookie', `accessToken=${accesstoken}`)
        .send({
            total_price: "136,000",
            currency: "cad",
            order_id: 8
        })
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('client_secret');
        expect(response.body).toHaveProperty('paymentIntent_id');
        console.log(response.body.paymentIntent_id);
        console.log(response.body.client_secret);
    })
})


describe('stripe payment verification route', () => {
    it('should verify a stripe payment', async () => {
        const response = await request(app)
        .get('/api/payment/stripe/verify-payment/pi_3TBLlLRt5F9M13321Wtxe2Rn')
        .set('Cookie', `accessToken=${accesstoken}`)
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Payment not successful" })
    })
})