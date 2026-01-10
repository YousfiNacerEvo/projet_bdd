"use client";

import { useEffect, useState } from "react";
import { kpiApi } from "../../../../src/lib/api";
import { useUserStore } from "../../../../src/stores/userStore";
import UpcomingExams from "../../../../src/components/widgets/UpcomingExams";
import ConflictSummary from "../../../../src/components/widgets/ConflictSummary";
import Occupancy from "../../../../src/components/widgets/Occupancy";
import KPICards from "../../../../src/components/widgets/KPICards";
import SurveillanceLoad from "../../../../src/components/widgets/SurveillanceLoad";

export default function OverviewPage() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await kpiApi.get();
        setData(res);
      } catch (err) {
        setError(err.message || "Erreur KPI");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const role = data?.role || user?.role;
  const kpis = data?.kpis || {};
  const run = data?.run;

  if (!role && loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tableau de bord personnalisé selon votre rôle
        </p>
        {run && (
          <p className="text-xs text-gray-500 mt-1">
            Run {run.id} • {run.scope} • status {run.status} •{" "}
            {run.published ? "publié" : "non publié"}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Widgets conditionnels selon le rôle */}
      <div className="space-y-6">
        {/* KPIs pour admin, chef, doyen */}
        {(role === "admin_examens" || role === "chef_dept" || role === "doyen") && (
          <KPICards role={role} kpis={kpis} loading={loading} />
        )}

        {/* Prochains examens pour étudiants et profs */}
        {(role === "etudiant" || role === "prof") && (
          <UpcomingExams role={role} exams={kpis.upcoming_exams} loading={loading} />
        )}

        {/* Résumé conflits pour admin, chef, doyen */}
        {(role === "admin_examens" || role === "chef_dept" || role === "doyen") && (
          <ConflictSummary
            loading={loading}
            capacityExceeded={kpis.capacity_exceeded_count}
            roomCollisions={kpis.room_collision_count}
            avgFillRate={kpis.avg_room_fill_rate}
          />
        )}

        {/* Occupation salles pour admin et doyen */}
        {(role === "admin_examens" || role === "doyen") && (
          <Occupancy
            loading={loading}
            avgFillRate={kpis.avg_room_fill_rate}
            roomsUsedRatio={kpis.rooms_used_ratio}
            occupancyByDept={kpis.occupancy_by_dept}
          />
        )}

        {/* Charge surveillance pour prof */}
        {role === "prof" && (
          <SurveillanceLoad
            loading={loading}
            surveillancesCount={kpis.surveillances_count}
            todo={kpis.todo}
          />
        )}
      </div>
    </div>
  );
}

