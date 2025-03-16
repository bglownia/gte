"use client";
import { getDepthStreamUrl } from "@/api";
import useSWRSubscription from "swr/subscription";

type Depth = {
  lastUpdateId: number;
  bids: [string, string][]; // [PRICE, QTY][]
  asks: [string, string][]; // [PRICE, QTY][]
};

export const mapDepthToOrderbookRows = (
  rows: Depth["asks"] | Depth["bids"]
) => {
  let cumulativeQty = 0;
  return rows.map(([price, qty]) => ({
    price,
    qty,
    cumulativeQty: (cumulativeQty += Number(qty)),
  }));
};

export const depthToOrderbookData = (depth: Depth) => {
  const spread = Number(depth.asks[0][0]) - Number(depth.bids[0][0]);
  const spreadPercentage = (spread / Number(depth.asks[0][0])) * 100;
  const maxCumulativeQty = Math.max(
    depth.bids.reduce((a, [, qty]) => a + Number(qty), 0),
    depth.asks.reduce((a, [, qty]) => a + Number(qty), 0)
  );
  return {
    ...depth,
    bids: mapDepthToOrderbookRows(depth.bids),
    asks: mapDepthToOrderbookRows(depth.asks).toReversed(),
    spread,
    spreadPercentage,
    maxCumulativeQty,
  };
};

export const useDepthStream = (symbol: string, limit: number) =>
  useSWRSubscription<ReturnType<typeof depthToOrderbookData>, Event, string>(
    getDepthStreamUrl(symbol, limit),
    (key, { next }) => {
      const socket = new WebSocket(key);
      socket.addEventListener("message", ({ data }) => {
        next(null, depthToOrderbookData(JSON.parse(data)));
      });
      socket.addEventListener("error", (event) => next(event));
      return () => socket.close();
    }
  );

const OrderbookRow = ({
  price,
  qty,
  maxCumulativeQty,
  cumulativeQty,
  isAsk,
}: {
  price: string;
  qty: string;
  maxCumulativeQty: number;
  cumulativeQty: number;
  isAsk?: boolean;
}) => (
  <div className="relative mb-0.5">
    <div className="grid grid-cols-2 p-0.5">
      <span className={isAsk ? "text-red-500" : "text-green-500"}>{price}</span>
      <span className="text-right">{qty}</span>
    </div>
    <div
      className={`absolute left-0 bottom-0 top-0 -z-10 opacity-20 ${
        isAsk ? "bg-red-500" : "bg-green-500"
      }`}
      style={{ width: `${(cumulativeQty * 100) / maxCumulativeQty}%` }}
    ></div>
  </div>
);

const OrderbookMid = ({
  spread,
  spreadPercentage,
}: {
  spread: number;
  spreadPercentage: number;
}) => (
  <div className="mb-0.5 bg-gray-500/20">
    <div className="grid grid-cols-3 p-0.5 text-center">
      <span>Spread</span>
      <span>{spread.toFixed(6)}</span>
      <span>{spreadPercentage.toFixed(3)}%</span>
    </div>
  </div>
);

export const Orderbook = ({
  symbol,
  limit = 10,
}: {
  symbol: string;
  limit?: number;
}) => {
  const { data, error } = useDepthStream(symbol, limit);
  return (
    <>
      <h2>Order Book</h2>
      {error && <div>failed to load</div>}
      {!error && !data && <div>loading...</div>}
      {!error && data && (
        <div className="text-xs">
          <div className="grid grid-cols-2 p-0.5 mb-1">
            <span>Price</span>
            <span className="text-right">Size</span>
          </div>
          {data.asks.map((props) => (
            <OrderbookRow
              {...props}
              maxCumulativeQty={data.maxCumulativeQty}
              key={props.price}
              isAsk
            />
          ))}
          <OrderbookMid
            spread={data.spread}
            spreadPercentage={data.spreadPercentage}
          />
          {data?.bids.map((props) => (
            <OrderbookRow
              {...props}
              maxCumulativeQty={data.maxCumulativeQty}
              key={props.price}
            />
          ))}
        </div>
      )}
    </>
  );
};
