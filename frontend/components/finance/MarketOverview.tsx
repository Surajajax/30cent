"use client";

import { useEffect, useState } from "react";

type Stock = {
  symbol: string;
  price: number;
  change: number;
  change_percent: string;
};

export default function MarketOverview() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMarketOverview() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://127.0.0.1:8000/api/market/watchlist"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch market data"
          );
        }

        const result = await response.json();

        setStocks(result.data || []);
      } catch (error) {
        console.error(
          "Market data error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load market data"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchMarketOverview();
  }, []);

  return (
    <section>
      {/* Section Header */}
      <div>
        <p className="eyebrow">Financial markets</p>
        <h2 className="mt-2 text-xl font-semibold">Market Overview</h2>
        <p className="mt-1 text-sm text-[#858a83]">Top US stocks and their latest movements.</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-5 animate-pulse"
            >
              <div className="h-5 w-16 bg-[#2a2d29] rounded mb-5" />
              <div className="h-8 w-28 bg-[#2a2d29] rounded mb-3" />
              <div className="h-4 w-20 bg-[#2a2d29] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-5 rounded-2xl border border-[#7c443b] bg-[#3a211e] p-6 text-[#f2a092]">
          {error}
        </div>
      )}

      {/* No Data */}
      {!loading &&
        !error &&
        stocks.length === 0 && (
          <div className="mt-5 rounded-2xl border border-[#2a2d29] bg-[#181b18] p-6 text-[#858a83]">
            No market data available.
          </div>
        )}

      {/* Market Cards */}
      {!loading &&
        !error &&
        stocks.length > 0 && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stocks.map((stock) => {
              const positive = stock.change >= 0;

              return (
                <div
                  key={stock.symbol}
                  className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-5"
                >
                  {/* Symbol */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-lg text-[#f4f2ed]">
                      {stock.symbol}
                    </span>
                    <span className="text-xs text-[#737970]">US</span>
                  </div>

                  {/* Price */}
                  <div className="text-2xl font-bold text-[#f4f2ed]">
                    ${stock.price.toFixed(2)}
                  </div>

                  {/* Change */}
                  <div
                    className={`mt-2 text-sm font-medium ${
                      positive
                        ? "text-[#b7d67b]"
                        : "text-[#f2a092]"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {stock.change.toFixed(2)}
                    {" "}
                    ({stock.change_percent})
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </section>
  );
}