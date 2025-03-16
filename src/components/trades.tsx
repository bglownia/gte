"use client";
import { getTradesStreamUrl, getTradesUrl } from "@/api";
import { fetcher } from "@/utils";
import useSWRSubscription from "swr/subscription";

export type Trade = {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
  direction?: PriceDirection;
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

type PriceDirection = "up" | "down";

export const mapTradeStream = (data: TradeStream, prev?: Trade): Trade =>
  mapTrade(
    {
      id: data.t,
      price: data.p,
      qty: data.q,
      quoteQty: (parseFloat(data.p) * parseFloat(data.q)).toString(),
      time: data.T,
      isBuyerMaker: data.m,
      isBestMatch: data.M,
    },
    prev
  );

export const mapTrade = (data: Trade, prev?: Trade) => ({
  ...data,
  direction: prev
    ? data.price === prev.price
      ? prev.direction
      : parseFloat(data.price) > parseFloat(prev.price)
      ? "up"
      : "down"
    : undefined,
});

const mapTrades = (data: Trade[]) => {
  let prev: Trade | undefined = undefined;
  return data
    .toReversed()
    .map((trade) => {
      const mapped = mapTrade(trade, prev);
      prev = mapped;
      return mapped;
    })
    .toReversed();
};

const mergeTrades = (...trades: Trade[][]) =>
  Array.from(
    new Map(
      trades
        .slice(1)
        .reduce((a, trades) => [...a, ...trades], trades[0])
        .map((trade) => [trade.id, trade])
    ).values()
  ).toSorted((a, b) => b.id - a.id);

export const useTradeStream = (symbol: string, limit: number) =>
  useSWRSubscription<Trade[], Event, string>(
    getTradesStreamUrl(symbol),
    (key, { next }) => {
      fetcher<Trade[]>(getTradesUrl(symbol, limit + 1)).then((data) =>
        next(null, (prev) =>
          mapTrades(
            prev ? mergeTrades(prev, data).slice(0, limit) : data.toReversed()
          )
        )
      );
      const socket = new WebSocket(key);
      socket.addEventListener("message", ({ data }) =>
        next(null, (prev) =>
          [
            mapTradeStream(JSON.parse(data) as TradeStream, prev?.[0]),
            ...(prev || []),
          ].slice(0, limit)
        )
      );
      socket.addEventListener("error", (event) => next(event));
      return () => socket.close();
    }
  );

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit", // Add seconds
  hour12: false, // Use 24-hour format
});

const TradeRow = ({ trade }: { trade: Trade }) => (
  <div className="grid grid-cols-3 p-0.5 mb-0.5">
    <span
      className={trade.direction === "up" ? "text-green-500" : "text-red-500"}
    >
      {trade.price}
    </span>
    <span className="text-center">{trade.qty}</span>
    <span className="text-right">{dateTimeFormat.format(trade.time)}</span>
  </div>
);
export const Trades = ({
  symbol,
  limit = 10,
}: {
  symbol: string;
  limit?: number;
}) => {
  const { data, error } = useTradeStream(symbol, limit);
  return (
    <>
      <h2>Trades</h2>
      {error && <div>failed to load</div>}
      {!error && !data && <div>loading...</div>}
      {!error && data && (
        <div className="text-xs">
          <div className="grid grid-cols-3 p-0.5 mb-1">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Time</span>
          </div>
          {data?.map((trade) => (
            <TradeRow trade={trade} key={trade.id} />
          ))}
        </div>
      )}
    </>
  );
};
