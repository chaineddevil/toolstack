import LedgerTransactionForm from "@/components/admin/LedgerTransactionForm";

export default function NewTransactionPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-xl font-semibold text-[#111]">Add Transaction</h1>
                <p className="text-sm text-[#666]">Record a commission, adjustment, or payout.</p>
            </header>
            <LedgerTransactionForm />
        </div>
    );
}
