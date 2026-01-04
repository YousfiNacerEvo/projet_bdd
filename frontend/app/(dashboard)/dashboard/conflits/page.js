"use client";
import RoleGate from "../../../../src/components/dashboard/RoleGate";

export default function ConflitsPage() {
  return (
    <RoleGate allowedRoles={["admin_examens", "chef_dept", "doyen"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conflits</h1>
          <p className="mt-1 text-sm text-gray-500">
            Détection et résolution des conflits de planning
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-gray-500">
            Interface de gestion des conflits avec filtres par formation (à implémenter)
          </p>
        </div>
      </div>
    </RoleGate>
  );
}

