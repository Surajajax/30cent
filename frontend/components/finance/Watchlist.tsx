"use client";

import { useEffect, useState } from "react";

type Stock = {
  symbol: string;
  price: number;
  change: number;
  change_percent: string;
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
    <section>
      {/* Header */}
      <div>
        <p className="eyebrow">Your portfolio</p>
        <h2 className="mt-2 text-xl font-semibold">Watchlist</h2>
        <p className="mt-1 text-sm text-[#858a83]">Tracked US stocks and market activity.</p>
      </div>

      {/* Watchlist container */}
      <div className="mt-5 rounded-2xl border border-[#2a2d29] bg-[#181b18] overflow-hidden">

        {/* Loading */}
        {loading && (
          <div className="p-6 text-[#858a83]">
            Loading watchlist...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-6 text-[#f2a092]">
            {error}
          </div>
        )}

        {/* No data */}
        {!loading && !error && stocks.length === 0 && (
          <div className="p-6 text-[#858a83]">
            No market data available.
          </div>
        )}

        {/* Stocks */}
        {!loading &&
          !error &&
          stocks.map((stock, index) => {
            const positive = stock.change >= 0;

            return (
              <div
                key={stock.symbol}
                className={`flex items-center justify-between px-6 py-4 hover:bg-[#20241f] ${
                  index !== stocks.length - 1
                    ? "border-b border-[#252925]"
                    : ""
                }`}
              >
                {/* Stock information */}
                <div>
                  <div className="font-semibold text-[#f4f2ed]">
                    {stock.symbol}
                  </div>

                  <div className="text-sm text-[#858a83]">
                    US Market
                  </div>
                </div>

                {/* Price information */}
                <div className="text-right">
                  <div className="font-semibold text-[#f4f2ed]">
                    ${stock.price.toFixed(2)}
                  </div>

                  <div
                    className={`text-sm ${
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
              </div>
            );
          })}
      </div>
    </section>
  );
}