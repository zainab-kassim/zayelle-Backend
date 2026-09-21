import { supabaseAdmin } from '../config/supabaseAdmin';
import { Request, Response } from 'express';
import { getCachedRates } from '../utils/getCachedRates';
import { getRate } from '../utils/getRate';
import { formatOrderItemPrices } from '../utils/formatOrderItemPrices';
import logger from '../middleware/logger';
import { AuthErrorCode } from '../constants/authErrorCodes';

// one config per shipping destination — currency and fee used to live in
// two separate maps that had to be kept in sync by hand; merged since they
// only ever change together. `feeInUsd` is only true for Nigeria, which has
// no fixed NGN shipping rate agreed yet, so that fee converts via `rate`
// same as the rest of the order instead of being a flat local amount.
//
// country is the source of truth here, not req.currency (the browsing/
// geolocated currency header) — deriving both currency and fee from it
// means an order can never end up with a currency that doesn't match its
// own shipping destination, regardless of frontend timing.
const SHIPPING_DESTINATIONS: Record<
  string,
  { currency: string; fee: number; feeInUsd?: boolean }
> = {
  'United States': { currency: 'USD', fee: 20 },
  'United Kingdom': { currency: 'GBP', fee: 25 },
  Canada: { currency: 'CAD', fee: 18 },
  Nigeria: { currency: 'NGN', fee: 40, feeInUsd: true },
};

// country is validated against this exact set by the request schemas before
// either controller below runs, so a lookup miss here would mean the schema
// and this table have drifted apart, not a bad request
function getShippingFee(country: string, rate: number): number {
  const destination = SHIPPING_DESTINATIONS[country];
  if (!destination) return 0;
  return destination.feeInUsd ? destination.fee * rate : destination.fee;
}

function getCurrencyForCountry(country: string): string {
  return SHIPPING_DESTINATIONS[country]?.currency ?? 'USD';
}

export const createorder = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'User not authenticated',
      code: AuthErrorCode.TOKEN_EXPIRED,
    });
  }
  const user_id = req.user.id;

  const {
    cart_id,
    street_address,
    apt_no,
    customerName,
    customerPhonenumber,
    city,
    state,
    postal_code,
    country,
  } = req.body;

  const currency = getCurrencyForCountry(country);
  const rates = await getCachedRates();
  const rate = getRate(rates, currency);

  const { data: existingcart, error: existingcarterror } = await supabaseAdmin
    .from('carts')
    .select('id,cart_items(price)')
    .eq('user_id', user_id)
    .eq('id', cart_id)
    .single();

  if (existingcarterror || !existingcart) {
    logger.error({ existingcarterror }, 'cart not found');
    return res.status(404).json({ message: 'Cart not found' });
  }
  const total_price = existingcart.cart_items.reduce(
    (sum, item) => sum + item.price,
    0,
  );
  const shippingFee = getShippingFee(country, rate);
  const orderFields = {
    total_price,
    customerName,
    customerPhonenumber,
    street_address,
    apt_no,
    city,
    state,
    postal_code,
    country,
    totalLocal: parseFloat((total_price * rate + shippingFee).toFixed(2)),
    rate,
    currency,
  };
  const returning = `id,user_id(id,email),cart_id,total_price,status,customerName,customerPhonenumber,street_address,apt_no,city,state,postal_code,country,totalLocal`;

  // idempotent per cart — a retried request or a stale frontend that thinks
  // it has no order yet would otherwise leave a second pending order behind
  // for the same cart, indistinguishable from a real duplicate purchase
  const { data: existingOrder } = await supabaseAdmin
    .from('order')
    .select('id')
    .eq('cart_id', cart_id)
    .eq('user_id', user_id)
    .eq('status', 'pending')
    .maybeSingle();

  const { data: order, error: orderError } = existingOrder
    ? await supabaseAdmin
        .from('order')
        .update(orderFields)
        .eq('id', existingOrder.id)
        .select(returning)
        .single()
    : await supabaseAdmin
        .from('order')
        .insert({ user_id, cart_id, status: 'pending', ...orderFields })
        .select(returning)
        .single();

  if (orderError || !order) {
    logger.error({ orderError }, 'error creating order');
    return res.status(500).json({ message: 'Error creating order' });
  }

  return res.status(200).json({ message: 'Order created successfully', order });
};

// the UI only distinguishes 3 buckets — group the raw order.status values to match
const STATUS_BUCKETS: Record<string, string[]> = {
  success: ['success'],
  pending: ['pending'],
  cancelled: ['canceled', 'failed', 'abandoned'],
};

export const getOrderHistory = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Unauthorized',
      code: AuthErrorCode.TOKEN_EXPIRED,
    });
  }
  const user_id = req.user.id;
  const status =
    typeof req.query.status === 'string' ? req.query.status : undefined;
  const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit as string, 10) || 10, 1),
    50,
  );
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = supabaseAdmin
    .from('order')
    .select(`*, order_items(*, product_id(name, slug, image, description))`, {
      count: 'exact',
    })
    .eq('user_id', user_id);

  if (status && STATUS_BUCKETS[status]) {
    query = query.in('status', STATUS_BUCKETS[status]);
  }

  const {
    data: orders,
    error: orderError,
    count,
  } = await query.order('created_at', { ascending: false }).range(start, end);

  if (orderError) {
    logger.error({ orderError }, 'Error fetching order history');
    return res.status(500).json({ message: 'Error fetching order history' });
  }

  // sidebar tab counts always reflect the full set, independent of the
  // current filter/page, so they're queried separately (count-only, no rows)
  const [successCount, pendingCount, cancelledCount] = await Promise.all(
    Object.values(STATUS_BUCKETS).map((statuses) =>
      supabaseAdmin
        .from('order')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .in('status', statuses),
    ),
  );

  const formattedOrders = orders.map(formatOrderItemPrices);

  return res.status(200).json({
    message: 'Order history fetched successfully',
    orders: formattedOrders,
    counts: {
      success: successCount.count ?? 0,
      pending: pendingCount.count ?? 0,
      cancelled: cancelledCount.count ?? 0,
    },
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
    },
  });
};

export const updateshippinginfo = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Unauthorized',
      code: AuthErrorCode.TOKEN_EXPIRED,
    });
  }

  const {
    order_id,
    street_address,
    apt_no,
    customerName,
    customerPhonenumber,
    city,
    state,
    postal_code,
    country,
  } = req.body;

  // the fee (and currency) baked into totalLocal at creation were priced for
  // the country entered then — if the destination changes here, both are now
  // wrong. Derived from country directly (not req.currency) so this can't
  // drift out of sync with whatever the frontend's currency store happens
  // to hold at request time.
  let totalLocal: number | undefined;
  let rate: number | undefined;
  let currency: string | undefined;
  if (country) {
    const { data: existingOrder, error: existingOrderError } =
      await supabaseAdmin
        .from('order')
        .select('total_price')
        .eq('id', order_id)
        .eq('user_id', req.user.id)
        .single();

    if (existingOrderError || !existingOrder) {
      logger.error({ existingOrderError }, 'Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }

    currency = getCurrencyForCountry(country);
    const rates = await getCachedRates();
    rate = getRate(rates, currency);
    const shippingFee = getShippingFee(country, rate);
    totalLocal = parseFloat(
      (existingOrder.total_price * rate + shippingFee).toFixed(2),
    );
  }

  const { data: updatedorder, error: updatedordererror } = await supabaseAdmin
    .from('order')
    .update({
      street_address,
      apt_no,
      customerName,
      customerPhonenumber,
      city,
      state,
      postal_code,
      country,
      ...(totalLocal !== undefined && { totalLocal, rate, currency }),
    })
    .eq('id', order_id)
    .eq('user_id', req.user.id)
    .select(
      'street_address,apt_no,customerName,customerPhonenumber,city,state,postal_code,country,totalLocal,currency',
    )
    .single();

  if (updatedordererror) {
    logger.error({ updatedordererror }, 'Error updating shipping info');
    return res.status(500).json({ message: 'Error updating shipping info' });
  }

  return res.json({
    message: 'Shipping info updated successfully',
    order: updatedorder,
  });
};

export const getOrderDetails = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Unauthorized',
      code: AuthErrorCode.TOKEN_EXPIRED,
    });
  }

  const { order_id } = req.params;

  const { data: order, error: orderError } = await supabaseAdmin
    .from('order')
    .select(`*, order_items(*, product_id(name, slug, image, description))`)
    .eq('id', order_id)
    .eq('user_id', req.user.id)
    .single();

  if (orderError || !order) {
    logger.error({ orderError }, 'Order not found');
    return res.status(404).json({ message: 'Order not found' });
  }

  return res.status(200).json({ order: formatOrderItemPrices(order) });
};
