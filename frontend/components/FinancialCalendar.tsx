"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { useEffect,useMemo, useState } from "react";

export type CalendarTransaction = {
  transaction_id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  category: string | null;
  iso_currency_code: string | null;
};

type FinancialCalendarProps = {
  transactions: CalendarTransaction[];
  currency: string;
};

const getDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getTransactionDate = (date: string) => {
  return new Date(`${date}T00:00:00`);
};

export default function FinancialCalendar({
  transactions,
  currency,
}: FinancialCalendarProps) {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const [selectedDate, setSelectedDate] = useState(
    getDateKey(today),
  );

  
  useEffect(() => {
  const currentDate = new Date();

  setCurrentMonth(
    new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    ),
  );

  setSelectedDate(getDateKey(currentDate));
}, []);

  /*
   * ---------------------------------------------------------
   * MONTH INFORMATION
   * ---------------------------------------------------------
   */

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate();

  const firstDayOfMonth = new Date(
    year,
    month,
    1,
  ).getDay();

  /*
   * ---------------------------------------------------------
   * TRANSACTIONS GROUPED BY DATE
   * ---------------------------------------------------------
   */

  const transactionsByDate = useMemo(() => {
    const grouped = new Map<
      string,
      CalendarTransaction[]
    >();

    transactions.forEach((transaction) => {
      const transactionDate =
        getTransactionDate(transaction.date);

      if (
        Number.isNaN(transactionDate.getTime())
      ) {
        return;
      }

      const key = getDateKey(transactionDate);

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)!.push(transaction);
    });

    return grouped;
  }, [transactions]);

  /*
   * ---------------------------------------------------------
   * SELECTED DAY TRANSACTIONS
   * ---------------------------------------------------------
   */

  const selectedTransactions =
    transactionsByDate.get(selectedDate) ?? [];

  /*
   * ---------------------------------------------------------
   * SELECTED DAY SUMMARY
   * ---------------------------------------------------------
   *
   * Plaid convention used by your existing Home page:
   *
   * Positive amount = expense
   * Negative amount = income
   */

  const selectedSummary = useMemo(() => {
    let income = 0;
    let expenses = 0;

    selectedTransactions.forEach(
      (transaction) => {
        if (transaction.amount < 0) {
          income += Math.abs(transaction.amount);
        } else if (transaction.amount > 0) {
          expenses += transaction.amount;
        }
      },
    );

    return {
      income,
      expenses,
      net: income - expenses,
    };
  }, [selectedTransactions]);

  /*
   * ---------------------------------------------------------
   * FORMAT CURRENCY
   * ---------------------------------------------------------
   */

  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /*
   * ---------------------------------------------------------
   * FORMAT DATE
   * ---------------------------------------------------------
   */

  const formatSelectedDate = () => {
    const date = new Date(
      `${selectedDate}T00:00:00`,
    );

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  /*
   * ---------------------------------------------------------
   * MONTH NAVIGATION
   * ---------------------------------------------------------
   */

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(year, month - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(year, month + 1, 1),
    );
  };

  /*
   * ---------------------------------------------------------
   * GO TO TODAY
   * ---------------------------------------------------------
   */

  const goToToday = () => {
    const todayDate = new Date();

    setCurrentMonth(
      new Date(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        1,
      ),
    );

    setSelectedDate(
      getDateKey(todayDate),
    );
  };

  /*
   * ---------------------------------------------------------
   * CALENDAR CELLS
   * ---------------------------------------------------------
   */

  const calendarCells = [];

  for (
    let index = 0;
    index < firstDayOfMonth;
    index++
  ) {
    calendarCells.push(
      <div
        key={`empty-${index}`}
        className="min-h-[72px] rounded-xl"
      />,
    );
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    const date = new Date(
      year,
      month,
      day,
    );

    const dateKey = getDateKey(date);

    const dayTransactions =
      transactionsByDate.get(dateKey) ?? [];

    const hasTransactions =
      dayTransactions.length > 0;

    const income = dayTransactions
      .filter(
        (transaction) =>
          transaction.amount < 0,
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(transaction.amount),
        0,
      );

    const expenses = dayTransactions
      .filter(
        (transaction) =>
          transaction.amount > 0,
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0,
      );

    const isSelected =
      selectedDate === dateKey;

    const isToday =
      getDateKey(today) === dateKey;

    calendarCells.push(
      <button
        key={dateKey}
        type="button"
        onClick={() =>
          setSelectedDate(dateKey)
        }
        className={`relative min-h-[72px] rounded-xl border p-2 text-left transition ${
          isSelected
            ? "border-[#b7d67b] bg-[#252925]"
            : "border-transparent hover:border-[#343a32] hover:bg-[#20241f]"
        }`}
      >
        <div className="flex items-start justify-between">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
              isToday
                ? "bg-[#b7d67b] font-semibold text-[#182018]"
                : "text-[#d8dbd5]"
            }`}
          >
            {day}
          </span>

          {hasTransactions && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#30362f] px-1 text-[10px] text-[#b7d67b]">
              {dayTransactions.length}
            </span>
          )}
        </div>

        {hasTransactions && (
          <div className="mt-2 space-y-1">
            {income > 0 && (
              <p className="truncate text-[10px] font-medium text-[#b7d67b]">
                +{formatCurrency(income)}
              </p>
            )}

            {expenses > 0 && (
              <p className="truncate text-[10px] font-medium text-[#858a83]">
                -{formatCurrency(expenses)}
              </p>
            )}
          </div>
        )}
      </button>,
    );
  }

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <section className="overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18]">
      {/* HEADER */}

      <div className="flex flex-col gap-4 border-b border-[#2a2d29] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">
            Financial planning
          </p>

          <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold">
            <CalendarDays
              size={20}
              className="text-[#a9b99b]"
            />
            Financial Calendar
          </h2>

          <p className="mt-1 text-sm text-[#858a83]">
            See when your money moves.
          </p>
        </div>

        <button
          type="button"
          onClick={goToToday}
          className="button-secondary self-start sm:self-auto"
        >
          Today
        </button>
      </div>

      {/* CALENDAR */}

      <div className="p-5">
        {/* MONTH NAVIGATION */}

        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a2d29] bg-[#20241f] text-[#858a83] transition hover:bg-[#252925] hover:text-[#f4f2ed]"
            aria-label="Previous month"
          >
            <ChevronLeft size={17} />
          </button>

          <h3 className="text-base font-semibold">
            {currentMonth.toLocaleDateString(
              "en-US",
              {
                month: "long",
                year: "numeric",
              },
            )}
          </h3>

          <button
            type="button"
            onClick={goToNextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a2d29] bg-[#20241f] text-[#858a83] transition hover:bg-[#252925] hover:text-[#f4f2ed]"
            aria-label="Next month"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        {/* WEEKDAYS */}

        <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-[#737970]">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* DAYS */}

        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells}
        </div>

        {/* LEGEND */}

        <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-[#252925] pt-4 text-xs text-[#737970]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#b7d67b]" />
            Income
          </span>

          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#858a83]" />
            Expenses
          </span>

          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#b7d67b]" />
            Today
          </span>
        </div>
      </div>

      {/* SELECTED DATE */}

      <div className="border-t border-[#2a2d29] p-5">
        <div className="mb-5">
          <p className="eyebrow">
            Daily activity
          </p>

          <h3 className="mt-2 text-lg font-semibold">
            {formatSelectedDate()}
          </h3>
        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#2a2d29] bg-[#20241f] p-3">
            <p className="text-[11px] text-[#737970]">
              Income
            </p>

            <p className="mt-2 truncate text-sm font-semibold text-[#b7d67b]">
              {formatCurrency(
                selectedSummary.income,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-[#2a2d29] bg-[#20241f] p-3">
            <p className="text-[11px] text-[#737970]">
              Expenses
            </p>

            <p className="mt-2 truncate text-sm font-semibold">
              {formatCurrency(
                selectedSummary.expenses,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-[#2a2d29] bg-[#20241f] p-3">
            <p className="text-[11px] text-[#737970]">
              Net
            </p>

            <p
              className={`mt-2 truncate text-sm font-semibold ${
                selectedSummary.net >= 0
                  ? "text-[#b7d67b]"
                  : "text-[#f2a092]"
              }`}
            >
              {formatCurrency(
                selectedSummary.net,
              )}
            </p>
          </div>
        </div>

        {/* TRANSACTIONS */}

        {selectedTransactions.length > 0 ? (
          <div className="mt-5 divide-y divide-[#252925] overflow-hidden rounded-xl border border-[#2a2d29]">
            {selectedTransactions.map(
              (transaction) => {
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
                    className="flex items-center justify-between gap-4 bg-[#181b18] px-4 py-3 hover:bg-[#20241f]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isExpense
                            ? "bg-[#252925]"
                            : "bg-[#d9e8c2]"
                        }`}
                      >
                        {isExpense ? (
                          <ArrowDownLeft
                            size={15}
                            className="text-[#aeb5a8]"
                          />
                        ) : (
                          <ArrowUpRight
                            size={15}
                            className="text-[#405135]"
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {name}
                        </p>

                        <p className="mt-1 truncate text-xs text-[#737970]">
                          {transaction.category ||
                            "Transaction"}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`shrink-0 text-sm font-semibold ${
                        isExpense
                          ? "text-[#f4f2ed]"
                          : "text-[#b7d67b]"
                      }`}
                    >
                      {isExpense
                        ? "-"
                        : "+"}
                      {formatCurrency(
                        Math.abs(
                          transaction.amount,
                        ),
                      )}
                    </p>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-[#2a2d29] bg-[#20241f] px-5 py-8 text-center">
            <CalendarDays
              size={24}
              className="mx-auto text-[#555b53]"
            />

            <p className="mt-3 text-sm font-medium">
              No financial activity
            </p>

            <p className="mt-1 text-xs text-[#737970]">
              No transactions were recorded
              on this date.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}