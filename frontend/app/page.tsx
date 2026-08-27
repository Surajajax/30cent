"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Cashflow, { type MonthlyCashflow } from "@/components/Cashflow";
import TransactionList, { type Transaction } from "@/components/TransactionList";

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

type Period = "6months" | "3months" | "year";

const DASHBOARD_INCOME = 500;

const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const getMonthLabel = (date: Date) => date.toLocaleDateString("en-US", { month: "short" });

export default function HomePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("6months");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [accountsResponse, transactionsResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/plaid/accounts", { cache: "no-store" }),
          fetch("http://127.0.0.1:8000/api/plaid/transactions", { cache: "no-store" }),
        ]);
        const accountsData = await accountsResponse.json();
        const transactionsData = await transactionsResponse.json();
        if (accountsResponse.status === 400 || transactionsResponse.status === 400) {
          setAccount(null);
          setTransactions([]);
          return;
        }
        if (!accountsResponse.ok || !transactionsResponse.ok) {
          throw new Error(accountsData.detail || transactionsData.detail || "Failed to load financial data");
        }
        setAccount(accountsData.accounts?.find((item: Account) => item.type === "depository" && item.subtype === "checking") ?? null);
        setTransactions(Array.isArray(transactionsData.transactions) ? transactionsData.transactions : []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Unable to load your financial data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const currency = account?.balances.iso_currency_code || "USD";
  const selectedMonths = useMemo(() => {
    const now = new Date();
    const monthCount = period === "3months" ? 3 : period === "year" ? now.getMonth() + 1 : 6;
    return Array.from({ length: monthCount }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - monthCount + index + 1, 1);
      return { key: getMonthKey(date), label: getMonthLabel(date) };
    });
  }, [period]);
  const monthlyCashflow = useMemo<MonthlyCashflow[]>(() => {
    const monthMap = new Map(selectedMonths.map((month) => [month.key, { ...month, income: 0, expenses: 0, netCashflow: 0 }]));
    transactions.forEach((transaction) => {
      const month = monthMap.get(getMonthKey(new Date(`${transaction.date}T00:00:00`)));
      if (!month) return;
      if (transaction.amount < 0) month.income += Math.abs(transaction.amount);
      if (transaction.amount > 0) month.expenses += transaction.amount;
      month.netCashflow = month.income - month.expenses;
    });
    const monthlyValues = selectedMonths.map((month) => monthMap.get(month.key)!);
    const sourceIncome = monthlyValues.reduce((total, month) => total + month.income, 0);

    if (sourceIncome > 0) {
      const incomeScale = DASHBOARD_INCOME / sourceIncome;
      monthlyValues.forEach((month) => {
        month.income *= incomeScale;
        month.netCashflow = month.income - month.expenses;
      });
    }

    return monthlyValues;
  }, [selectedMonths, transactions]);
  const income = DASHBOARD_INCOME;
  const expenses = monthlyCashflow.reduce((total, month) => total + month.expenses, 0);

  return <>
    <Header />
    <main className="px-4 pb-12 pt-6 text-[#f4f2ed] sm:px-6 lg:px-10"><div className="mx-auto max-w-[1440px]">
      <div className="mb-8"><p className="eyebrow">Personal finance dashboard</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Home</h1><p className="mt-2 max-w-2xl text-sm text-[#989995]">Welcome to 30cent — your AI personal finance companion.</p></div>
      <section className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <Cashflow period={period} onPeriodChange={setPeriod} monthlyCashflow={monthlyCashflow} balance={account?.balances.current ?? 0} currency={currency} income={income} expenses={expenses} netCashflow={income - expenses} />
        <TransactionList transactions={transactions} loading={loading} error={error} currency={currency} />
      </section>
      <section className="mt-5 min-h-[360px] overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18]"><div className="flex items-center justify-between border-b border-[#2a2d29] p-5"><div><p className="eyebrow">Planning</p><h2 className="mt-2 text-xl font-semibold">Calendar</h2><p className="mt-1 text-sm text-[#858a83]">Keep track of upcoming financial events and important dates.</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20241f]"><CalendarDays size={19} className="text-[#a9b99b]" /></div></div><div className="flex min-h-[270px] items-center justify-center px-6 text-center"><div><CalendarDays size={32} className="mx-auto text-[#555b53]" /><h3 className="mt-4 text-lg font-medium">Calendar</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#858a83]">Your financial calendar will appear here. Upcoming bills, payments, goals, and other important events can be displayed in this section.</p></div></div></section>
    </div></main>
  </>;
}
