"use client";

import { useState } from "react";
import StockDetails from "./StockDetails";

interface StockResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  currency: string;
}

export default function StockSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  const searchStocks = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/stocks/search?query=${encodeURIComponent(
          query.trim()
        )}`
      );

      if (!response.ok) {
        throw new Error("Unable to search stocks");
      }

      const data = await response.json();

      setResults(data.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to search stocks");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      searchStocks();
    }
  };

  if (selectedStock) {
    return (
      <StockDetails
        symbol={selectedStock}
        onBack={() => setSelectedStock(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-4 sm:p-5">
        <div className="mb-4">
          <p className="eyebrow">Market search</p>

          <h2 className="mt-2 text-xl font-semibold text-[#f4f2ed]">
            Stock Search
          </h2>

          <p className="mt-1 text-sm text-[#858a83]">
            Search public equities and review key details.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search stocks..."
            className="flex-1 rounded-xl border border-[#2a2d29] bg-[#181b18] px-4 py-2.5 text-sm text-[#f4f2ed] placeholder:text-[#737970] outline-none transition focus:border-[#3a3e39] focus:ring-2 focus:ring-[#2a2d29]"
          />

          <button
            onClick={searchStocks}
            disabled={loading}
            className="rounded-xl border border-[#2a2d29] bg-[#181b18] px-4 py-2.5 text-sm font-medium text-[#f4f2ed] transition hover:border-[#3a3e39] hover:bg-[#20241f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-[#7c443b] bg-[#3a211e] p-4 text-sm text-[#f2a092]">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18]">
          {results.map((stock, index) => (
            <button
              key={`${stock.symbol}-${stock.exchange}`}
              onClick={() => setSelectedStock(stock.symbol)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#20241f] ${
                index !== results.length - 1
                  ? "border-b border-[#252925]"
                  : ""
              }`}
            >
              <div>
                <div className="font-semibold text-[#f4f2ed]">
                  {stock.symbol}
                </div>

                <div className="text-sm text-[#858a83]">
                  {stock.name}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-medium text-[#737970]">
                  {stock.exchange}
                </div>

                <div className="text-xs text-[#858a83]">
                  {stock.currency}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading &&
        query.trim() &&
        results.length === 0 &&
        !error && (
          <div className="rounded-2xl border border-[#2a2d29] bg-[#181b18] px-4 py-6 text-center text-sm text-[#858a83]">
            No stocks found.
          </div>
        )}
    </div>
  );
}
