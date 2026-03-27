let cachedRates: Record<string, number> = {};
let lastFetched: Date | null = null;

export const getCachedRates = async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // fetch fresh if cache is empty or older than 1 hour
  if (!lastFetched || lastFetched < oneHourAgo) {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const { rates } = await res.json();
    cachedRates = rates;
    lastFetched = new Date();
  }
  return cachedRates;
};
