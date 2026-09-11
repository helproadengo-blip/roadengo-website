import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye } from "lucide-react";
import { apiService } from "../routing/apiClient";
import {
  FilterBar, SearchInput, SelectBox, ClearButton, TableCard, Th, Td, EmptyRow, Pill, Pagination, usePaged,
  money2, fmtDate, fmtTime, RowMenu, Modal, downloadCsv, inRange,
} from "../admin/ui";

const STATUS = { completed: ["green", "Completed"], pending: ["amber", "Pending"], rejected: ["red", "Rejected"] };

/**
 * Every transaction on the partner's account. Completed ones carry a running
 * balance; pending and rejected entries are listed too (without a balance) so
 * the partner can see what is still waiting on Roadengo.
 */
export default function PaymentLedger({ range }) {
  const [rows, setRows] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All Types");
  const [status, setStatus] = useState("All Status");
  const [dates, setDates] = useState({ from: "", to: "" });
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ledger, all] = await Promise.all([apiService.getPartnerLedger(), apiService.getPartnerPayments()]);
      const done = ledger.data?.transactions || [];
      const others = (all.data?.payments || []).filter((p) => p.status !== "completed");
      const merged = [...done, ...others].sort(
        (a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRows(merged);
      setBalance(ledger.data?.balance || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = dates.from ? new Date(dates.from + "T00:00:00") : null;
    const to = dates.to ? new Date(dates.to + "T23:59:59") : null;
    return rows.filter((r) => {
      if (!inRange(r.date, range)) return false;
      if (type !== "All Types" && r.type !== type.toLowerCase()) return false;
      if (status !== "All Status" && STATUS[r.status]?.[1] !== status) return false;
      const d = new Date(r.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (!q) return true;
      return [r.txnId, r.externalTxnId, r.description, r.paymentType, r.reference].filter(Boolean).some((f) => String(f).toLowerCase().includes(q));
    });
  }, [rows, range, search, type, status, dates]);

  const paged = usePaged(filtered, 10, `${search}|${type}|${status}|${dates.from}|${dates.to}|${range.from}`);

  const download = () =>
    downloadCsv(
      `roadengo-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Transaction ID", "Your reference", "Type", "Description", "Amount", "Method", "Status", "Balance"],
      filtered.map((r) => [
        fmtDate(r.date),
        r.txnId,
        r.externalTxnId || "",
        r.type,
        r.description || r.paymentType,
        r.amount,
        r.method || "",
        r.status,
        r.balance ?? "",
      ])
    );

  return (
    <div>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by transaction ID, description or reference..." />
        <SelectBox label="Type" value={type} onChange={setType} options={["All Types", "Credit", "Debit"]} />
        <SelectBox label="Status" value={status} onChange={setStatus} options={["All Status", "Completed", "Pending", "Rejected"]} />
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5">
          <input type="date" aria-label="From date" value={dates.from} onChange={(e) => setDates((d) => ({ ...d, from: e.target.value }))} className="text-sm outline-none" />
          <span className="text-gray-400">–</span>
          <input type="date" aria-label="To date" value={dates.to} onChange={(e) => setDates((d) => ({ ...d, to: e.target.value }))} className="text-sm outline-none" />
        </div>
        <ClearButton onClick={() => { setSearch(""); setType("All Types"); setStatus("All Status"); setDates({ from: "", to: "" }); }} />
      </FilterBar>

      <TableCard footer={<Pagination paged={paged} noun="transactions" />}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
            <p className="text-sm text-gray-500">
              Current balance:{" "}
              <b className={balance >= 0 ? "text-emerald-600" : "text-red-600"}>{balance < 0 ? "−" : ""}₹{money2(Math.abs(balance))}</b>
            </p>
          </div>
          <button type="button" onClick={download} disabled={!filtered.length} className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
        <table className="min-w-full">
          <thead>
            <tr>
              <Th>#</Th><Th>Date &amp; Time</Th><Th>Transaction ID</Th><Th>Type</Th><Th>Description</Th>
              <Th className="text-right">Amount (₹)</Th><Th>Status</Th><Th className="text-right">Balance (₹)</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <EmptyRow colSpan={9}>Loading transactions…</EmptyRow>}
            {!loading && paged.slice.length === 0 && <EmptyRow colSpan={9}>No transactions in this period.</EmptyRow>}
            {!loading && paged.slice.map((r, i) => {
              const [tone, label] = STATUS[r.status] || ["gray", r.status];
              return (
                <tr key={r._id} className="hover:bg-gray-50">
                  <Td className="text-gray-500">{paged.start + i}</Td>
                  <Td><div>{fmtDate(r.date)}</div><div className="text-xs text-gray-500">{fmtTime(r.createdAt)}</div></Td>
                  <Td className="font-medium">{r.txnId}</Td>
                  <Td><Pill tone={r.type === "credit" ? "green" : "red"}>{r.type === "credit" ? "Credit" : "Debit"}</Pill></Td>
                  <Td className="whitespace-normal min-w-[180px]">{r.description || r.paymentType}</Td>
                  <Td className={`text-right font-bold ${r.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>{money2(r.amount)}</Td>
                  <Td><Pill tone={tone}>{label}</Pill></Td>
                  <Td className="text-right">{r.balance != null ? money2(r.balance) : "—"}</Td>
                  <Td><RowMenu items={[{ label: "View details", icon: Eye, onClick: () => setViewing(r) }]} /></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      {viewing && (
        <Modal title={`Transaction ${viewing.txnId}`} onClose={() => setViewing(null)} width="max-w-md">
          <dl className="grid grid-cols-[130px_1fr] gap-y-2.5 text-sm">
            {[
              ["Date", fmtDate(viewing.date)],
              ["Type", viewing.type === "credit" ? "Credit" : "Debit"],
              ["Payment type", viewing.paymentType],
              ["Amount", `₹${money2(viewing.amount)}`],
              ["Method", viewing.method || "—"],
              ["Your transaction ID", viewing.externalTxnId || "—"],
              ["Reference no.", viewing.reference || "—"],
              ["Status", STATUS[viewing.status]?.[1] || viewing.status],
              ...(viewing.rejectedReason ? [["Rejected because", viewing.rejectedReason]] : []),
              ["Notes", viewing.notes || "—"],
            ].map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-gray-500">{k}</dt>
                <dd className="text-gray-900 font-medium">{v}</dd>
              </React.Fragment>
            ))}
          </dl>
        </Modal>
      )}
    </div>
  );
}
