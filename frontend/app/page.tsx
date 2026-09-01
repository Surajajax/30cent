"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";

import Cashflow, {
  type MonthlyCashflow,
} from "@/components/Cashflow";

import TransactionList, {
  type Transaction,
} from "@/components/TransactionList";

type Account = {
  account_id: string;
  name: string;
  type: string;
  subtype: string;
  mask: string | null;

  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string | null;
  };
};

/*
 * Convert a date into:
 * YYYY-MM
 */
const getMonthKey = (date: Date) => {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

/*
 * Convert a date into:
 * Jan, Feb, Mar...
 */
const getMonthLabel = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
  });
};

export default function HomePage() {
  /*
   * PLAID DATA
   */
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [account, setAccount] =
    useState<Account | null>(null);

  /*
   * PAGE STATE
   */
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * CASHFLOW MAXIMIZE STATE
   */
  const [cashflowExpanded, setCashflowExpanded] =
    useState(false);

  /*
   * FETCH PLAID DATA
   */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        /*
         * Get checking account
         */
        const accountsResponse = await fetch(
          "http://127.0.0.1:8000/api/plaid/accounts",
          {
            cache: "no-store",
          }
        );

        /*
         * Get transactions
         */
        const transactionsResponse = await fetch(
          "http://127.0.0.1:8000/api/plaid/transactions",
          {
            cache: "no-store",
          }
        );

        const accountsData =
          await accountsResponse.json();

        const transactionsData =
          await transactionsResponse.json();

        /*
         * NO BANK CONNECTED
         */
        if (
          accountsResponse.status === 400 ||
          transactionsResponse.status === 400
        ) {
          setAccount(null);
          setTransactions([]);
          return;
        }

        /*
         * ACCOUNT API ERROR
         */
        if (!accountsResponse.ok) {
          throw new Error(
            accountsData.detail ||
              "Failed to load checking account"
          );
        }

        /*
         * TRANSACTION API ERROR
         */
        if (!transactionsResponse.ok) {
          throw new Error(
            transactionsData.detail ||
              "Failed to load transactions"
          );
        }

        /*
         * FIND CHECKING ACCOUNT
         */
        const checkingAccount =
          accountsData.accounts?.find(
            (item: Account) =>
              item.type === "depository" &&
              item.subtype === "checking"
          ) ?? null;

        setAccount(checkingAccount);

        /*
         * PLAID TRANSACTIONS
         */
        const plaidTransactions =
          Array.isArray(
            transactionsData.transactions
          )
            ? transactionsData.transactions
            : [];

        console.log(
          "Plaid checking transactions:",
          plaidTransactions
        );

        setTransactions(plaidTransactions);
      } catch (err) {
        console.error(
          "Dashboard fetch error:",
          err
        );

        setError(
          "Unable to load your financial data."
        );

        setAccount(null);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  /*
   * CURRENCY
   */
  const currency =
    account?.balances.iso_currency_code ||
    "USD";

  /*
   * MONTHLY CASHFLOW
   *
   * Uses every month that exists
   * in the Plaid transaction data.
   */
  const monthlyCashflow =
    useMemo<MonthlyCashflow[]>(() => {
      if (transactions.length === 0) {
        return [];
      }

      /*
       * Group transactions by month
       */
      const monthMap = new Map<
        string,
        MonthlyCashflow
      >();

      transactions.forEach((transaction) => {
        const transactionDate = new Date(
          `${transaction.date}T00:00:00`
        );

        /*
         * Ignore invalid dates
         */
        if (
          Number.isNaN(
            transactionDate.getTime()
          )
        ) {
          return;
        }

        const monthKey =
          getMonthKey(transactionDate);

        const monthLabel =
          getMonthLabel(transactionDate);

        /*
         * Create month if it doesn't exist
         */
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            key: monthKey,
            label: monthLabel,
            income: 0,
            expenses: 0,
            netCashflow: 0,
          });
        }

        const month =
          monthMap.get(monthKey)!;

        /*
         * Plaid convention:
         *
         * Positive amount = money OUT
         * Negative amount = money IN
         */

        if (transaction.amount < 0) {
          month.income += Math.abs(
            transaction.amount
          );
        } else if (
          transaction.amount > 0
        ) {
          month.expenses +=
            transaction.amount;
        }

        /*
         * Calculate monthly net cashflow
         */
        month.netCashflow =
          month.income -
          month.expenses;
      });

      /*
       * Convert Map to array
       *
       * Oldest month → newest month
       */
      return Array.from(
        monthMap.values()
      ).sort((a, b) =>
        a.key.localeCompare(b.key)
      );
    }, [transactions]);

  /*
   * TOTAL INCOME
   */
  const income = useMemo(() => {
    return monthlyCashflow.reduce(
      (total, month) =>
        total + month.income,
      0
    );
  }, [monthlyCashflow]);

  /*
   * TOTAL EXPENSES
   */
  const expenses = useMemo(() => {
    return monthlyCashflow.reduce(
      (total, month) =>
        total + month.expenses,
      0
    );
  }, [monthlyCashflow]);

  /*
   * NET CASHFLOW
   */
  const netCashflow =
    income - expenses;

  /*
   * CHECKING BALANCE
   *
   * This is the actual current balance
   * returned by Plaid.
   */
  const balance =
    account?.balances.current ?? 0;

  return (
    <>
      <Header />

      <main className="px-4 pb-12 pt-6 text-[#f4f2ed] sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1440px]">

          {/* PAGE HEADER */}

          <div className="mb-8">
            <p className="eyebrow">
              Personal finance dashboard
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Home
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[#989995]">
              Welcome to 30cent — your AI
              personal finance companion.
            </p>
          </div>

          {/* CASHFLOW + TRANSACTIONS */}

          <section
            className={
              cashflowExpanded
                ? "relative"
                : "grid items-stretch gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]"
            }
          >

            {/* CASHFLOW */}

            <Cashflow
              monthlyCashflow={
                monthlyCashflow
              }
              balance={balance}
              currency={currency}
              income={income}
              expenses={expenses}
              netCashflow={netCashflow}
              expanded={
                cashflowExpanded
              }
              onToggleExpand={() =>
                setCashflowExpanded(
                  (value) => !value
                )
              }
            />

            {/* TRANSACTIONS */}

            {!cashflowExpanded && (
              <TransactionList
                transactions={
                  transactions
                }
                loading={loading}
                error={error}
                currency={currency}
              />
            )}
          </section>

          {/* CALENDAR */}

          <section className="mt-5 min-h-[360px] overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18]">

            {/* CALENDAR HEADER */}

            <div className="flex items-center justify-between border-b border-[#2a2d29] p-5">

              <div>
                <p className="eyebrow">
                  Planning
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Calendar
                </h2>

                <p className="mt-1 text-sm text-[#858a83]">
                  Keep track of upcoming
                  financial events and
                  important dates.
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20241f]">
                <CalendarDays
                  size={19}
                  className="text-[#a9b99b]"
                />
              </div>

            </div>

            {/* CALENDAR CONTENT */}

            <div className="flex min-h-[270px] items-center justify-center px-6 text-center">

              <div>

                <CalendarDays
                  size={32}
                  className="mx-auto text-[#555b53]"
                />

                <h3 className="mt-4 text-lg font-medium">
                  Calendar
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#858a83]">
                  Your financial calendar
                  will appear here.
                  Upcoming bills,
                  payments, goals, and
                  other important events
                  can be displayed in
                  this section.
                </p>

              </div>

            </div>

          </section>

        </div>
      </main>
    </>
  );
}