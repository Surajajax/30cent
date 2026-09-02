"use client";

import { useState } from "react";

type Stock = {
  symbol: string;
  price: number;
  change: number;
  change_percent: string;
  open: number;
  high: number;
  low: number;
  volume: number;
  previous_close: number;
  latest_trading_day: string;
};

export default function StockSearch() {
  const [symbol, setSymbol] = useState("");
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchStock() {
    const ticker = symbol.trim().toUpperCase();

    if (!ticker) {
      return;
    }

    setLoading(true);
    setError("");
    setStock(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/market/quote?symbol=${ticker}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Stock not found"
        );
      }

      setStock(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      searchStock();
    }
  }

  return (
    <section>
      <div>
        <p className="eyebrow">Market data</p>
        <h2 className="mt-2 text-xl font-semibold">Search Stock</h2>
        <p className="mt-1 text-sm text-[#858a83]">Look up detailed information for any US stock.</p>
      </div>

      <div className="mt-5 flex gap-3">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter ticker e.g. AAPL"
          className="input-field flex-1"
        />

        <button
          onClick={searchStock}
          disabled={loading}
          className="button-primary shrink-0"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-[#7c443b] bg-[#3a211e] p-4 text-[#f2a092]">
          {error}
        </div>
      )}

      {stock && (
        <div className="mt-6 rounded-2xl border border-[#2a2d29] bg-[#181b18] p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-[#858a83]">
                Stock
              </div>

              <div className="text-2xl font-bold text-[#f4f2ed]">
                {stock.symbol}
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-[#f4f2ed]">
                ${stock.price.toFixed(2)}
              </div>

              <div
                className={`text-sm font-medium ${
                  stock.change >= 0
                    ? "text-[#b7d67b]"
                    : "text-[#f2a092]"
                }`}
              >
                {stock.change >= 0 ? "+" : ""}
                {stock.change.toFixed(2)}
                {" "}
                ({stock.change_percent})
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#252925]">
            <div>
              <div className="text-sm text-[#858a83]">
                Open
              </div>
              <div className="font-semibold text-[#f4f2ed]">
                ${stock.open.toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-sm text-[#858a83]">
                High
              </div>
              <div className="font-semibold text-[#f4f2ed]">
                ${stock.high.toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-sm text-[#858a83]">
                Low
              </div>
              <div className="font-semibold text-[#f4f2ed]">
                ${stock.low.toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-sm text-[#858a83]">
                Volume
              </div>
              <div className="font-semibold text-[#f4f2ed]">
                {stock.volume.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-5 text-sm text-[#858a83]">
            Latest trading day:{" "}
            {stock.latest_trading_day}
          </div>
        </div>
      )}
    </section>
  );
}