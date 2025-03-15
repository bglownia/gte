"use client";
import useSWRSubscription from "swr/subscription";

export type Trade = {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
};

export type TradeStream = {
  e: "trade"; // Event type
  E: number; // Event time
  s: symbol; // Symbol
  t: number; // Trade ID
  p: string; // Price
  q: string; // Quantity
  T: number; // Trade time
  m: boolean; // Is the buyer the market maker?
  M: boolean; // Ignore
};

export const mapTradeStream = (data: TradeStream): Trade => ({
  id: data.t,
  price: data.p,
  qty: data.q,
  quoteQty: (parseFloat(data.p) * parseFloat(data.q)).toString(),
  time: data.T,
  isBuyerMaker: data.m,
  isBestMatch: data.M,
});

const fetcher = <T,>(url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((data: T) => data);

export const Trades = ({
  symbol,
  limit = 10,
}: {
  symbol: string;
  limit?: number;
}) => {
  /*
  const { data, error } = useSWR<Trade[]>(
    `https://api.binance.com/api/v3/trades?symbol=${symbol.toUpperCase()}&limit=10`,
    fetcher
  );
  */
  const { data, error } = useSWRSubscription<Trade[], Event, string>(
    `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`,
    (key, { next }) => {
      fetcher<Trade[]>(
        `https://api.binance.com/api/v3/trades?symbol=${symbol.toUpperCase()}&limit=${limit}`
      ).then((data) =>
        next(null, (prev) =>
          prev
            ? Array.from(
                new Map(
                  [...prev, ...data].map((trade) => [trade.id, trade])
                ).values()
              )
                .toSorted((a, b) => b.id - a.id)
                .slice(0, limit)
            : data.toReversed()
        )
      );
      const socket = new WebSocket(key);
      socket.addEventListener("message", ({ data }) =>
        next(null, (prev) =>
          [
            mapTradeStream(JSON.parse(data) as TradeStream),
            ...(prev || []),
          ].slice(0, limit)
        )
      );
      socket.addEventListener("error", (event) => next(event));
      return () => socket.close();
    }
  );

  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  return (
    <div>
      <h1>Trades</h1>
      <div>
        {data?.map((trade) => (
          <div key={trade.id}>
            <span>{trade.id}</span> - <span>{trade.price}</span> |{" "}
            <span>{trade.qty}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
