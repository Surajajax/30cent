"use client";

import {
  Maximize2,
  Minimize2,
} from "lucide-react";

export type MonthlyCashflow = {
  key: string;
  label: string;
  income: number;
  expenses: number;
  netCashflow: number;
};

type CashflowProps = {
  monthlyCashflow: MonthlyCashflow[];

  balance: number;

  currency: string;

  income: number;

  expenses: number;

  netCashflow: number;

  expanded?: boolean;

  onToggleExpand?: () => void;
};

export default function Cashflow({
  monthlyCashflow,
  balance,
  currency,
  income,
  expenses,
  netCashflow,
  expanded = false,
  onToggleExpand,
}: CashflowProps) {

  /*
   * FORMAT MONEY
   */
  const formatCurrency = (
    value: number
  ) => {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /*
   * FIND MAXIMUM VALUE
   *
   * Used to calculate bar heights.
   */
  const chartMax =
    Math.max(
      ...monthlyCashflow.flatMap(
        (month) => [
          month.income,
          month.expenses,
        ]
      ),
      0
    ) * 1.15 || 100;

  return (
    <section
      className={`min-w-0 overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18] ${
        expanded
          ? "fixed inset-4 z-50 overflow-y-auto"
          : ""
      }`}
    >

      {/* HEADER */}

      <div className="flex items-start justify-between gap-4 border-b border-[#2a2d29] p-5">

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

        {/* MAX / MIN BUTTON */}

        <button
          type="button"
          onClick={onToggleExpand}
          className="button-secondary shrink-0"
          aria-label={
            expanded
              ? "Minimize cashflow"
              : "Maximize cashflow"
          }
        >
          {expanded ? (
            <>
              <Minimize2 size={14} />
              Min
            </>
          ) : (
            <>
              <Maximize2 size={14} />
              Max
            </>
          )}
        </button>

      </div>

      <div className="p-5">

        {/* SUMMARY CARDS */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

          {/* BALANCE */}

          <div className="min-w-0 rounded-xl border border-[#2a2d29] bg-[#20241f] p-3.5 sm:p-4">

            <p className="truncate text-xs text-[#858a83]">
              Checking balance
            </p>

            <p className="mt-2 truncate text-base font-semibold sm:text-lg">
              {formatCurrency(balance)}
            </p>

          </div>

          {/* INCOME */}

          <div className="min-w-0 rounded-xl border border-[#2a2d29] bg-[#20241f] p-3.5 sm:p-4">

            <p className="truncate text-xs text-[#858a83]">
              Income
            </p>

            <p className="mt-2 truncate text-base font-semibold text-[#b7d67b] sm:text-lg">
              {formatCurrency(income)}
            </p>

          </div>

          {/* EXPENSES */}

          <div className="min-w-0 rounded-xl border border-[#2a2d29] bg-[#20241f] p-3.5 sm:p-4">

            <p className="truncate text-xs text-[#858a83]">
              Expenses
            </p>

            <p className="mt-2 truncate text-base font-semibold sm:text-lg">
              {formatCurrency(expenses)}
            </p>

          </div>

          {/* NET CASHFLOW */}

          <div className="min-w-0 rounded-xl border border-[#2a2d29] bg-[#20241f] p-3.5 sm:p-4">

            <p className="truncate text-xs text-[#858a83]">
              Net cashflow
            </p>

            <p
              className={`mt-2 truncate text-base font-semibold sm:text-lg ${
                netCashflow >= 0
                  ? "text-[#b7d67b]"
                  : "text-[#f2a092]"
              }`}
            >
              {formatCurrency(netCashflow)}
            </p>

          </div>

        </div>

        {/* CHART */}

        {monthlyCashflow.length > 0 ? (
          <div className="mt-8">

            {/* LEGEND */}

            <div className="mb-5 flex items-center gap-5 text-xs text-[#858a83]">

              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#b7d67b]" />
                Income
              </span>

              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f2a092]" />
                Expenses
              </span>

            </div>

            {/* BAR CHART */}

            <div
              className={`relative ${
                expanded
                  ? "h-[420px]"
                  : "h-[280px]"
              }`}
            >

              {/* GRID LINES */}

              <div className="absolute inset-0 flex flex-col justify-between">

                {[0, 1, 2, 3, 4].map(
                  (line) => (
                    <div
                      key={line}
                      className="border-t border-[#292d29]"
                    />
                  )
                )}

              </div>

              {/* BARS */}

              <div className="absolute inset-0 flex items-end gap-3 overflow-x-auto px-3 pb-10">

                {monthlyCashflow.map(
                  (month) => (
                    <div
                      key={month.key}
                      className="flex h-full min-w-[70px] flex-1 flex-col justify-end"
                    >

                      {/* BAR AREA */}

                      <div className="flex h-full items-end justify-center gap-1.5">

                        {/* INCOME BAR */}

                        <div className="group relative flex h-full w-7 items-end">

                          <div
                            className="w-full rounded-t-md bg-[#b7d67b] transition-opacity group-hover:opacity-80"
                            style={{
                              height: `${
                                Math.max(
                                  (month.income /
                                    chartMax) *
                                    100,
                                  month.income >
                                    0
                                    ? 2
                                    : 0
                                )
                              }%`,
                            }}
                          />

                          {/* INCOME TOOLTIP */}

                          <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#343a32] bg-[#20241f] px-3 py-2 text-xs text-[#f4f2ed] shadow-xl group-hover:block">

                            Income:{" "}
                            {formatCurrency(
                              month.income
                            )}

                          </div>

                        </div>

                        {/* EXPENSE BAR */}

                        <div className="group relative flex h-full w-7 items-end">

                          <div
                            className="w-full rounded-t-md bg-[#f2a092] transition-opacity group-hover:opacity-80"
                            style={{
                              height: `${
                                Math.max(
                                  (month.expenses /
                                    chartMax) *
                                    100,
                                  month.expenses >
                                    0
                                    ? 2
                                    : 0
                                )
                              }%`,
                            }}
                          />

                          {/* EXPENSE TOOLTIP */}

                          <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#343a32] bg-[#20241f] px-3 py-2 text-xs text-[#f4f2ed] shadow-xl group-hover:block">

                            Expenses:{" "}
                            {formatCurrency(
                              month.expenses
                            )}

                          </div>

                        </div>

                      </div>

                      {/* MONTH LABEL */}

                      <div className="mt-3 text-center text-xs font-medium text-[#858a83]">
                        {month.label}
                      </div>

                    </div>
                  )
                )}

              </div>

            </div>

            {/* MONTH DETAILS */}

            <div className="mt-4 grid gap-2">

              {monthlyCashflow.map(
                (month) => (
                  <div
                    key={month.key}
                    className="flex flex-col gap-2 border-t border-[#252925] py-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                  >

                    {/* MONTH */}

                    <span className="font-medium text-[#858a83]">
                      {month.label}
                    </span>

                    {/* VALUES */}

                    <div className="flex flex-wrap items-center gap-3 sm:gap-5">

                      <span className="text-[#b7d67b]">
                        Income +{" "}
                        {formatCurrency(
                          month.income
                        )}
                      </span>

                      <span className="text-[#f2a092]">
                        Expense -{" "}
                        {formatCurrency(
                          month.expenses
                        )}
                      </span>

                      <span
                        className={
                          month.netCashflow >=
                          0
                            ? "text-[#b7d67b]"
                            : "text-[#f2a092]"
                        }
                      >
                        Net{" "}
                        {formatCurrency(
                          month.netCashflow
                        )}
                      </span>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>
        ) : (
          /*
           * NO TRANSACTIONS
           */

          <div className="mt-8 flex min-h-[220px] items-center justify-center rounded-xl border border-[#2a2d29] bg-[#20241f]">

            <div className="text-center">

              <p className="text-sm font-medium text-[#c9cec4]">
                No cashflow data yet
              </p>

              <p className="mt-2 text-xs text-[#777d75]">
                Connect your checking account
                to see your income and expenses.
              </p>

            </div>

          </div>
        )}

      </div>
    </section>
  );
}