# Zayelle — Backend

REST API powering [Zayelle](https://byzayelle.com), a fashion e-commerce platform with multi-currency checkout, custom-order booking, and dual payment providers (Stripe + Paystack). Built with Express, TypeScript, and Supabase (Postgres).

## Tech stack

| Layer         | Choice                                                                           |
| ------------- | -------------------------------------------------------------------------------- |
| Runtime       | Node.js, Express 5, TypeScript                                                   |
| Database      | Supabase (Postgres), via `@supabase/supabase-js`                                 |
| Auth          | JWT access/refresh tokens (per-device sessions), Passport (Google OAuth), bcrypt |
| Payments      | Stripe, Paystack                                                                 |
| Email         | Resend                                                                           |
| Validation    | Zod, express-validator                                                           |
| Rate limiting | rate-limiter-flexible, express-slow-down                                         |
| Scheduling    | node-cron                                                                        |
| Testing       | Jest, Supertest, ts-jest                                                         |
| Tooling       | ESLint, Prettier, Husky + lint-staged                                            |

## Features

- **Auth** — email/password and Google OAuth, per-device session rows with refresh-token rotation and reuse detection (a stolen/replayed token revokes all sessions for that user), hashed tokens, forgot/reset password flow
- **Catalog** — products, collections, slugs
- **Cart** — add/update/remove items, atomic inventory decrement on checkout via Postgres RPC (no race conditions on the last unit)
- **Checkout & orders** — country-derived currency and shipping fee (never trusted from the client), idempotent order creation per cart, order history and detail views
- **Payments** — Stripe and Paystack checkout sessions, idempotent webhook handlers that match on order id + currency + amount + status before mutating state, automatic inventory restore on failed/canceled payments
- **Order confirmation email** — branded HTML template sent via Resend after a successful payment
- **Custom-order booking** — consultation scheduling that hands off to a Make.com automation for live calendar-conflict checking and Google Meet provisioning
- **Currency** — live exchange-rate lookups with an in-memory TTL cache
- **Newsletter** — subscribe endpoint with duplicate-email guard
- **Housekeeping** — nightly cron job that sweeps stale/abandoned orders
- **Hardening** — Helmet, tiered rate limits per route class (auth/payment routes get the tightest budgets), request throttling, 2 MB JSON body limit, CORS allowlist

## Project structure

```
src/
  auth/            Passport strategy, JWT/session config
  config/          Supabase admin client, Resend client
  constants/       Shared error codes
  controllers/     Route handlers (cart, order, product, user, currency, newsletter)
    payment/       Stripe and Paystack checkout controllers
    webhooks/      Stripe and Paystack webhook handlers
  jobs/            Cron jobs (stale-order cleanup)
  middleware/      CORS, rate limiting, throttling, auth guard, currency, validation
  models/          Sequelize models
  routes/          Express routers, one per resource
  schemas/         Zod request-validation schemas
  test/            Jest/Supertest integration tests
  types/           Shared TypeScript types, generated Supabase DB types
  utils/           Email senders, inventory restore, price formatting, rate caching
  server.ts        App entry point
```

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project (Postgres)
- Stripe and Paystack accounts (test-mode keys are enough for local dev)
- A Resend account for transactional email

### Install

```bash
npm install
```

### Environment variables

Create a `.env` file in the project root:

```bash
# Database
PGUSER=
PGPASSWORD=
PGHOST=
PGPORT=
PGDATABASE=

# Supabase
PROJECTURL=
APIKEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
JWT_SECRET_KEY=
JWT_REFRESH_TOKEN_SECRET_KEY=
GOOGLE_CLIENT_ID=

# Payments
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_WEBHOOK_SECRET=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Custom-order booking automation
MAKE_API_KEY=
MAKE_WEBHOOK_URL=

# App
FRONTEND_URL=
LOCAL_URL=
NODE_ENV=
```

### Run

```bash
npm run dev      # ts-node, local development
npm run build    # compile to dist/
npm start        # run the compiled build
npm test         # Jest test suite
npm run lint     # ESLint
npm run format   # Prettier
```

The server listens on `http://localhost:4000`.

## API reference

All routes are mounted under `/api`. Routes marked **Auth** require a valid session (httpOnly cookie).

### Auth — `/api/auth`

| Method | Path               | Auth | Description                                 |
| ------ | ------------------ | ---- | ------------------------------------------- |
| POST   | `/signup`          |      | Create an account                           |
| POST   | `/login`           |      | Email/password login                        |
| POST   | `/google`          |      | Google OAuth login                          |
| POST   | `/logout`          |      | Revoke the current session                  |
| POST   | `/forgot-password` |      | Request a password reset email              |
| POST   | `/reset-password`  |      | Reset password with a valid token           |
| POST   | `/token`           |      | Rotate an access token from a refresh token |

### Cart — `/api/cart`

| Method | Path                  | Auth | Description                  |
| ------ | --------------------- | ---- | ---------------------------- |
| GET    | `/`                   | ✓    | Get the current user's cart  |
| POST   | `/addtocart`          |      | Add an item to the cart      |
| PUT    | `/updatequantity`     |      | Update an item's quantity    |
| DELETE | `/deletecartitem/:id` |      | Remove an item from the cart |

### Products — `/api/products`

| Method | Path                          | Auth | Description                   |
| ------ | ----------------------------- | ---- | ----------------------------- |
| GET    | `/`                           |      | List products                 |
| GET    | `/:slug`                      |      | Get a product by slug         |
| GET    | `/collection/:collectionSlug` |      | List products in a collection |

### Orders — `/api/order`

| Method | Path                  | Auth | Description                                                       |
| ------ | --------------------- | ---- | ----------------------------------------------------------------- |
| POST   | `/`                   |      | Create an order                                                   |
| GET    | `/orderhistory`       | ✓    | List the current user's orders                                    |
| GET    | `/:order_id`          | ✓    | Get order details                                                 |
| POST   | `/edit-shipping-info` |      | Update shipping info (recomputes currency/rate/total server-side) |

### Payments — `/api/payment`

| Method | Path                                 | Auth | Description                           |
| ------ | ------------------------------------ | ---- | ------------------------------------- |
| POST   | `/stripe/create-checkout-session`    | ✓    | Start a Stripe checkout session       |
| POST   | `/stripe/cancel-checkout`            | ✓    | Cancel a pending Stripe session       |
| GET    | `/stripe/verify-payment/:session_id` | ✓    | Verify a Stripe session               |
| POST   | `/paystack/initialize`               | ✓    | Start a Paystack transaction          |
| POST   | `/paystack/cancel-checkout`          | ✓    | Cancel a pending Paystack transaction |
| GET    | `/paystack/verify/:reference`        | ✓    | Verify a Paystack transaction         |

### Webhooks — `/api/webhooks`

| Method | Path        | Description                    |
| ------ | ----------- | ------------------------------ |
| POST   | `/stripe`   | Stripe payment event webhook   |
| POST   | `/paystack` | Paystack payment event webhook |

### Other

| Method | Path                        | Auth | Description                      |
| ------ | --------------------------- | ---- | -------------------------------- |
| GET    | `/api/currency`             |      | Get current exchange rates       |
| POST   | `/api/booking`              |      | Book a custom-order consultation |
| POST   | `/api/newsletter/subscribe` |      | Subscribe to the newsletter      |

## Key architectural decisions

- **Backend is the source of truth for money.** Currency and shipping fee are derived server-side from the order's `country` field, never trusted from a client-supplied header — closes off any client-side price/currency manipulation.
- **Idempotent by design.** Order creation checks for an existing pending order per cart before inserting; payment webhooks match on order id, currency, amount, and status before mutating, so a retried or duplicate event is a no-op.
- **Per-device sessions.** One `sessions` row per login rather than per user, so logging out or refreshing on one device never affects another. A refresh token that doesn't match a known session is treated as reuse of a stolen token and revokes everything for that user.

## Deployment

Deployed on [Render](https://render.com). Production reads `NODE_ENV=Production` and connects to the live Supabase project; set the environment variables above in the Render dashboard rather than committing a `.env` file.
