import React, { useEffect, useMemo, useState } from "react";
import { Boxes, UserCog, PackageCheck, IndianRupee } from "lucide-react";
import { apiService } from "../routing/apiClient";
import {
  PageHeader, StatCard, FilterBar, SearchInput, SelectBox, ClearButton, TableCard, Th, Td, EmptyRow, Pill,
  Avatar, Pagination, usePaged, money, fmtDate,
} from "./ui";

/**
 * Parts sitting with mechanics in the field — everything issued through
 * Billing → "Bill to Mechanic", less what they have since used on customer
 * bills. Complements Spare Parts, which is the warehouse.
 */
export default function FleetInventoryPage({ onIssueParts }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mech, setMech] = useState("All Mechanics");
  const [state, setState] = useState("All Stock");

  useEffect(() => {
    apiService
      .getFleetStock()
      .then((r) => setStock(r.data?.stock || []))
      .catch(() => setStock([]))
      .finally(() => setLoading(false));
  }, []);

  const mechNames = useMemo(() => ["All Mechanics", ...Array.from(new Set(stock.map((s) => s.mechanic?.name).filter(Boolean))).sort()], [stock]);

  const inHand = stock.filter((s) => s.quantity > 0);
  const stats = {
    items: inHand.reduce((t, s) => t + s.quantity, 0),
    mechanics: new Set(inHand.map((s) => String(s.mechanic?._id))).size,
    lines: inHand.length,
    value: inHand.reduce((t, s) => t + s.quantity * (s.rate || 0), 0),
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stock.filter((s) => {
      if (mech !== "All Mechanics" && s.mechanic?.name !== mech) return false;
      if (state === "In Hand" && s.quantity <= 0) return false;
      if (state === "Used Up" && s.quantity > 0) return false;
      if (!q) return true;
      return [s.name, s.sku, s.mechanic?.name, s.mechanic?.mechanicId].filter(Boolean).some((f) => String(f).toLowerCase().includes(q));
    });
  }, [stock, search, mech, state]);

  const paged = usePaged(filtered, 10, `${search}|${mech}|${state}`);

  return (
    <div>
      <PageHeader title="Fleet Inventory" subtitle="Spare parts currently carried by your mechanics.">
        {onIssueParts && (
          <button type="button" onClick={onIssueParts} className="bg-red-700 hover:bg-red-800 text-white font-semibold px-5 py-2.5 rounded-xl">
            Issue parts to a mechanic
          </button>
        )}
      </PageHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard icon={Boxes} tone="red" label="Items In Hand" value={stats.items} />
        <StatCard icon={UserCog} tone="blue" label="Mechanics Carrying Stock" value={stats.mechanics} />
        <StatCard icon={PackageCheck} tone="green" label="Part Lines" value={stats.lines} />
        <StatCard icon={IndianRupee} tone="purple" label="Stock Value" value={money(stats.value)} />
      </div>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by part, SKU or mechanic" />
        <SelectBox label="Mechanic" value={mech} onChange={setMech} options={mechNames} />
        <SelectBox label="Stock" value={state} onChange={setState} options={["All Stock", "In Hand", "Used Up"]} />
        <ClearButton onClick={() => { setSearch(""); setMech("All Mechanics"); setState("All Stock"); }} />
      </FilterBar>
      <TableCard footer={<Pagination paged={paged} noun="lines" />}>
        <table className="min-w-full">
          <thead>
            <tr><Th>#</Th><Th>Mechanic</Th><Th>Part</Th><Th>SKU</Th><Th>Quantity</Th><Th>Rate</Th><Th>Value</Th><Th>Last Issued</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <EmptyRow colSpan={8}>Loading…</EmptyRow>}
            {!loading && paged.slice.length === 0 && (
              <EmptyRow colSpan={8}>No parts with mechanics yet. Issue some from Billing → Bill to Mechanic.</EmptyRow>
            )}
            {!loading && paged.slice.map((s, i) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <Td className="text-gray-500">{paged.start + i}</Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.mechanic?.name} src={s.mechanic?.location?.photo} />
                    <div>
                      <div className="font-medium text-gray-900">{s.mechanic?.name || "—"}</div>
                      <div className="text-xs text-gray-500">{s.mechanic?.mechanicId}</div>
                    </div>
                  </div>
                </Td>
                <Td className="font-medium">{s.name}</Td>
                <Td className="text-gray-600">{s.sku || "—"}</Td>
                <Td>{s.quantity > 0 ? <b>{s.quantity}</b> : <Pill tone="gray">Used up</Pill>}</Td>
                <Td>{money(s.rate)}</Td>
                <Td className="font-semibold">{money(s.quantity * (s.rate || 0))}</Td>
                <Td>{fmtDate(s.issuedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
