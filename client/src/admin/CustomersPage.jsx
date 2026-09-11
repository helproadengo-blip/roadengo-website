import React, { useEffect, useMemo, useState } from "react";
import { Users, UserPlus, Repeat, IndianRupee } from "lucide-react";
import { apiService } from "../routing/apiClient";
import {
  PageHeader, StatCard, FilterBar, SearchInput, SelectBox, ClearButton, TableCard, Th, Td, EmptyRow, Pill,
  Avatar, Pagination, usePaged, money, fmtDate, cityOf, rangeFor, inRange,
} from "./ui";

/**
 * Everyone who has booked with Roadengo. Registered app users and guest
 * bookers are merged by phone number, so a customer who booked as a guest
 * and later signed up shows once.
 */
export default function CustomersPage({ appointments, emergencies }) {
  const [users, setUsers] = useState([]);
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All Customers");
  const [sort, setSort] = useState("recent");

  useEffect(() => {
    apiService.getCustomers().then((r) => setUsers(r.data?.users || [])).catch(() => setUsers([]));
    apiService.getBills().then((r) => setBills(r.data?.bills || [])).catch(() => setBills([]));
  }, []);

  const rows = useMemo(() => {
    const byPhone = {};
    const touch = (phone, patch) => {
      const k = String(phone || "").replace(/\D/g, "").slice(-10);
      if (!k) return null;
      byPhone[k] = byPhone[k] || { phone: k, name: "", bookings: 0, spent: 0, last: null, registered: false, address: "" };
      Object.assign(byPhone[k], patch(byPhone[k]));
      return byPhone[k];
    };
    [...appointments, ...emergencies].forEach((b) =>
      touch(b.phone, (c) => ({
        name: c.name || b.name,
        bookings: c.bookings + 1,
        address: c.address || b.address || (typeof b.location === "string" ? b.location : ""),
        last: !c.last || new Date(b.createdAt) > new Date(c.last) ? b.createdAt : c.last,
      }))
    );
    bills.forEach((b) => b.appointment?.phone && touch(b.appointment.phone, (c) => ({ spent: c.spent + (b.total || 0) })));
    users.forEach((u) =>
      touch(u.phone, (c) => ({ name: u.name || c.name, registered: true, email: u.email, photo: u.photo, joined: u.createdAt }))
    );
    return Object.values(byPhone).map((c) => ({ ...c, city: cityOf(c.address) }));
  }, [appointments, emergencies, bills, users]);

  const month = rangeFor("month");
  const stats = {
    total: rows.length,
    newThisMonth: rows.filter((c) => inRange(c.joined || c.last, month) && c.bookings <= 1).length,
    repeat: rows.filter((c) => c.bookings > 1).length,
    revenue: rows.reduce((s, c) => s + c.spent, 0),
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((c) => {
      if (type === "Registered" && !c.registered) return false;
      if (type === "Guest" && c.registered) return false;
      if (type === "Repeat" && c.bookings < 2) return false;
      if (!q) return true;
      return [c.name, c.phone, c.email, c.city].filter(Boolean).some((f) => String(f).toLowerCase().includes(q));
    });
    const by = {
      recent: (a, b) => new Date(b.last || 0) - new Date(a.last || 0),
      bookings: (a, b) => b.bookings - a.bookings,
      spent: (a, b) => b.spent - a.spent,
      name: (a, b) => (a.name || "").localeCompare(b.name || ""),
    };
    return list.sort(by[sort]);
  }, [rows, search, type, sort]);

  const paged = usePaged(filtered, 10, `${search}|${type}|${sort}`);

  return (
    <div>
      <PageHeader title="Customers" subtitle="Everyone who has booked a service with Roadengo." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard icon={Users} tone="red" label="Total Customers" value={stats.total} />
        <StatCard icon={UserPlus} tone="green" label="New This Month" value={stats.newThisMonth} />
        <StatCard icon={Repeat} tone="blue" label="Repeat Customers" value={stats.repeat} />
        <StatCard icon={IndianRupee} tone="purple" label="Lifetime Revenue" value={money(stats.revenue)} />
      </div>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, mobile, email or city" />
        <SelectBox label="Customer type" value={type} onChange={setType} options={["All Customers", "Registered", "Guest", "Repeat"]} />
        <SelectBox label="Sort" value={sort} onChange={setSort} options={[
          { value: "recent", label: "Recent First" }, { value: "bookings", label: "Most Bookings" },
          { value: "spent", label: "Top Spend" }, { value: "name", label: "Name A–Z" },
        ]} />
        <ClearButton onClick={() => { setSearch(""); setType("All Customers"); setSort("recent"); }} />
      </FilterBar>
      <TableCard footer={<Pagination paged={paged} noun="customers" />}>
        <table className="min-w-full">
          <thead>
            <tr><Th>#</Th><Th>Customer</Th><Th>Mobile</Th><Th>City</Th><Th>Bookings</Th><Th>Total Spent</Th><Th>Last Booking</Th><Th>Type</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.slice.length === 0 && <EmptyRow colSpan={8}>No customers match.</EmptyRow>}
            {paged.slice.map((c, i) => (
              <tr key={c.phone} className="hover:bg-gray-50">
                <Td className="text-gray-500">{paged.start + i}</Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} src={c.photo} />
                    <div>
                      <div className="font-medium text-gray-900">{c.name || "—"}</div>
                      {c.email && <div className="text-xs text-gray-500">{c.email}</div>}
                    </div>
                  </div>
                </Td>
                <Td><a href={`tel:${c.phone}`} className="hover:text-red-600">{c.phone}</a></Td>
                <Td>{c.city}</Td>
                <Td className="font-medium">{c.bookings}</Td>
                <Td className="font-semibold">{money(c.spent)}</Td>
                <Td>{fmtDate(c.last)}</Td>
                <Td><Pill tone={c.registered ? "green" : "gray"}>{c.registered ? "Registered" : "Guest"}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
