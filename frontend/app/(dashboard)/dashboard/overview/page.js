"use client";

import { useEffect, useState } from "react";
import { kpiApi } from "../../../../src/lib/api";
import { useUserStore } from "../../../../src/stores/userStore";
import UpcomingExams from "../../../../src/components/widgets/UpcomingExams";
import ConflictSummary from "../../../../src/components/widgets/ConflictSummary";
import Occupancy from "../../../../src/components/widgets/Occupancy";
import KPICards from "../../../../src/components/widgets/KPICards";
import SurveillanceLoad from "../../../../src/components/widgets/SurveillanceLoad";
import {
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";

const roleLabels = {
  'etudiant': 'Étudiant',
  'prof': 'Professeur',
  'doyen': 'Doyen',
  'chef_dept': 'Chef de Département',
  'admin_examens': 'Administrateur Examens'
};

const getRoleGreeting = (role) => {
  const greetings = {
    'etudiant': 'Bienvenue sur votre tableau de bord étudiant',
    'prof': 'Bienvenue sur votre tableau de bord enseignant',
    'doyen': 'Bienvenue sur votre tableau de bord doyen',
    'chef_dept': 'Bienvenue sur votre tableau de bord chef de département',
    'admin_examens': 'Bienvenue sur votre tableau de bord administrateur'
  };
  return greetings[role] || 'Bienvenue';
};

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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-3 text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-sm">
        <div className="px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-600 p-3">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Vue d'ensemble</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    {getRoleGreeting(role)}
                  </p>
                </div>
              </div>

              {user && (
                <div className="mt-4 flex items-center gap-2">
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Connecté en tant que <span className="font-semibold">{roleLabels[role] || role}</span>
                  </span>
                </div>
              )}
            </div>

            {run && (
              <div className="flex flex-col items-end gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 ring-1 ring-gray-300 shadow-sm">
                  <ChartBarIcon className="h-4 w-4 text-gray-600" />
                  Run #{run.id}
                </span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    {run.scope}
                  </span>
                  {run.published ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Publié
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      <InformationCircleIcon className="h-3.5 w-3.5" />
                      Brouillon
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-900">Erreur de chargement</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Widgets conditionnels selon le rôle */}
      <div className="space-y-6">
        {/* KPIs pour admin, chef, doyen */}
        {(role === "admin_examens" || role === "chef_dept" || role === "doyen") && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Indicateurs clés</h2>
            </div>
            <KPICards role={role} kpis={kpis} loading={loading} />
          </div>
        )}

        {/* Prochains examens pour étudiants et profs */}
        {(role === "etudiant" || role === "prof") && (
          <UpcomingExams role={role} exams={kpis.upcoming_exams} loading={loading} />
        )}

        {/* Layout en grille pour admin/doyen - 2 colonnes */}
        {(role === "admin_examens" || role === "chef_dept" || role === "doyen") && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Résumé conflits */}
            <ConflictSummary
              loading={loading}
              capacityExceeded={kpis.capacity_exceeded_count}
              roomCollisions={kpis.room_collision_count}
              avgFillRate={kpis.avg_room_fill_rate}
            />

            {/* Occupation salles pour admin et doyen */}
            {(role === "admin_examens" || role === "doyen") && (
              <Occupancy
                loading={loading}
                avgFillRate={kpis.avg_room_fill_rate}
                roomsUsedRatio={kpis.rooms_used_ratio}
                occupancyByDept={kpis.occupancy_by_dept}
              />
            )}
          </div>
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

