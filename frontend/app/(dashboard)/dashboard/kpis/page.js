"use client";

import { useEffect, useState } from "react";
import RoleGate from "../../../../src/components/dashboard/RoleGate";
import { kpiApi } from "../../../../src/lib/api";
import { useUserStore } from "../../../../src/stores/userStore";
import {
  ChartBarIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
  AcademicCapIcon,
  EyeIcon
} from "@heroicons/react/24/outline";

const formatPct = (v) => `${Math.round((v || 0) * 100)}%`;

export default function KpisPage() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [runIdInput, setRunIdInput] = useState("");

  const load = async (runId) => {
    setLoading(true);
    setError("");
    try {
      const res = await kpiApi.get(runId ? { run_id: runId } : {});
      setData(res);
    } catch (err) {
      setError(err.message || "Erreur KPI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const role = data?.role || user?.role;
  const kpis = data?.kpis || {};
  const run = data?.run;

  const KPICard = ({ icon: Icon, label, value, trend, color = "blue" }) => {
    const colors = {
      blue: "bg-blue-50 text-blue-700 ring-blue-200",
      green: "bg-green-50 text-green-700 ring-green-200",
      red: "bg-red-50 text-red-700 ring-red-200",
      orange: "bg-orange-50 text-orange-700 ring-orange-200",
      purple: "bg-purple-50 text-purple-700 ring-purple-200",
      gray: "bg-gray-50 text-gray-700 ring-gray-200"
    };

    return (
      <div className="rounded-lg bg-white p-6 ring-1 ring-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className={`rounded-lg p-3 ${colors[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value ?? "-"}</p>
        </div>
      </div>
    );
  };

  const renderAdmin = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard icon={ChartBarIcon} label="Examens générés" value={kpis.exams_count} color="blue" />
        <KPICard icon={CalendarDaysIcon} label="Jours couverts" value={kpis.days_covered} color="purple" />
        <KPICard icon={BuildingOffice2Icon} label="Salles utilisées" value={kpis.rooms_used} color="green" />
        <KPICard icon={ExclamationTriangleIcon} label="Capacité dépassée" value={kpis.capacity_exceeded_count} color="red" />
        <KPICard icon={ExclamationTriangleIcon} label="Collisions" value={kpis.room_collision_count} color="orange" />
        <KPICard icon={ArrowTrendingUpIcon} label="Taux de remplissage" value={formatPct(kpis.avg_room_fill_rate)} color="blue" />
      </div>

      {kpis.exams_per_day?.length ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Examens par jour</h3>
          </div>
          <div className="space-y-2">
            {kpis.exams_per_day.map((d) => (
              <div key={d.date} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-900">
                  {new Date(d.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  <ChartBarIcon className="h-4 w-4" />
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {kpis.top_over_capacity?.length ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-700" />
            <h3 className="text-lg font-semibold text-red-900">Top dépassements de capacité</h3>
          </div>
          <div className="space-y-2">
            {kpis.top_over_capacity.map((t, idx) => (
              <div key={idx} className="flex items-start justify-between rounded-lg bg-white px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{t.module}</p>
                  <p className="text-xs text-gray-500">{t.salle} • {t.date} {t.slot}</p>
                </div>
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                  +{t.diff}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {kpis.top_underused_rooms?.length ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BuildingOffice2Icon className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Salles sous-utilisées</h3>
          </div>
          <div className="space-y-2">
            {kpis.top_underused_rooms.map((t, idx) => (
              <div key={idx} className="flex items-start justify-between rounded-lg bg-gray-50 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{t.salle} - {t.module}</p>
                  <p className="text-xs text-gray-500">{t.date} {t.slot}</p>
                </div>
                <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                  {formatPct(t.fill_rate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderDoyen = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard icon={ChartBarIcon} label="Examens" value={kpis.exams_count} color="blue" />
        <KPICard icon={ArrowTrendingUpIcon} label="Taux remplissage" value={formatPct(kpis.avg_room_fill_rate)} color="green" />
        <KPICard icon={ExclamationTriangleIcon} label="Capacité dépassée" value={kpis.capacity_exceeded_count} color="red" />
      </div>

      {kpis.occupancy_by_dept?.length ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BuildingOffice2Icon className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Occupation par département</h3>
          </div>
          <div className="space-y-2">
            {kpis.occupancy_by_dept.map((d) => (
              <div key={d.dept_id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-900">{d.dept_name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{d.exams_count} examens</span>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {formatPct(d.avg_room_fill_rate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {kpis.conflicts_by_dept?.length ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-700" />
            <h3 className="text-lg font-semibold text-red-900">Dépassements par département</h3>
          </div>
          <div className="space-y-2">
            {kpis.conflicts_by_dept.map((d) => (
              <div key={d.dept_id} className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
                <span className="text-sm font-medium text-gray-900">{d.dept_name}</span>
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                  {d.capacity_exceeded_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderChef = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard icon={ChartBarIcon} label="Examens" value={kpis.exams_count} color="blue" />
        <KPICard icon={CalendarDaysIcon} label="Jours couverts" value={kpis.days_covered} color="purple" />
        <KPICard icon={BuildingOffice2Icon} label="Salles utilisées" value={kpis.rooms_used} color="green" />
        <KPICard icon={ExclamationTriangleIcon} label="Capacité dépassée" value={kpis.capacity_exceeded_count} color="red" />
      </div>

      {kpis.formation_most_loaded?.length ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Formations les plus chargées</h3>
          </div>
          <div className="space-y-2">
            {kpis.formation_most_loaded.map((f) => (
              <div key={f.id_formation} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-900">{f.nom}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  <ChartBarIcon className="h-3.5 w-3.5" />
                  {f.count} examens
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderProf = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard icon={EyeIcon} label="Surveillances" value={kpis.surveillances_count ?? 0} color="purple" />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-700" />
          <h3 className="text-lg font-semibold text-blue-900">Prochaines surveillances</h3>
        </div>
        <p className="text-sm text-blue-800">
          {kpis.todo || "Les surveillances seront disponibles quand le module sera implémenté."}
        </p>
      </div>
    </div>
  );

  const renderEtudiant = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard icon={AcademicCapIcon} label="Examens à venir" value={kpis.exams_count ?? 0} color="blue" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Prochains examens</h3>
        </div>
        <div className="space-y-2">
          {kpis.upcoming_exams?.length ? (
            kpis.upcoming_exams.map((e, idx) => (
              <div key={idx} className="flex items-start justify-between rounded-lg bg-gray-50 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{e.module}</p>
                  <p className="text-xs text-gray-500">{e.date} • {e.slot}</p>
                </div>
                <span className="ml-2 text-sm text-gray-600">{e.salle}</span>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Aucun examen planifié pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <RoleGate allowedRoles={["admin_examens", "doyen", "chef_dept", "prof", "etudiant"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Indicateurs de Performance</h1>
            {run && (
              <p className="mt-2 text-sm text-gray-600">
                Run #{run.id} • {run.scope} • 
                <span className={`ml-1 ${run.published ? 'text-green-600' : 'text-gray-500'}`}>
                  {run.published ? 'Publié' : 'Non publié'}
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Run ID (optionnel)"
              value={runIdInput}
              onChange={(e) => setRunIdInput(e.target.value)}
            />
            <button
              onClick={() => load(runIdInput || undefined)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Chargement...
                </>
              ) : (
                "Recharger"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {!error && (
          <div>
            {role === "admin_examens" && renderAdmin()}
            {role === "doyen" && renderDoyen()}
            {role === "chef_dept" && renderChef()}
            {role === "prof" && renderProf()}
            {role === "etudiant" && renderEtudiant()}
          </div>
        )}
      </div>
    </RoleGate>
  );
}
