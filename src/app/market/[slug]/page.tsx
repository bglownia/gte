import { Orderbook } from "@/app/components/orderBook";

export const MarketPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  return <Orderbook symbol={slug} />;
};

export default MarketPage;
