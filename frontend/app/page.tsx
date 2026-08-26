"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  LoaderCircle,
  WalletCards,
} from "lucide-react";

import Header from "@/components/Header";

type Transaction = {
  transaction_id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  category: string | null;
  iso_currency_code: string | null;
};

const formatAmount = (
  amount: number,
  currency: string | null
) => {
  const value = Math.abs(amount).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return amount > 0 ? `-${value}` : `+${value}`;
};

const formatDate = (date: string) => {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
};

export default function HomePage() {
  const [transactions, setTransactions] = useState<
    Transaction[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null
  );

  // --------------------------------------------------
  // Fetch recent transactions
  // --------------------------------------------------

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "http://127.0.0.1:8000/api/plaid/transactions",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        // No connected bank is an empty state,
        // not an application error.
        if (response.status === 400) {
          if (
            data.detail ===
            "No bank account connected"
          ) {
            setTransactions([]);
            return;
          }
        }

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Failed to fetch transactions"
          );
        }

        setTransactions(
          Array.isArray(data.transactions)
            ? data.transactions
            : []
        );
      } catch (err) {
        console.error(
          "Transaction fetch error:",
          err
        );

        setError(
          "Unable to load recent transactions."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Only show the latest 10 transactions on Home.
  const recentTransactions =
    transactions.slice(0, 10);

  return (
    <>
      <Header />

      <main className="px-4 pb-12 pt-6 text-[#f4f2ed] sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1440px]">

          {/* ---------------------------------------- */}
          {/* Home Header */}
          {/* ---------------------------------------- */}

          <div className="mb-8">
            <p className="eyebrow">
              Personal finance dashboard
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Home
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[#989995]">
              Welcome to 30cent — your AI personal
              finance companion.
            </p>
          </div>

          {/* ---------------------------------------- */}
          {/* Cashflow + Transactions */}
          {/* ---------------------------------------- */}

          <section className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">

            {/* ====================================== */}
            {/* CASHFLOW */}
            {/* ====================================== */}

            <div className="min-h-[430px] rounded-2xl border border-[#2a2d29] bg-[#181b18]">

              <div className="flex items-start justify-between border-b border-[#2a2d29] p-5">

                <div>
                  <p className="eyebrow">
                    Financial overview
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Cashflow
                  </h2>

                  <p className="mt-1 text-sm text-[#858a83]">
                    Track your money in and money out.
                  </p>
                </div>

                <select
                  className="input-field w-auto min-w-[110px]"
                  defaultValue="6months"
                >
                  <option value="6months">
                    6 months
                  </option>

                  <option value="3months">
                    3 months
                  </option>

                  <option value="year">
                    This year
                  </option>
                </select>

              </div>

              {/* Cashflow chart placeholder */}

              <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#20241f]">

                  <ArrowUpRight
                    size={25}
                    className="text-[#b7d67b]"
                  />

                </div>

                <h3 className="mt-5 text-lg font-medium">
                  Cashflow
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-[#858a83]">
                  Your cashflow chart will appear here
                  using transactions from your connected
                  accounts.
                </p>

              </div>

            </div>

            {/* ====================================== */}
            {/* RECENT TRANSACTIONS */}
            {/* ====================================== */}

            <div className="flex flex-col rounded-2xl border border-[#2a2d29] bg-[#181b18]">

              {/* Header */}

              <div className="flex items-center justify-between border-b border-[#2a2d29] p-5">

                <div>
                  <p className="eyebrow">
                    Activity
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Transactions
                  </h2>
                </div>

                <Link
                  href="/transactions"
                  className="text-xs font-medium text-[#b7d67b] hover:underline"
                >
                  View all
                </Link>

              </div>

              {/* Loading */}

              {loading && (
                <div className="flex min-h-[330px] items-center justify-center">

                  <div className="flex items-center gap-2 text-sm text-[#858a83]">

                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />

                    Loading...

                  </div>

                </div>
              )}

              {/* Error */}

              {!loading && error && (
                <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">

                  <WalletCards
                    size={26}
                    className="text-[#6f766c]"
                  />

                  <p className="mt-4 text-sm text-[#f2a092]">
                    {error}
                  </p>

                </div>
              )}

              {/* No transactions */}

              {!loading &&
                !error &&
                recentTransactions.length === 0 && (
                  <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">

                    <WalletCards
                      size={28}
                      className="text-[#6f766c]"
                    />

                    <p className="mt-4 text-sm font-medium">
                      No transactions yet
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#858a83]">
                      Connect an account to see your
                      recent activity.
                    </p>

                    <Link
                      href="/connect"
                      className="mt-4 text-xs font-medium text-[#b7d67b] hover:underline"
                    >
                      Connect an account
                    </Link>

                  </div>
                )}

              {/* Recent Transactions List with Custom Themed Scrollbar */}

              {!loading &&
                !error &&
                recentTransactions.length > 0 && (
                  <div className="flex flex-1 flex-col justify-between">

                    {/* Scrollable Container with Custom Color Classes */}
                    <div className="max-h-[380px] overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#343a32] hover:[&::-webkit-scrollbar-thumb]:bg-[#53604d] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">

                      {recentTransactions.map(
                        (transaction, index) => {

                          const isExpense =
                            transaction.amount > 0;

                          const name =
                            transaction.merchant_name ||
                            transaction.name;

                          return (
                            <div
                              key={
                                transaction.transaction_id
                              }
                              className={`flex items-center justify-between gap-3 px-5 py-4 ${
                                index !==
                                recentTransactions.length - 1
                                  ? "border-b border-[#252925]"
                                  : ""
                              }`}
                            >

                              {/* Left */}

                              <div className="flex min-w-0 items-center gap-3">

                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                    isExpense
                                      ? "bg-[#252925]"
                                      : "bg-[#d9e8c2]"
                                  }`}
                                >

                                  {isExpense ? (
                                    <ArrowDownLeft
                                      size={16}
                                      className="text-[#aeb5a8]"
                                    />
                                  ) : (
                                    <ArrowUpRight
                                      size={16}
                                      className="text-[#405135]"
                                    />
                                  )}

                                </div>

                                <div className="min-w-0">

                                  <p className="truncate text-sm font-medium">
                                    {name}
                                  </p>

                                  <div className="mt-1 flex items-center gap-2">

                                    <span className="truncate text-xs text-[#737970]">
                                      {transaction.category ||
                                        "Transaction"}
                                    </span>

                                    <span className="text-[#555b53]">
                                      •
                                    </span>

                                    <span className="shrink-0 text-xs text-[#737970]">
                                      {formatDate(
                                        transaction.date
                                      )}
                                    </span>

                                  </div>

                                </div>

                              </div>

                              {/* Amount */}

                              <p
                                className={`shrink-0 text-sm font-semibold ${
                                  isExpense
                                    ? "text-[#f4f2ed]"
                                    : "text-[#b7d67b]"
                                }`}
                              >
                                {formatAmount(
                                  transaction.amount,
                                  transaction.iso_currency_code
                                )}
                              </p>

                            </div>
                          );
                        }
                      )}

                    </div>

                    {/* View all button pinned at bottom */}

                    <div className="border-t border-[#2a2d29] p-4">

                      <Link
                        href="/transactions"
                        className="flex w-full items-center justify-center rounded-lg border border-[#343a32] bg-[#20241f] py-2.5 text-xs font-medium text-[#c9cec4] transition hover:border-[#53604d] hover:bg-[#2a3028] hover:text-[#f4f2ed]"
                      >
                        View all transactions
                      </Link>

                    </div>

                  </div>
                )}

            </div>

          </section>

          {/* ---------------------------------------- */}
          {/* Calendar */}
          {/* ---------------------------------------- */}

          <section className="mt-5 min-h-[360px] rounded-2xl border border-[#2a2d29] bg-[#181b18]">

            <div className="flex items-center justify-between border-b border-[#2a2d29] p-5">

              <div>

                <p className="eyebrow">
                  Planning
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Calendar
                </h2>

                <p className="mt-1 text-sm text-[#858a83]">
                  Keep track of upcoming financial
                  events and important dates.
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20241f]">

                <CalendarDays
                  size={19}
                  className="text-[#a9b99b]"
                />

              </div>

            </div>

            {/* Calendar placeholder */}

            <div className="flex min-h-[270px] items-center justify-center px-6">

              <div className="text-center">

                <CalendarDays
                  size={32}
                  className="mx-auto text-[#555b53]"
                />

                <h3 className="mt-4 text-lg font-medium">
                  Calendar
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#858a83]">
                  Your financial calendar will appear
                  here. Upcoming bills, payments, goals,
                  and other important events can be
                  displayed in this section.
                </p>

              </div>

            </div>

          </section>

        </div>
      </main>
    </>
  );
}