"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";

import Cashflow, {
  type MonthlyCashflow,
} from "@/components/Cashflow";

import TransactionList, {
  type Transaction,
} from "@/components/TransactionList";

import FinancialCalendar from "@/components/FinancialCalendar";

import {
  getApiUrl,
  getBackendErrorMessage,
} from "@/lib/api";

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
 * ============================================================
 * DATE HELPERS
 * ============================================================
 */

/*
 * Convert a date into:
 *
 * YYYY-MM
 */
const getMonthKey = (date: Date) => {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
};

/*
 * Convert a date into:
 *
 * Jan, Feb, Mar...
 */
const getMonthLabel = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
  });
};

/*
 * ============================================================
 * HOME PAGE
 * ============================================================
 */

export default function HomePage() {
  /*
   * ==========================================================
   * PLAID DATA
   * ==========================================================
   */

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [account, setAccount] =
    useState<Account | null>(null);

  /*
   * ==========================================================
   * PAGE STATE
   * ==========================================================
   */

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * ==========================================================
   * CASHFLOW MAXIMIZE STATE
   * ==========================================================
   */

  const [cashflowExpanded, setCashflowExpanded] =
    useState(false);

  /*
   * ==========================================================
   * FETCH PLAID DATA
   * ==========================================================
   */

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        /*
         * Fetch connected accounts
         */

        const accountsResponse = await fetch(
          getApiUrl("/api/plaid/accounts"),
          {
            cache: "no-store",
          },
        );

        /*
         * Fetch transactions
         */

        const transactionsResponse = await fetch(
          getApiUrl("/api/plaid/transactions"),
          {
            cache: "no-store",
          },
        );

        const accountsData =
          await accountsResponse.json();

        const transactionsData =
          await transactionsResponse.json();

        /*
         * ====================================================
         * NO BANK CONNECTED
         * ====================================================
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
         * ====================================================
         * ACCOUNT API ERROR
         * ====================================================
         */

        if (!accountsResponse.ok) {
          throw new Error(
            accountsData.detail ||
              "Failed to load checking account",
          );
        }

        /*
         * ====================================================
         * TRANSACTION API ERROR
         * ====================================================
         */

        if (!transactionsResponse.ok) {
          throw new Error(
            transactionsData.detail ||
              "Failed to load transactions",
          );
        }

        /*
         * ====================================================
         * FIND CHECKING ACCOUNT
         * ====================================================
         */

        const checkingAccount =
          accountsData.accounts?.find(
            (item: Account) =>
              item.type === "depository" &&
              item.subtype === "checking",
          ) ?? null;

        setAccount(checkingAccount);

        /*
         * ====================================================
         * PLAID TRANSACTIONS
         * ====================================================
         */

        const plaidTransactions =
          Array.isArray(
            transactionsData.transactions,
          )
            ? transactionsData.transactions
            : [];

        console.log(
          "Plaid checking transactions:",
          plaidTransactions,
        );

        setTransactions(plaidTransactions);
      } catch (err) {
        console.error(
          "Dashboard fetch error:",
          err,
        );

        setError(
          getBackendErrorMessage(
            err,
            "Unable to load your financial data.",
          ),
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
   * ==========================================================
   * CURRENCY
   * ==========================================================
   */

  const currency =
    account?.balances.iso_currency_code ||
    "USD";

  /*
   * ==========================================================
   * MONTHLY CASHFLOW
   *
   * Uses every month that exists
   * in the Plaid transaction data.
   * ==========================================================
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
          `${transaction.date}T00:00:00`,
        );

        /*
         * Ignore invalid dates
         */

        if (
          Number.isNaN(
            transactionDate.getTime(),
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
         * ====================================================
         * PLAID CONVENTION
         *
         * Positive amount = money OUT
         * Negative amount = money IN
         * ====================================================
         */

        if (transaction.amount < 0) {
          month.income += Math.abs(
            transaction.amount,
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
        monthMap.values(),
      ).sort((a, b) =>
        a.key.localeCompare(b.key),
      );
    }, [transactions]);

  /*
   * ==========================================================
   * TOTAL INCOME
   * ==========================================================
   */

  const income = useMemo(() => {
    return monthlyCashflow.reduce(
      (total, month) =>
        total + month.income,
      0,
    );
  }, [monthlyCashflow]);

  /*
   * ==========================================================
   * TOTAL EXPENSES
   * ==========================================================
   */

  const expenses = useMemo(() => {
    return monthlyCashflow.reduce(
      (total, month) =>
        total + month.expenses,
      0,
    );
  }, [monthlyCashflow]);

  /*
   * ==========================================================
   * NET CASHFLOW
   * ==========================================================
   */

  const netCashflow =
    income - expenses;

  /*
   * ==========================================================
   * CHECKING BALANCE
   *
   * This is the actual current balance
   * returned by Plaid.
   * ==========================================================
   */

  const balance =
    account?.balances.current ?? 0;

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <>
      <Header />

      <main className="px-4 pb-12 pt-6 text-[#f4f2ed] sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1440px]">

          {/* ==================================================
              PAGE HEADER
              ================================================== */}

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

          {/* ==================================================
              CASHFLOW + TRANSACTIONS
              ================================================== */}

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
                  (value) => !value,
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

          {/* ==================================================
              FINANCIAL CALENDAR
              ================================================== */}

          <section className="mt-5">
            <FinancialCalendar
              transactions={transactions}
              currency={currency}
            />
          </section>

        </div>
      </main>
    </>
  );
}