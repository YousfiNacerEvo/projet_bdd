"use client";
import { useUserStore } from "../../../../src/stores/userStore";
import UpcomingExams from "../../../../src/components/widgets/UpcomingExams";
import ConflictSummary from "../../../../src/components/widgets/ConflictSummary";
import Occupancy from "../../../../src/components/widgets/Occupancy";
import KPICards from "../../../../src/components/widgets/KPICards";
import SurveillanceLoad from "../../../../src/components/widgets/SurveillanceLoad";

export default function OverviewPage() {
  const { user } = useUserStore();
  const role = user?.role;

  if (!role) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tableau de bord personnalisé selon votre rôle
        </p>
      </div>

      {/* Widgets conditionnels selon le rôle */}
      <div className="space-y-6">
        {/* KPIs pour admin, chef, doyen */}
        {(role === "admin_examens" || role === "chef_dept" || role === "doyen") && (
          <KPICards role={role} />
        )}

        {/* Prochains examens pour étudiants et profs */}
        {(role === "etudiant" || role === "prof") && (
          <UpcomingExams role={role} />
        )}

        {/* Résumé conflits pour admin, chef, doyen */}
        {(role === "admin_examens" || role === "chef_dept" || role === "doyen") && (
          <ConflictSummary />
        )}

        {/* Occupation salles pour admin et doyen */}
        {(role === "admin_examens" || role === "doyen") && (
          <Occupancy />
        )}

        {/* Charge surveillance pour prof */}
        {role === "prof" && (
          <SurveillanceLoad />
        )}
      </div>
    </div>
  );
}

