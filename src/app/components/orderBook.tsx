"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Depth = {
  lastUpdateId: number;
  bids: [number, number][]; // [PRICE, QTY][]
  asks: [number, number][]; // [PRICE, QTY][]
};

type DepthStream = {
  e: "depthUpdate"; // Event type
  E: number; // Event time
  s: string; // Symbol
  U: number; // First update ID in event
  u: number; // Final update ID in event
  b: [number, number][]; // Bids to be updated  [PRICE, QTY][]
  a: [number, number][]; // Asks to be updated  [PRICE, QTY][]
};

const updateSide = (data: Map<number, number>, delta: [number, number][]) =>
  delta.reduce((acc, [price, qty]) => {
    if (qty === 0) {
      acc.delete(price);
    } else {
      acc.set(price, qty);
    }
    return acc;
  }, new Map(data));

const updateDepth = (data: Depth, delta: DepthStream): Depth => {
  if (delta.U <= data.lastUpdateId) {
    return data;
  }
  return {
    ...data,
    lastUpdateId: delta.U,
    bids: Array.from(updateSide(new Map(data.bids), delta.b).entries()),
    asks: Array.from(updateSide(new Map(data.asks), delta.a).entries()),
  };
};

const useDepth = (symbol: string) => {
  const wsMessageBuffer = useRef<DepthStream[]>([]);
  const isFetching = useRef(true);
  const isSubscribed = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState<Depth | null>(null);

  const fetchDepth = useCallback(
    () =>
      fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}`)
        .then((res) => res.json())
        .then((data: Depth) => {
          if (data.lastUpdateId < wsMessageBuffer.current[0].U) {
            fetchDepth();
          }
          isFetching.current = false;
          setData(
            wsMessageBuffer.current.reduce(
              (data, delta) => updateDepth(data, delta),
              data
            )
          );
          wsMessageBuffer.current = [];
          setIsLoading(false);
        }),
    [symbol]
  );

  useEffect(() => {
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth`
    );
    ws.onmessage = (event) => {
      if (!isSubscribed.current) {
        fetchDepth();
        isSubscribed.current = true;
      }
      const data = JSON.parse(event.data) as DepthStream;
      if (isFetching.current) {
        wsMessageBuffer.current.push(data);
      } else {
        setData((prev) => prev && updateDepth(prev, data));
      }
    };
    ws.onopen = () => {};
    return () => ws.close();
  }, [symbol, fetchDepth]);
  return { data, isLoading, isError };
};

export const Orderbook = ({ symbol }: { symbol: string }) => {
  const { data, isError, isLoading } = useDepth(symbol);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }

  return (
    <div>
      <h1>Orderbook</h1>
      <div>
        {data?.bids.map(([price, qty]) => (
          <div key={price}>
            <span>{price}</span> | <span>{qty}</span>
          </div>
        ))}
      </div>
      <pre>{JSON.stringify({ isLoading, data, isError })}</pre>
    </div>
  );
};
