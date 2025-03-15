import { Orderbook } from "@/app/components/orderBook";
import { Trades } from "@/app/components/trades";

export const MarketPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  return (
    <>
      <Orderbook symbol={slug} />
      <Trades symbol={slug} />
    </>
  );
};

export default MarketPage;
