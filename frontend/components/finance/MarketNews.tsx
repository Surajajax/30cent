"use client";

import { useEffect, useState } from "react";

type NewsArticle = {
  id: number;
  headline: string;
  summary?: string;
  source: string;
  image?: string;
  url: string;
  datetime: number;
  related?: string;
  category?: string;
};

export default function MarketNews() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/news/market"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch market news");
      }

      const result = await response.json();

      setNews(result.data || []);
    } catch (err) {
      console.error("News error:", err);
      setError("Unable to load market news.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <section className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-[#858a83]">
            Finance
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-[#f4f2ed]">
            Market News
          </h2>

          <p className="mt-2 text-sm text-[#858a83]">
            Latest financial and market developments
          </p>
        </div>

        <button
          onClick={fetchNews}
          disabled={loading}
          className="rounded-xl border border-[#2a2d29] bg-[#181b18] px-4 py-2 text-sm text-[#858a83] transition hover:bg-[#20241f] hover:text-[#f4f2ed] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="animate-pulse overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18]"
            >
              <div className="h-48 bg-[#20241f]" />

              <div className="space-y-3 p-5">
                <div className="h-3 w-24 rounded bg-[#2a2d29]" />
                <div className="h-5 w-full rounded bg-[#2a2d29]" />
                <div className="h-5 w-4/5 rounded bg-[#2a2d29]" />
                <div className="h-3 w-full rounded bg-[#252925]" />
                <div className="h-3 w-3/4 rounded bg-[#252925]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-[#7c443b] bg-[#3a211e] p-5">
          <p className="text-sm text-[#f2a092]">{error}</p>

          <button
            onClick={fetchNews}
            className="mt-4 rounded-xl border border-[#7c443b] px-4 py-2 text-sm text-[#f2a092] transition hover:bg-[#492824]"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && news.length === 0 && (
        <div className="rounded-2xl border border-[#2a2d29] bg-[#181b18] p-10 text-center">
          <p className="text-sm text-[#858a83]">
            No market news available right now.
          </p>
        </div>
      )}

      {/* News */}
      {!loading && !error && news.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.map((article) => (
            <article
              key={article.id}
              className="group overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18] transition hover:border-[#3a3e38] hover:bg-[#20241f]"
            >
              {/* Image */}
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="relative h-48 w-full overflow-hidden bg-[#20241f]">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-sm text-[#737970]">
                        30cent
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#181b18]/80 via-transparent to-transparent" />
                </div>
              </a>

              {/* Content */}
              <div className="p-5">
                {/* Source + time */}
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#b7d67b]">
                    {article.source}
                  </span>

                  <span className="shrink-0 text-xs text-[#737970]">
                    {formatTime(article.datetime)}
                  </span>
                </div>

                {/* Headline */}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <h3 className="line-clamp-3 text-base font-semibold leading-6 text-[#f4f2ed] transition group-hover:text-[#b7d67b]">
                    {article.headline}
                  </h3>
                </a>

                {/* Summary */}
                {article.summary && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#858a83]">
                    {article.summary}
                  </p>
                )}

                {/* Read article */}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#858a83] transition hover:text-[#f4f2ed]"
                >
                  Read article
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}