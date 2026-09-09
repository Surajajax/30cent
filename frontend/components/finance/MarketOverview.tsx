"use client";

import { useEffect, useState } from "react";

type MarketIndex = {
  symbol: string;
  name: string;
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

const INDEX_META: Record<
  string,
  {
    label: string;
    description: string;
  }
> = {
  "^GSPC": {
    label: "S&P 500",
    description: "Large-cap US equities",
  },
  "^IXIC": {
    label: "NASDAQ",
    description: "Technology-heavy US index",
  },
  "^DJI": {
    label: "DOW JONES",
    description: "30 major US companies",
  },
};

export default function MarketOverview() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
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

        setIndices(result.data || []);
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
    <section className="w-full">
      {/* Section heading */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#858a83]">
            US Markets
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f4f2ed]">
            Market Overview
          </h2>

          <p className="mt-2 text-sm text-[#858a83]">
            Major US indices and their latest movements.
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-xl border border-[#2a2d29] bg-[#20241f] px-3 py-2 sm:flex">
          <span className="h-2 w-2 rounded-full bg-[#b7d67b]" />

          <span className="text-xs text-[#858a83]">
            Market data
          </span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18] p-6"
            >
              <div className="h-4 w-24 rounded bg-[#2a2d29]" />

              <div className="mt-5 h-8 w-36 rounded bg-[#2a2d29]" />

              <div className="mt-3 h-5 w-28 rounded bg-[#2a2d29]" />

              <div className="mt-8 h-16 w-full rounded bg-[#20241f]" />

              <div className="mt-6 flex justify-between">
                <div className="h-3 w-16 rounded bg-[#2a2d29]" />
                <div className="h-3 w-16 rounded bg-[#2a2d29]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-[#7c443b] bg-[#3a211e] p-6">
          <p className="text-sm text-[#f2a092]">
            {error}
          </p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && indices.length === 0 && (
        <div className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-6">
          <p className="text-sm text-[#858a83]">
            No market data available.
          </p>
        </div>
      )}

      {/* Index cards */}
      {!loading && !error && indices.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {indices.map((index) => {
            const positive = (index.change ?? 0) >= 0;

            const meta = INDEX_META[index.symbol] ?? {
              label: index.name,
              description: "US market index",
            };

            return (
              <div
                key={index.symbol}
                className="group overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18] p-6 transition duration-200 hover:border-[#3a3e38] hover:bg-[#1c201c]"
              >
                {/* Top */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold tracking-tight text-[#f4f2ed]">
                      {meta.label}
                    </p>

                    <p className="mt-1 text-xs text-[#737970]">
                      {index.symbol}
                    </p>
                  </div>

                  <span className="rounded-lg border border-[#2a2d29] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#737970]">
                    US
                  </span>
                </div>

                {/* Price */}
                <div className="mt-6">
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-[#f4f2ed]">
                    {index.price !== null
                      ? index.price.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "--"}
                  </p>

                  {/* Change */}
                  <div
                    className={`mt-2 flex items-center gap-2 text-sm font-medium ${
                      positive
                        ? "text-[#b7d67b]"
                        : "text-[#f2a092]"
                    }`}
                  >
                    <span>
                      {index.change !== null
                        ? `${positive ? "+" : ""}${index.change.toFixed(
                            2
                          )}`
                        : "--"}
                    </span>

                    <span>
                      (
                      {index.change_percent !== null
                        ? `${positive ? "+" : ""}${index.change_percent.toFixed(
                            2
                          )}%`
                        : "--"}
                      )
                    </span>

                    <span className="text-base">
                      {positive ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Mini chart decoration */}
                <div className="mt-7 h-16 w-full overflow-hidden">
                  <svg
                    viewBox="0 0 300 70"
                    preserveAspectRatio="none"
                    className="h-full w-full"
                  >
                    <defs>
                      <linearGradient
                        id={`gradient-${index.symbol}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={
                            positive ? "#b7d67b" : "#f2a092"
                          }
                          stopOpacity="0.18"
                        />
                        <stop
                          offset="100%"
                          stopColor={
                            positive ? "#b7d67b" : "#f2a092"
                          }
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    <path
                      d={
                        positive
                          ? "M0 55 L25 48 L45 51 L65 40 L85 44 L105 32 L125 36 L145 25 L165 30 L185 18 L205 22 L225 14 L245 19 L265 9 L285 14 L300 6 L300 70 L0 70 Z"
                          : "M0 15 L25 24 L45 20 L65 32 L85 27 L105 38 L125 34 L145 45 L165 40 L185 49 L205 44 L225 54 L245 49 L265 59 L285 54 L300 62 L300 70 L0 70 Z"
                      }
                      fill={`url(#gradient-${index.symbol})`}
                    />

                    <path
                      d={
                        positive
                          ? "M0 55 L25 48 L45 51 L65 40 L85 44 L105 32 L125 36 L145 25 L165 30 L185 18 L205 22 L225 14 L245 19 L265 9 L285 14 L300 6"
                          : "M0 15 L25 24 L45 20 L65 32 L85 27 L105 38 L125 34 L145 45 L165 40 L185 49 L205 44 L225 54 L245 49 L265 59 L285 54 L300 62"
                      }
                      fill="none"
                      stroke={
                        positive ? "#b7d67b" : "#f2a092"
                      }
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>

                {/* High / Low */}
                <div className="mt-5 flex items-center justify-between border-t border-[#2a2d29] pt-4">
                  <div>
                    <p className="text-xs text-[#737970]">
                      Day high
                    </p>

                    <p className="mt-1 text-sm font-medium text-[#f4f2ed]">
                      {index.high !== null &&
                      index.high !== undefined
                        ? index.high.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "--"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-[#737970]">
                      Day low
                    </p>

                    <p className="mt-1 text-sm font-medium text-[#f4f2ed]">
                      {index.low !== null &&
                      index.low !== undefined
                        ? index.low.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "--"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}