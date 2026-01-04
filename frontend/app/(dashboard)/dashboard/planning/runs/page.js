"use client";
import RoleGate from "../../../../../src/components/dashboard/RoleGate";

export default function PlanningRunsPage() {
  return (
    <RoleGate allowedRoles={["admin_examens"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique des générations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Consultez l'historique des runs d'optimisation
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-gray-500">
            Liste des runs avec résultats (à implémenter)
          </p>
        </div>
      </div>
    </RoleGate>
  );
}

