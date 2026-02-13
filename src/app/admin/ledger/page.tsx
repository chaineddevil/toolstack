import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth";

// Helper to format currency
const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
    }).format(amount);
};

type LedgerEntryWithRelations = {
    id: number;
    occurred_at: string;
    amount: number;
    entry_type: "commission" | "adjustment" | "payout";
    reference_id: string | null;
    account_id: number;
    currency: string;
    notes: string | null;
    payout_id: number | null;
    ledger_accounts: {
        name: string;
    } | null;
    tools: {
        name: string;
    } | null;
};

export default async function LedgerPage() {
    const role = await getUserRole();
    if (!role || !["super_admin", "manager"].includes(role)) {
        redirect("/admin");
    }

    const supabase = await createClient();

    // Fetch Accounts
    const { data: accounts } = await supabase
        .from("ledger_accounts")
        .select("*")
        .order("name");

    // Fetch recent entries (limit 50 for dashboard)
    const { data: rawEntries } = await supabase
        .from("ledger_entries")
        .select(`
        *,
        tools (name),
        ledger_accounts (name)
    `)
        .order("occurred_at", { ascending: false })
        .limit(50);

    // Cast to our defined type
    const entries = (rawEntries as unknown as LedgerEntryWithRelations[]) || [];

    // Calculate Balances (simple aggregation for now)
    const { data: allEntries } = await supabase
        .from("ledger_entries")
        .select("account_id, amount, entry_type");

    const balances: Record<number, number> = {};

    allEntries?.forEach((entry) => {
        const val = Number(entry.amount);
        if (!balances[entry.account_id]) balances[entry.account_id] = 0;

        if (entry.entry_type === "payout") {
            balances[entry.account_id] -= val;
        } else {
            balances[entry.account_id] += val;
        }
    });

    const totalRevenue = Object.values(balances).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[#111]">Ledger & Revenue</h1>
                    <p className="text-sm text-[#666]">Track affiliate commissions and payouts.</p>
                </div>
                <div className="flex gap-2">
                    <button className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                        Export CSV
                    </button>
                    <button className="rounded-lg bg-[#111] px-4 py-2 text-sm font-medium text-white hover:bg-[#333]">
                        Add Transaction
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-black/5 bg-white p-6">
                    <h3 className="text-sm font-medium text-[#666]">Total Net Revenue</h3>
                    <p className="mt-2 text-3xl font-bold text-[#111]">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="rounded-xl border border-black/5 bg-white p-6">
                    <h3 className="text-sm font-medium text-[#666]">Active Accounts</h3>
                    <p className="mt-2 text-3xl font-bold text-[#111]">{accounts?.length || 0}</p>
                </div>
                <div className="rounded-xl border border-black/5 bg-white p-6">
                    <h3 className="text-sm font-medium text-[#666]">Recent Transactions</h3>
                    <p className="mt-2 text-3xl font-bold text-[#111]">{entries?.length || 0}</p>
                </div>
            </div>

            {/* Account Balances */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[#111]">Account Balances</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {accounts?.map(account => (
                        <div key={account.id} className="rounded-lg border border-black/5 bg-white p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium">{account.name}</h4>
                                    <p className="text-xs text-[#666] capitalize">{account.account_type.replace("_", " ")}</p>
                                </div>
                                <span className={`text-lg font-bold ${(balances[account.id] || 0) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                                    {formatCurrency(balances[account.id] || 0)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Entries Table */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[#111]">Recent Activity</h2>
                <div className="rounded-xl border border-black/5 bg-white overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#fafafa] text-[#666]">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Account</th>
                                <th className="px-6 py-3 font-medium">Type</th>
                                <th className="px-6 py-3 font-medium">Tool</th>
                                <th className="px-6 py-3 font-medium">Reference</th>
                                <th className="px-6 py-3 font-medium text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {entries?.map((entry) => (
                                <tr key={entry.id} className="hover:bg-[#fafafa]">
                                    <td className="px-6 py-3 text-[#666]">{new Date(entry.occurred_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-3 font-medium text-[#111]">
                                        {/* Correctly typed access */}
                                        {Array.isArray(entry.ledger_accounts)
                                            ? entry.ledger_accounts[0]?.name
                                            : entry.ledger_accounts?.name || "Unknown"}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize 
                                ${entry.entry_type === 'payout' ? 'bg-purple-100 text-purple-700' :
                                                entry.entry_type === 'commission' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {entry.entry_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-[#666]">
                                        {Array.isArray(entry.tools)
                                            ? entry.tools[0]?.name
                                            : entry.tools?.name || "-"}
                                    </td>
                                    <td className="px-6 py-3 text-[#666] font-mono text-xs">{entry.reference_id || "-"}</td>
                                    <td className="px-6 py-3 text-right font-medium">
                                        {entry.entry_type === 'payout' ? '-' : '+'}{formatCurrency(entry.amount)}
                                    </td>
                                </tr>
                            ))}
                            {entries?.length === 0 && (
                                <tr><td colSpan={6} className="p-6 text-center text-[#666]">No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
