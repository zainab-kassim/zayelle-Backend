export const getRate = (
  rates: Record<string, number>,
  currency?: string,
): number => {
  const safeCurrency = currency ?? 'USD';
  const rate = rates[safeCurrency];
  return typeof rate === 'number' && rate > 0 ? rate : rates['USD'];
};
