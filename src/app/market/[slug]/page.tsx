import { getTickerPriceUrl } from "@/api";
import { MarketInfo } from "@/components/marketInfo";
import { Orderbook } from "@/components/orderBook";
import { Trades } from "@/components/trades";
import { fetcher } from "@/utils";
import { SWRConfig } from "swr";

export const MarketPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const url = getTickerPriceUrl(slug);
  const data = await fetcher(url);
  return (
    <SWRConfig value={{ fallback: { [url]: data } }}>
      <MarketInfo symbol={slug} />
      <Orderbook symbol={slug} />
      <Trades symbol={slug} />
    </SWRConfig>
  );
};

export default MarketPage;
