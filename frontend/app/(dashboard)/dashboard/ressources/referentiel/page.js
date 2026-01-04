"use client";
import RoleGate from "../../../../../src/components/dashboard/RoleGate";

export default function ReferentielPage() {
  return (
    <RoleGate allowedRoles={["admin_examens"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Référentiel</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestion des départements, formations, modules et créneaux
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-gray-500">
            Interface CRUD référentiel (à implémenter)
          </p>
        </div>
      </div>
    </RoleGate>
  );
}

