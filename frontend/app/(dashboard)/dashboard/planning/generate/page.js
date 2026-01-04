"use client";
import RoleGate from "../../../../../src/components/dashboard/RoleGate";

export default function GeneratePlanningPage() {
  return (
    <RoleGate allowedRoles={["admin_examens"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Générer le planning</h1>
          <p className="mt-1 text-sm text-gray-500">
            Lancez la génération automatique du planning d'examens
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-gray-500">
            Interface de génération avec paramètres et suivi de job (à implémenter)
          </p>
        </div>
      </div>
    </RoleGate>
  );
}

