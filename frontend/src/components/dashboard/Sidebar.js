"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItemsForRole, groupNavItems } from "../../config/nav";

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const navItems = getNavItemsForRole(role);
  const grouped = groupNavItems(navItems);

  const groupLabels = {
    principal: "Principal",
    departement: "Département",
    planning: "Planning",
    ressources: "Ressources",
    parametres: "Paramètres"
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="mb-6">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {groupLabels[group] || group}
            </h3>
            <ul className="space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

