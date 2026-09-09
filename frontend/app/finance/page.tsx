import MarketOverview from "@/components/finance/MarketOverview";
import Watchlist from "@/components/finance/Watchlist";
import StockSearch from "@/components/finance/StockSearch";
import MarketNews from "@/components/finance/MarketNews";

export default function FinancePage() {
  return (
    <main className="min-h-screen bg-[#181b18] px-4 pb-16 pt-6 text-[#f4f2ed] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#858a83]">
                Markets
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#f4f2ed]">
                Finance
              </h1>

              <p className="mt-2 text-base text-[#858a83]">
                Your market command center
              </p>

              <p className="mt-1 max-w-xl text-sm leading-6 text-[#737970]">
                Track markets, monitor your watchlist, and discover what is
                moving the market.
              </p>
            </div>

            {/* Market indicator */}
            <div className="flex w-fit items-center gap-3 rounded-xl border border-[#2a2d29] bg-[#20241f] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#b7d67b]" />

              <span className="text-sm font-medium text-[#f4f2ed]">
                Markets · US
              </span>
            </div>
          </div>
        </header>

        {/* Market Overview */}
        <section>
          <MarketOverview />
        </section>

        {/* Watchlist + Snapshot */}
        <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <Watchlist />
          </div>

          {/* Market Snapshot */}
          <div className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-6">
            <div className="mb-7">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#858a83]">
                Overview
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                Market Snapshot
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#737970]">
                Quick view of your current market coverage.
              </p>
            </div>

            <div className="divide-y divide-[#2a2d29]">

              {/* Market */}
              <div className="flex items-center justify-between py-4 first:pt-0">
                <div>
                  <p className="text-sm text-[#858a83]">
                    Market
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#f4f2ed]">
                    United States
                  </p>
                </div>

                <span className="rounded-lg border border-[#2a2d29] px-2.5 py-1 text-xs text-[#858a83]">
                  US
                </span>
              </div>

              {/* Assets */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm text-[#858a83]">
                    Assets tracked
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#f4f2ed]">
                    Stocks
                  </p>
                </div>

                <span className="text-sm text-[#737970]">
                  5
                </span>
              </div>

              {/* Watchlist */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm text-[#858a83]">
                    Watchlist
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#f4f2ed]">
                    AAPL · MSFT · NVDA
                  </p>
                </div>

                <span className="text-sm text-[#737970]">
                  +2
                </span>
              </div>

              {/* News */}
              <div className="flex items-center justify-between py-4 last:pb-0">
                <div>
                  <p className="text-sm text-[#858a83]">
                    Market news
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#f4f2ed]">
                    Financial updates
                  </p>
                </div>

                <span className="flex items-center gap-2 text-xs text-[#b7d67b]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b7d67b]" />
                  Active
                </span>
              </div>

            </div>
          </div>
        </section>

        {/* Stock Search */}
        <section className="mt-12">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#858a83]">
              Discover
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Find a stock
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#737970]">
              Search public equities and review price, performance, and
              historical details.
            </p>
          </div>

          <StockSearch />
        </section>

        {/* Market News */}
        <section className="mt-14">
          <MarketNews />
        </section>

      </div>
    </main>
  );
}