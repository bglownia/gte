import { getTickerPriceUrl } from "@/api";
import { MarketInfo } from "@/components/marketInfo";
import { Orderbook } from "@/components/orderBook";
import { Trades } from "@/components/trades";
import { fetcher } from "@/utils";
import { SWRConfig } from "swr";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const url = getTickerPriceUrl(slug);
  const data = await fetcher(url);
  return (
    <main className="p-4">
      <SWRConfig value={{ fallback: { [url]: data } }}>
        <MarketInfo symbol={slug} />
        <div className="flex gap-4">
          <Orderbook symbol={slug} />
          <Trades symbol={slug} limit={21} />
        </div>
      </SWRConfig>
    </main>
  );
}
