"use client";
import RoleGate from "../../../../../src/components/dashboard/RoleGate";

export default function SallesPage() {
  return (
    <RoleGate allowedRoles={["admin_examens"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des salles</h1>
          <p className="mt-1 text-sm text-gray-500">
            CRUD salles et amphithéâtres avec capacités
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-gray-500">
            Interface CRUD salles/amphis (à implémenter)
          </p>
        </div>
      </div>
    </RoleGate>
  );
}

