"use client";
import RoleGate from "../../../../src/components/dashboard/RoleGate";

export default function ValidationPage() {
  return (
    <RoleGate allowedRoles={["doyen", "chef_dept"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Validez les plannings pour votre périmètre
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-gray-500">
            Interface de validation des plannings (à implémenter)
          </p>
        </div>
      </div>
    </RoleGate>
  );
}

