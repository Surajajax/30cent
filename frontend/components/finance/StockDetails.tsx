"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface StockDetailsProps {
  symbol: string;
  onBack: () => void;
}

interface StockDetailsData {
  symbol: string;
  name: string;
  price: number | null;
  previous_close: number | null;
  change: number | null;
  change_percent: number | null;
  currency: string;
  market_cap: number | null;
  pe_ratio: number | null;
  volume: number | null;
  average_volume: number | null;
  day_high: number | null;
  day_low: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  sector: string | null;
  industry: string | null;
  website: string | null;
  description: string | null;
}

interface HistoryItem {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

interface HistoryResponse {
  symbol: string;
  period: string;
  data: HistoryItem[];
}

const periods = [
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
  { label: "2Y", value: "2y" },
  { label: "5Y", value: "5y" },
];

export default function StockDetails({
  symbol,
  onBack,
}: StockDetailsProps) {
  const [stock, setStock] = useState<StockDetailsData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [period, setPeriod] = useState("6mo");

  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/stocks/details?symbol=${encodeURIComponent(
            symbol
          )}`
        );

        if (!response.ok) {
          throw new Error("Unable to load stock details");
        }

        const data = await response.json();

        setStock(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load stock details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [symbol]);

  useEffect(() => {
    const fetchHistory = async () => {
      setChartLoading(true);

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/stocks/history?symbol=${encodeURIComponent(
            symbol
          )}&period=${period}`
        );

        if (!response.ok) {
          throw new Error("Unable to load stock history");
        }

        const data: HistoryResponse = await response.json();

        setHistory(data.data || []);
      } catch (err) {
        console.error(err);
        setHistory([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchHistory();
  }, [symbol, period]);

  const formatPrice = (value: number | null) => {
    if (value === null || value === undefined) {
      return "--";
    }

    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) {
      return "--";
    }

    return new Intl.NumberFormat("en-US").format(value);
  };

  const formatMarketCap = (value: number | null) => {
    if (value === null || value === undefined) {
      return "--";
    }

    if (value >= 1_000_000_000_000) {
      return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    }

    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }

    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }

    return `$${formatNumber(value)}`;
  };

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) {
      return "--";
    }

    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const chartData = history
    .filter((item) => item.close !== null)
    .map((item) => ({
      date: item.date,
      price: item.close,
    }));

  if (loading) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="text-sm font-medium text-[#858a83] transition hover:text-[#f4f2ed]"
        >
          ← Back to search
        </button>

        <div className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-8 text-center text-sm text-[#858a83]">
          Loading {symbol}...
        </div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="text-sm font-medium text-[#858a83] transition hover:text-[#f4f2ed]"
        >
          ← Back to search
        </button>

        <div className="rounded-2xl border border-[#7c443b] bg-[#3a211e] p-6 text-center text-sm text-[#f2a092]">
          {error || "Stock not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="text-sm font-medium text-[#858a83] transition hover:text-[#f4f2ed]"
      >
        ← Back to search
      </button>

      <div className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[#f4f2ed]">
                {stock.symbol}
              </h2>

              <span className="rounded-md border border-[#2a2d29] bg-[#20241f] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#737970]">
                US
              </span>
            </div>

            <p className="mt-1 text-sm text-[#858a83]">{stock.name}</p>
          </div>

          <div className="sm:text-right">
            <div className="text-3xl font-bold text-[#f4f2ed]">
              {formatPrice(stock.price)}
            </div>

            <div
              className={`mt-1 text-sm font-medium ${
                (stock.change ?? 0) >= 0 ? "text-[#b7d67b]" : "text-[#f2a092]"
              }`}
            >
              {stock.change !== null
                ? `${stock.change >= 0 ? "+" : ""}$${Math.abs(
                    stock.change
                  ).toFixed(2)}`
                : "--"}

              {"  "}

              {formatPercent(stock.change_percent)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-5 sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-semibold text-[#f4f2ed]">Price History</h3>

            <p className="text-xs text-[#858a83]">
              {stock.symbol} closing price
            </p>
          </div>

          <div className="flex gap-1 rounded-xl border border-[#2a2d29] bg-[#181b18] p-1">
            {periods.map((item) => (
              <button
                key={item.value}
                onClick={() => setPeriod(item.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  period === item.value
                    ? "border border-[#2a2d29] bg-[#20241f] text-[#f4f2ed]"
                    : "text-[#858a83] hover:text-[#f4f2ed]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px] w-full sm:h-[320px]">
          {chartLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-[#858a83]">
              Loading chart...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[#858a83]">
              No chart data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid
                  stroke="#2a2d29"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#858a83" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={35}
                />

                <YAxis
                  tick={{ fontSize: 11, fill: "#858a83" }}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
                />

                <Tooltip
                  formatter={(value) => [
                    `$${Number(value).toFixed(2)}`,
                    "Price",
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: "#181b18",
                    border: "1px solid #2a2d29",
                    borderRadius: "12px",
                    color: "#f4f2ed",
                  }}
                  labelStyle={{ color: "#f4f2ed" }}
                  itemStyle={{ color: "#f4f2ed" }}
                />

                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#b7d67b"
                  fill="#b7d67b"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-[#f4f2ed]">Key Statistics</h3>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Market Cap" value={formatMarketCap(stock.market_cap)} />
          <StatCard
            label="P/E Ratio"
            value={stock.pe_ratio !== null ? stock.pe_ratio.toFixed(2) : "--"}
          />
          <StatCard label="Volume" value={formatNumber(stock.volume)} />
          <StatCard
            label="Average Volume"
            value={formatNumber(stock.average_volume)}
          />
          <StatCard label="Day High" value={formatPrice(stock.day_high)} />
          <StatCard label="Day Low" value={formatPrice(stock.day_low)} />
          <StatCard
            label="52 Week High"
            value={formatPrice(stock.fifty_two_week_high)}
          />
          <StatCard
            label="52 Week Low"
            value={formatPrice(stock.fifty_two_week_low)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-5 sm:p-6">
        <h3 className="mb-4 font-semibold text-[#f4f2ed]">
          Company Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#737970]">
              Sector
            </p>

            <p className="mt-1 text-sm font-medium text-[#f4f2ed]">
              {stock.sector || "--"}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#737970]">
              Industry
            </p>

            <p className="mt-1 text-sm font-medium text-[#f4f2ed]">
              {stock.industry || "--"}
            </p>
          </div>
        </div>

        {stock.description && (
          <div className="mt-5 border-t border-[#252925] pt-5">
            <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[#737970]">
              About
            </p>

            <p className="text-sm leading-6 text-[#858a83]">
              {stock.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-[#737970]">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-[#f4f2ed]">{value}</p>
    </div>
  );
}
