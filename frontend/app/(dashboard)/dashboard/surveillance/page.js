"use client";
import RoleGate from "../../../../src/components/dashboard/RoleGate";

export default function SurveillancePage() {
  return (
    <RoleGate allowedRoles={["prof"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surveillance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Répartition de vos surveillances et alertes de conflits
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-gray-500">
            Interface de gestion des surveillances (à implémenter)
          </p>
        </div>
      </div>
    </RoleGate>
  );
}

