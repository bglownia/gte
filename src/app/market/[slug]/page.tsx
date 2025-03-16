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
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="md:w-2xs">
            <Orderbook symbol={slug} />
          </div>
          <div className="md:w-2xs">
            <Trades symbol={slug} limit={21} />
          </div>
        </div>
      </SWRConfig>
    </main>
  );
}
