"use client";

import { useEffect, useState } from "react";

type NewsItem = {
  headline: string;
  summary?: string;
  source?: string;
  url?: string;
  image?: string;
  datetime?: number;
};

function formatTime(timestamp?: number) {
  if (!timestamp) return "";

  const date = new Date(timestamp * 1000);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MarketNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  async function fetchNews(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/news/market"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch market news");
      }

      const result = await response.json();

      setNews(result.data || []);
      setShowAll(false);
    } catch (error) {
      console.error("Market news error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load market news"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchNews();
  }, []);

  const visibleNews = showAll ? news : news.slice(0, 6);

  return (
    <section className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#858a83]">
            Finance
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f4f2ed] sm:text-3xl">
            Market News
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#737970]">
            Latest financial and market developments.
          </p>
        </div>

        <button
          onClick={() => fetchNews(true)}
          disabled={refreshing}
          className="group flex items-center gap-2 rounded-xl border border-[#2a2d29] bg-[#20241f] px-3.5 py-2.5 text-sm text-[#858a83] transition hover:border-[#383d36] hover:text-[#f4f2ed] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            className={`text-base transition-transform ${
              refreshing ? "animate-spin" : "group-hover:rotate-180"
            }`}
          >
            ↻
          </span>

          <span className="hidden sm:inline">
            {refreshing ? "Refreshing" : "Refresh"}
          </span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18]"
            >
              <div className="h-52 animate-pulse bg-[#20241f]" />

              <div className="space-y-4 p-5">
                <div className="h-3 w-28 animate-pulse rounded bg-[#252925]" />
                <div className="h-5 w-full animate-pulse rounded bg-[#252925]" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-[#252925]" />
                <div className="h-3 w-24 animate-pulse rounded bg-[#252925]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-[#7c443b] bg-[#3a211e] p-5">
          <p className="text-sm font-medium text-[#f2a092]">
            Unable to load market news
          </p>

          <p className="mt-1 text-xs text-[#c98980]">
            {error}
          </p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && news.length === 0 && (
        <div className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-10 text-center">
          <p className="text-sm font-medium text-[#f4f2ed]">
            No market news available
          </p>

          <p className="mt-2 text-sm text-[#737970]">
            Check back later for the latest financial developments.
          </p>
        </div>
      )}

      {/* News */}
      {!loading && !error && news.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {visibleNews.map((item, index) => {
              const source = item.source || "Market News";
              const time = formatTime(item.datetime);

              return (
                <article
                  key={`${item.headline}-${index}`}
                  className="group overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#383d36] hover:bg-[#1b1e1b]"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden bg-[#20241f]">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-2xl font-semibold text-[#383d36]">
                          NEWS
                        </span>
                      </div>
                    )}

                    {/* Gradient */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#181b18] to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Source + Time */}
                    <div className="mb-3 flex items-center gap-2 text-[11px] text-[#737970]">
                      <span className="font-medium text-[#b7d67b]">
                        {source}
                      </span>

                      {time && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-[#4b504a]" />
                          <span>{time}</span>
                        </>
                      )}
                    </div>

                    {/* Headline */}
                    <h3 className="line-clamp-2 text-lg font-semibold leading-7 tracking-[-0.02em] text-[#f4f2ed]">
                      {item.headline}
                    </h3>

                    {/* Summary */}
                    {item.summary && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#858a83]">
                        {item.summary}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="mt-5 flex items-center justify-between border-t border-[#252925] pt-4">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-medium text-[#b7d67b] transition hover:text-[#d1e89d]"
                        >
                          Read article
                          <span className="transition-transform group-hover:translate-x-1">
                            →
                          </span>
                        </a>
                      ) : (
                        <span className="text-xs text-[#5f655e]">
                          Article unavailable
                        </span>
                      )}

                      <span className="text-[11px] text-[#4f554e]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* View All / Collapse */}
          {news.length > 6 && (
            <div className="mt-7 flex justify-center">
              <button
                onClick={() => {
                  setShowAll(!showAll);

                  if (!showAll) {
                    setTimeout(() => {
                      window.scrollBy({
                        top: 250,
                        behavior: "smooth",
                      });
                    }, 50);
                  }
                }}
                className="group flex items-center gap-2 rounded-xl border border-[#2a2d29] bg-[#20241f] px-5 py-3 text-sm font-medium text-[#858a83] transition hover:border-[#383d36] hover:bg-[#252925] hover:text-[#f4f2ed]"
              >
                {showAll ? "Show less" : "View all market news"}

                <span
                  className={`transition-transform ${
                    showAll
                      ? "rotate-180"
                      : "group-hover:translate-x-1"
                  }`}
                >
                  →
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}