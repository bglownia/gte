export const getTickerPriceUrl = (symbol: string) =>
  `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;

export const getDepthUrl = (symbol: string) =>
  `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;

export const getDepthStreamUrl = (symbol: string, limit: number) =>
  `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth${limit}`;

export const getTradesUrl = (symbol: string, limit: number) =>
  `https://api.binance.com/api/v3/trades?symbol=${symbol.toUpperCase()}&limit=${limit}`;

export const getTradesStreamUrl = (symbol: string) =>
  `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`;
