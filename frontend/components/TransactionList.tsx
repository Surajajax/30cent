import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, LoaderCircle, WalletCards } from "lucide-react";

export type Transaction = {
  transaction_id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  category: string | null;
  iso_currency_code: string | null;
};

type TransactionListProps = {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  currency: string;
};

export default function TransactionList({ transactions, loading, error, currency }: TransactionListProps) {
  const formatAmount = (amount: number, transactionCurrency: string | null) => {
    const value = Math.abs(amount).toLocaleString("en-US", { style: "currency", currency: transactionCurrency || currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return amount > 0 ? `-${value}` : `+${value}`;
  };
  const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const visibleTransactions = [...transactions].sort((first, second) => {
    const firstDate = new Date(`${first.date}T00:00:00`).getTime();
    const secondDate = new Date(`${second.date}T00:00:00`).getTime();
    return secondDate - firstDate;
  });

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#2a2d29] bg-[#181b18]">
      <div className="flex items-center justify-between gap-3 border-b border-[#2a2d29] p-5">
        <div><p className="eyebrow">Activity</p><h2 className="mt-2 text-xl font-semibold">Transactions</h2><p className="mt-1 text-sm text-[#858a83]">Latest activity from your connected accounts.</p></div>
        <Link href="/transactions" className="shrink-0 text-xs font-medium text-[#b7d67b] hover:underline">View all</Link>
      </div>

      {loading && <div className="flex min-h-[330px] items-center justify-center gap-2 text-sm text-[#858a83]"><LoaderCircle size={17} className="animate-spin" />Loading...</div>}
      {!loading && error && <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center"><WalletCards size={26} className="text-[#6f766c]" /><p className="mt-4 text-sm text-[#f2a092]">{error}</p></div>}
      {!loading && !error && visibleTransactions.length === 0 && <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center"><WalletCards size={28} className="text-[#6f766c]" /><p className="mt-4 text-sm font-medium">No transactions yet</p><p className="mt-1 text-xs leading-5 text-[#858a83]">Connect an account to see your recent activity.</p><Link href="/connect" className="mt-4 text-xs font-medium text-[#b7d67b] hover:underline">Connect an account</Link></div>}
      {!loading && !error && visibleTransactions.length > 0 && <>
        <div
          className="max-h-[520px] flex-1 divide-y divide-[#252925] overflow-y-auto overscroll-contain [scrollbar-color:#53604d_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#53604d] [&::-webkit-scrollbar-track]:bg-transparent"
          aria-label="All transactions"
        >
          {visibleTransactions.map((transaction) => {
            const isExpense = transaction.amount > 0;
            const name = transaction.merchant_name || transaction.name;
            return <div key={transaction.transaction_id} className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-3 px-5 py-4 hover:bg-[#20241f]">
              <div className="flex min-w-0 items-center gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isExpense ? "bg-[#252925]" : "bg-[#d9e8c2]"}`}>{isExpense ? <ArrowDownLeft size={16} className="text-[#aeb5a8]" /> : <ArrowUpRight size={16} className="text-[#405135]" />}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{name}</p><div className="mt-1 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-xs text-[#737970]"><span className="truncate">{transaction.category || "Transaction"}</span><span className="text-[#555b53]">•</span><span className="shrink-0">{formatDate(transaction.date)}</span></div></div></div>
              <p className={`shrink-0 text-right text-sm font-semibold ${isExpense ? "text-[#f4f2ed]" : "text-[#b7d67b]"}`}>{formatAmount(transaction.amount, transaction.iso_currency_code)}</p>
            </div>;
          })}
        </div>
        <div className="flex items-center justify-between border-t border-[#2a2d29] px-4 py-3 text-xs text-[#737970]"><span>{transactions.length} transaction{transactions.length === 1 ? "" : "s"}</span><span>Scroll to browse all</span></div>
      </>}
    </section>
  );
}
