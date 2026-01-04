"use client";
import RoleGate from "../../../../src/components/dashboard/RoleGate";
import { useUserStore } from "../../../../src/stores/userStore";
import KPICards from "../../../../src/components/widgets/KPICards";

export default function KPIsPage() {
  const { user } = useUserStore();

  return (
    <RoleGate allowedRoles={["doyen", "chef_dept", "admin_examens"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Indicateurs de performance</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === "doyen" 
              ? "KPIs globaux de l'université"
              : user?.role === "chef_dept"
              ? "KPIs du département"
              : "KPIs opérationnels"}
          </p>
        </div>

        <KPICards role={user?.role} />
      </div>
    </RoleGate>
  );
}

