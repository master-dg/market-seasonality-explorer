import axios from "axios";

const BASE_URL = "https://api.binance.com/api/v3";

/**
 * Get current price for a symbol
 * @param {string} symbol - e.g., 'BTCUSDT'
 */
export const fetchCurrentPrice = async (symbol) => {
  const { data } = await axios.get(`${BASE_URL}/ticker/price`, {
    params: { symbol },
  });
  return parseFloat(data.price);
};

/**
 * Get OHLCV data with optional start and end time
 * @param {string} symbol - e.g., 'BTCUSDT'
 * @param {string} interval - e.g., '1d', '1h', '15m'
 * @param {number} limit - max number of data points (default: 30)
 * @param {number|null} startTime - in milliseconds (optional)
 * @param {number|null} endTime - in milliseconds (optional)
 */
export const fetchOHLCV = async (
  symbol,
  interval = "1d",
  limit = 30,
  startTime = null,
  endTime = null
) => {
  const params = { symbol, interval, limit };

  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;

  const { data } = await axios.get(`${BASE_URL}/klines`, { params });

  return data.map((d) => ({
    time: new Date(d[0]),
    open: parseFloat(d[1]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
    close: parseFloat(d[4]),
    volume: parseFloat(d[5]),
  }));
};

/**
 * Calculate intraday volatility for a candle (high - low)
 */
export const calculateIntradayVolatility = (ohlcvData) => {
  return ohlcvData.map((d) => ({
    time: d.time,
    volatility: d.high - d.low,
  }));
};

/**
 * Get trading volume (already included in OHLCV, but can be extracted)
 */
export const extractVolume = (ohlcvData) => {
  return ohlcvData.map((d) => ({
    time: d.time,
    volume: d.volume,
  }));
};

/**
 * Get order book depth for liquidity approximation
 * @param {string} symbol - e.g., 'BTCUSDT'
 * @param {number} limit - depth size (5, 10, 20, 100)
 */
export const fetchOrderBookLiquidity = async (symbol, limit = 10) => {
  const { data } = await axios.get(`${BASE_URL}/depth`, {
    params: { symbol, limit },
  });

  const bidLiquidity = data.bids.reduce(
    (acc, [price, qty]) => acc + parseFloat(qty),
    0
  );
  const askLiquidity = data.asks.reduce(
    (acc, [price, qty]) => acc + parseFloat(qty),
    0
  );

  return {
    bidLiquidity,
    askLiquidity,
    totalLiquidity: bidLiquidity + askLiquidity,
  };
};
