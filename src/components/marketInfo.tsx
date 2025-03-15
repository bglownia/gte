"use client";

import { getTickerPriceUrl } from "@/api";
import { fetcher } from "@/utils";
import useSWR from "swr";
export const MarketInfo = ({ symbol }: { symbol: string }) => {
  const { data, error } = useSWR<{ symbol: string; price: string }>(
    getTickerPriceUrl(symbol),
    fetcher
  );

  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  return (
    <h1>
      {data.symbol} - {data.price}
    </h1>
  );
};
