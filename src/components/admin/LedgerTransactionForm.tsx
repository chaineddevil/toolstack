"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type TransactionFormData = {
    account_id: number;
    tool_id?: number;
    amount: number;
    entry_type: "commission" | "adjustment" | "payout";
    reference_id?: string;
    notes?: string;
    occurred_at: string;
};

export default function LedgerTransactionForm() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [tools, setTools] = useState<any[]>([]);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<TransactionFormData>({
        defaultValues: {
            occurred_at: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
            entry_type: "commission"
        }
    });

    const entryType = watch("entry_type");

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        async function loadData() {
            const { data: acc } = await supabase.from("ledger_accounts").select("id, name");
            const { data: tls } = await supabase.from("tools").select("id, name");
            setAccounts(acc || []);
            setTools(tls || []);
        }
        loadData();
    }, []);

    async function onSubmit(data: TransactionFormData) {
        setSaving(true);
        try {
            const res = await fetch("/api/ledger", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save");
            }

            router.refresh();
            router.push("/admin/ledger");
        } catch (e: any) {
            alert("Error saving transaction: " + e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto space-y-6 bg-white p-8 rounded-xl border border-black/5">
            <h2 className="text-lg font-semibold border-b border-black/5 pb-4">New Transaction</h2>

            <div className="grid gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select {...register("entry_type")} className="w-full p-2 border rounded-lg">
                        <option value="commission">Commission</option>
                        <option value="adjustment">Adjustment</option>
                        <option value="payout">Payout</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Account</label>
                    <select {...register("account_id")} className="w-full p-2 border rounded-lg" required>
                        <option value="">Select Account...</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>

                {entryType !== "payout" && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Tool (Optional)</label>
                        <select {...register("tool_id")} className="w-full p-2 border rounded-lg">
                            <option value="">Select Tool...</option>
                            {tools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Amount ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register("amount", { required: true, min: 0.01 })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input
                            type="date"
                            {...register("occurred_at", { required: true })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Reference ID (Invoice/Trans #)</label>
                    <input {...register("reference_id")} className="w-full p-2 border rounded-lg" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea {...register("notes")} rows={3} className="w-full p-2 border rounded-lg" />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-sm font-medium hover:bg-gray-50 rounded-lg"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#111] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#333] disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Record Transaction"}
                </button>
            </div>
        </form>
    );
}
