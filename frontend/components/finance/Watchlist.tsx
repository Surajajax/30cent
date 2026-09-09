"use client";

import { useEffect, useState } from "react";

type Stock = {
  symbol: string;
  name?: string;
  currency?: string;
  price: number | null;
  previous_close: number | null;
  change: number | null;
  change_percent: number | null;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  volume?: number | null;
  latest_trading_day?: string;
};

export default function Watchlist() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchWatchlist() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://127.0.0.1:8000/api/market/watchlist"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch watchlist");
        }

        const result = await response.json();
        setStocks(result.data || []);
      } catch (error) {
        console.error("Watchlist error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load watchlist"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchWatchlist();
  }, []);

  return (
    <section className="w-full">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#858a83]">
            Your portfolio
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f4f2ed]">
            Watchlist
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#737970]">
            Tracked US stocks and market activity.
          </p>
        </div>

        {!loading && !error && stocks.length > 0 && (
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-sm text-[#858a83]">
              {stocks.length} stocks
            </span>

            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2d29] bg-[#20241f] text-[#858a83]">
              →
            </span>
          </div>
        )}
      </div>

      {/* Watchlist Container */}
      <div className="overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18]">
        {/* Loading */}
        {loading && (
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between border-b border-[#252925] px-5 py-5 last:border-b-0 sm:px-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-[#252925]" />

                  <div className="space-y-2">
                    <div className="h-4 w-16 animate-pulse rounded bg-[#252925]" />
                    <div className="h-3 w-24 animate-pulse rounded bg-[#252925]" />
                  </div>
                </div>

                <div className="space-y-2 text-right">
                  <div className="ml-auto h-4 w-20 animate-pulse rounded bg-[#252925]" />
                  <div className="ml-auto h-3 w-16 animate-pulse rounded bg-[#252925]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-6">
            <div className="rounded-xl border border-[#7c443b] bg-[#3a211e] p-4">
              <p className="text-sm font-medium text-[#f2a092]">
                Unable to load watchlist
              </p>

              <p className="mt-1 text-xs text-[#c98980]">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* No Data */}
        {!loading && !error && stocks.length === 0 && (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#2a2d29] bg-[#20241f] text-[#858a83]">
              +
            </div>

            <p className="mt-4 text-sm font-medium text-[#f4f2ed]">
              No stocks in your watchlist
            </p>

            <p className="mt-1 text-sm text-[#737970]">
              Search for a stock to start tracking it.
            </p>
          </div>
        )}

        {/* Stocks */}
        {!loading &&
          !error &&
          stocks.length > 0 && (
            <div>
              {/* Desktop table header */}
              <div className="hidden border-b border-[#2a2d29] px-6 py-3 md:grid md:grid-cols-[minmax(180px,1fr)_140px_120px_90px] md:items-center">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#5f655e]">
                  Stock
                </span>

                <span className="text-right text-[11px] font-medium uppercase tracking-[0.14em] text-[#5f655e]">
                  Price
                </span>

                <span className="text-right text-[11px] font-medium uppercase tracking-[0.14em] text-[#5f655e]">
                  Change
                </span>

                <span className="text-right text-[11px] font-medium uppercase tracking-[0.14em] text-[#5f655e]">
                  Market
                </span>
              </div>

              {stocks.map((stock, index) => {
                const positive = (stock.change ?? 0) >= 0;

                return (
                  <div
                    key={stock.symbol}
                    className={`group px-5 py-5 transition-colors hover:bg-[#20241f] sm:px-6 ${
                      index !== stocks.length - 1
                        ? "border-b border-[#252925]"
                        : ""
                    }`}
                  >
                    {/* Desktop */}
                    <div className="hidden md:grid md:grid-cols-[minmax(180px,1fr)_140px_120px_90px] md:items-center">
                      {/* Stock */}
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#30342f] bg-[#20241f] text-xs font-semibold text-[#f4f2ed]">
                          {stock.symbol.slice(0, 2)}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-[#f4f2ed]">
                            {stock.symbol}
                          </p>

                          <p className="mt-1 text-xs text-[#737970]">
                            {stock.name || "US Market"}
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#f4f2ed]">
                          {stock.price !== null
                            ? `$${stock.price.toFixed(2)}`
                            : "--"}
                        </p>
                      </div>

                      {/* Change */}
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${
                            positive
                              ? "text-[#b7d67b]"
                              : "text-[#f2a092]"
                          }`}
                        >
                          {stock.change_percent !== null
                            ? `${positive ? "+" : ""}${stock.change_percent.toFixed(
                                2
                              )}%`
                            : "--"}
                        </p>

                        <p
                          className={`mt-1 text-xs ${
                            positive
                              ? "text-[#8ea85c]"
                              : "text-[#bd756c]"
                          }`}
                        >
                          {stock.change !== null
                            ? `${positive ? "+" : ""}${stock.change.toFixed(
                                2
                              )}`
                            : "--"}
                        </p>
                      </div>

                      {/* Market */}
                      <div className="flex justify-end">
                        <span className="rounded-lg border border-[#2a2d29] bg-[#20241f] px-2.5 py-1 text-[11px] text-[#858a83]">
                          US
                        </span>
                      </div>
                    </div>

                    {/* Mobile */}
                    <div className="flex items-center justify-between gap-4 md:hidden">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#30342f] bg-[#20241f] text-xs font-semibold text-[#f4f2ed]">
                          {stock.symbol.slice(0, 2)}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#f4f2ed]">
                            {stock.symbol}
                          </p>

                          <p className="mt-1 truncate text-xs text-[#737970]">
                            {stock.name || "US Market"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[#f4f2ed]">
                          {stock.price !== null
                            ? `$${stock.price.toFixed(2)}`
                            : "--"}
                        </p>

                        <p
                          className={`mt-1 text-xs font-medium ${
                            positive
                              ? "text-[#b7d67b]"
                              : "text-[#f2a092]"
                          }`}
                        >
                          {stock.change_percent !== null
                            ? `${positive ? "+" : ""}${stock.change_percent.toFixed(
                                2
                              )}%`
                            : "--"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </section>
  );
}