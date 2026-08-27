import { ChevronDown } from "lucide-react";

type Period = "6months" | "3months" | "year";

export type MonthlyCashflow = {
  key: string;
  label: string;
  income: number;
  expenses: number;
  netCashflow: number;
};

type CashflowProps = {
  period: Period;
  onPeriodChange: (period: Period) => void;
  monthlyCashflow: MonthlyCashflow[];
  balance: number;
  currency: string;
  income: number;
  expenses: number;
  netCashflow: number;
};

export default function Cashflow({
  period,
  onPeriodChange,
  monthlyCashflow,
  balance,
  currency,
  income,
  expenses,
  netCashflow,
}: CashflowProps) {
  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const chartMax = Math.max(
    ...monthlyCashflow.flatMap((month) => [month.income, month.expenses]),
    0
  ) * 1.15 || 100;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18]">
      <div className="flex items-start justify-between gap-4 border-b border-[#2a2d29] p-5">
        <div>
          <p className="eyebrow">Financial overview</p>
          <h2 className="mt-2 text-xl font-semibold">Cashflow</h2>
          <p className="mt-1 text-sm text-[#858a83]">Track your money in and money out.</p>
        </div>
        <div className="relative shrink-0">
          <select
            className="input-field w-auto min-w-[118px] appearance-none pr-8"
            value={period}
            onChange={(event) => onPeriodChange(event.target.value as Period)}
            aria-label="Cashflow period"
          >
            <option value="6months">6 months</option>
            <option value="3months">3 months</option>
            <option value="year">This year</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-[#777d75]" />
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            ["Checking balance", formatCurrency(balance), ""],
            ["Income", formatCurrency(income), "text-[#b7d67b]"],
            ["Expenses", formatCurrency(expenses), ""],
            ["Net cashflow", formatCurrency(netCashflow), netCashflow >= 0 ? "text-[#b7d67b]" : "text-[#f2a092]"],
          ].map(([label, value, color]) => (
            <div key={label} className="min-w-0 rounded-xl border border-[#2a2d29] bg-[#20241f] p-3.5 sm:p-4">
              <p className="truncate text-xs text-[#858a83]">{label}</p>
              <p className={`mt-2 truncate text-base font-semibold sm:text-lg ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center gap-5 text-xs text-[#858a83]">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#b7d67b]" />Income</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#f2a092]" />Expenses</span>
          </div>
          <div className="relative h-[250px]">
            <div className="absolute inset-0 flex flex-col justify-between">{[0, 1, 2, 3, 4].map((line) => <div key={line} className="border-t border-[#292d29]" />)}</div>
            <div className="absolute inset-0 flex items-end justify-around gap-2 px-2 pb-7">
              {monthlyCashflow.map((month) => (
                <div key={month.key} className="flex h-full flex-1 items-end justify-center gap-1">
                  <div className="group relative flex h-full w-full max-w-8 items-end" title={`${month.label} income: ${formatCurrency(month.income)}`}><div className="w-full rounded-t-md bg-[#b7d67b] transition-opacity group-hover:opacity-80" style={{ height: `${Math.max((month.income / chartMax) * 100, month.income > 0 ? 2 : 0)}%` }} /></div>
                  <div className="group relative flex h-full w-full max-w-8 items-end" title={`${month.label} expenses: ${formatCurrency(month.expenses)}`}><div className="w-full rounded-t-md bg-[#f2a092] transition-opacity group-hover:opacity-80" style={{ height: `${Math.max((month.expenses / chartMax) * 100, month.expenses > 0 ? 2 : 0)}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex justify-around px-2">{monthlyCashflow.map((month) => <span key={month.key} className="flex-1 text-center text-xs text-[#737970]">{month.label}</span>)}</div>
          </div>
          <div className="mt-4 grid gap-2">{monthlyCashflow.map((month) => <div key={month.key} className="flex items-center justify-between border-t border-[#252925] pt-2 text-xs"><span className="text-[#858a83]">{month.label}</span><div className="flex items-center gap-2.5 sm:gap-4"><span className="text-[#b7d67b]">+{formatCurrency(month.income)}</span><span className="text-[#f2a092]">-{formatCurrency(month.expenses)}</span><span className={month.netCashflow >= 0 ? "text-[#b7d67b]" : "text-[#f2a092]"}>{formatCurrency(month.netCashflow)}</span></div></div>)}</div>
        </div>
      </div>
    </section>
  );
}
