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
          "http://127.0.0.1:8000/api/market/overview"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch market data");
        }

        const result = await response.json();

        setStocks(result.data || []);
      } catch (error) {
        console.error("Market data error:", error);

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

        <h2 className="mt-2 text-xl font-semibold">
          Market Overview
        </h2>

        <p className="mt-1 text-sm text-[#858a83]">
          Top US stocks and their latest movements.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-[#2a2d29] bg-[#181b18] p-5"
            >
              <div className="mb-5 h-5 w-16 rounded bg-[#2a2d29]" />

              <div className="mb-3 h-8 w-28 rounded bg-[#2a2d29]" />

              <div className="h-4 w-20 rounded bg-[#2a2d29]" />
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
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stocks.map((stock) => {
              const positive = (stock.change ?? 0) >= 0;

              return (
                <div
                  key={stock.symbol}
                  className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-5"
                >
                  {/* Symbol */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-lg font-semibold text-[#f4f2ed]">
                      {stock.symbol}
                    </span>

                    <span className="text-xs text-[#737970]">
                      US
                    </span>
                  </div>

                  {/* Price */}
                  <div className="text-2xl font-bold text-[#f4f2ed]">
                    {stock.price !== null
                      ? `$${stock.price.toFixed(2)}`
                      : "--"}
                  </div>

                  {/* Change */}
                  <div
                    className={`mt-2 text-sm font-medium ${
                      positive
                        ? "text-[#b7d67b]"
                        : "text-[#f2a092]"
                    }`}
                  >
                    {stock.change !== null
                      ? `${positive ? "+" : ""}${stock.change.toFixed(
                          2
                        )}`
                      : "--"}

                    {" "}

                    {stock.change_percent !== null
                      ? `(${positive ? "+" : ""}${stock.change_percent.toFixed(
                          2
                        )}%)`
                      : "(--)"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </section>
  );
}