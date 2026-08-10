"use client";

import { Bell, Search, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [query, setQuery] = useState("");

  return (
    <header className="px-4 py-4 text-[#ececec] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-screen-xl justify-center gap-3">
        <div className="relative flex min-w-0 w-full max-w-[640px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 shadow-sm shadow-black/10">
          <div className="text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="min-w-0 w-full pr-8 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 text-white/80"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
