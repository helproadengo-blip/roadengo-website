import React from "react";
import { LogOut } from "lucide-react";
import { Avatar } from "./ui";

/**
 * The red panel sidebar from the designs: logo on top, white labels, the
 * active item as a white pill with red text, and the signed-in user above
 * Logout at the bottom. Shared by the admin and partner panels.
 *
 * @param items  [{ key, label, icon: LucideIcon }]
 * @param brand  optional block under the logo (the partner panel shows the
 *               garage's logo, name and city there)
 */
export default function Sidebar({ items, active, onSelect, user, onLogout, brand, open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-60 bg-gradient-to-b from-[#c1121f] to-[#a4101b] text-white flex flex-col transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 pt-5 pb-3">
          <img src="/images/logo-sidebar.png" alt="RoadEngo" className="w-44 mx-auto" />
        </div>

        {brand}

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {items.map((item) => {
            const isActive = active === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelect(item.key);
                  onClose?.();
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[15px] font-medium transition-colors text-left ${
                  isActive ? "bg-white text-red-700 font-semibold shadow-sm" : "text-white/95 hover:bg-white/10"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge ? (
                  <span
                    className={`ml-auto text-[11px] font-bold rounded-full px-2 py-0.5 ${
                      isActive ? "bg-red-600 text-white" : "bg-white text-red-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-5 pt-3 border-t border-white/15">
          <div className="flex items-center gap-3 px-1 mb-3">
            <Avatar name={user?.name} src={user?.photo} size={38} />
            <div className="min-w-0">
              <p className="font-semibold truncate">{user?.name || "Admin"}</p>
              <p className="text-xs text-white/75 truncate">{user?.role || "Super Admin"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[15px] font-medium hover:bg-white/10"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
