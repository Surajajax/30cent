import MarketOverview from "@/components/finance/MarketOverview";
import Watchlist from "@/components/finance/Watchlist";
import StockSearch from "@/components/finance/StockSearch";

export default function FinancePage() {
  return (
    <main className="px-4 pb-12 pt-6 text-[#f4f2ed] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">

        {/* Header */}
        <div className="mb-8">
          <p className="eyebrow">
            Investment portfolio
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Finance
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[#989995]">
            Track the US stock market, your watchlist, and individual stocks.
          </p>
        </div>

        {/* Market Overview */}
        <section className="mt-8">
          <MarketOverview />
        </section>

        {/* Watchlist */}
        <section className="mt-8">
          <Watchlist />
        </section>

        {/* Search */}
        <section className="mt-8">
          <StockSearch />
        </section>

      </div>
    </main>
  );
}