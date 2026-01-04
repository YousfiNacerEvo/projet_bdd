"use client";
import RoleGate from "../../../../src/components/dashboard/RoleGate";
import { useUserStore } from "../../../../src/stores/userStore";

export default function MonPlanningPage() {
  const { user } = useUserStore();

  return (
    <RoleGate allowedRoles={["etudiant", "prof"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon planning</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === "etudiant" 
              ? "Consultez vos examens planifiés"
              : "Consultez vos examens et surveillances"}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-gray-500">
            {user?.role === "etudiant"
              ? "Liste des examens de l'étudiant (à implémenter avec filtres date/semestre)"
              : "Liste des examens surveillés et enseignés (à implémenter)"}
          </p>
        </div>
      </div>
    </RoleGate>
  );
}

