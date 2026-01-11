"use client";

import { useEffect, useMemo, useState } from "react";
import RoleGate from "../../../../src/components/dashboard/RoleGate";
import { useUserStore } from "../../../../src/stores/userStore";
import { planningApi } from "../../../../src/lib/api";
import ExamCalendar from "../../../../src/components/widgets/ExamCalendar";
import {
  CalendarDaysIcon,
  ClockIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  EyeIcon,
  UserGroupIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ListBulletIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";

const slotLabel = (c = {}) =>
  c.heure_debut ? `${c.heure_debut.slice(0, 5)}–${(c.heure_fin || "").slice(0, 5)}` : "-";

const surveillantsLabel = (list = []) =>
  list
    .map((s) => (s.prenom || s.nom ? `${s.prenom || ""} ${s.nom || ""}`.trim() : s.id_prof || ""))
    .filter(Boolean)
    .join(", ") || "-";

const Table = ({ items, emptyLabel, icon: Icon }) => {
  if (!items.length) {
    return (
      <div className="py-12 text-center">
        {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400" />}
        <p className="mt-2 text-sm text-gray-500">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-4 w-4" />
                  Date
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Horaire
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Module</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Formation</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4" />
                  Inscrits
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <div className="flex items-center gap-2">
                  <BuildingOffice2Icon className="h-4 w-4" />
                  Salle
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Capacité</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Surveillants</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((it) => {
              const c = it.creneau || {};
              const salle = it.salle || {};
              const formation = it.module?.formation?.nom || "-";
              return (
                <tr key={it.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {c.date ? new Date(c.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    }) : "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{slotLabel(c)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{it.module?.nom || `M${it.module_id}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formation}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{it.expected_students}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{salle.nom || it.salle_id}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{salle.capacite_examen ?? salle.capacite ?? "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{surveillantsLabel(it.surveillants)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function MonPlanningPage() {
  const { user } = useUserStore();
  const [items, setItems] = useState([]);
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("calendar"); // "calendar" ou "list"

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await planningApi.getPublished();
      console.log("[mon-planning] Données reçues:", {
        run: data.run,
        itemsCount: data.items?.length || 0,
        items: data.items
      });
      setRun(data.run);
      setItems(data.items || []);
    } catch (err) {
      console.error("[mon-planning] load error", err);
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const { surveillances, examsDept } = useMemo(() => {
    if (!items?.length) return { surveillances: [], examsDept: [] };
    const withSurv = items.filter((it) => (it.surveillants || []).length > 0);
    const others = items.filter((it) => (it.surveillants || []).length === 0);
    return { surveillances: withSurv, examsDept: others };
  }, [items]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-3 text-sm text-gray-600">Chargement...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      );
    }

    if (!run) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">Aucun planning publié</p>
          <p className="mt-1 text-sm text-gray-500">Le planning n'a pas encore été publié par l'administration</p>
        </div>
      );
    }

    if (user?.role === "prof") {
      return (
        <div className="space-y-6">
          {/* Tabs pour prof */}
          <div className="flex gap-1 border-b border-gray-200">
            <button
              onClick={() => setView("calendar")}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                view === "calendar"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
              Vue calendrier
            </button>
            <button
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                view === "list"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
              Vue liste
            </button>
          </div>

          {view === "calendar" ? (
            <div className="space-y-6">
              {surveillances.length > 0 && (
                <ExamCalendar items={surveillances} type="surveillances" />
              )}
              {examsDept.length > 0 && (
                <ExamCalendar items={examsDept} type="exams" />
              )}
              {surveillances.length === 0 && examsDept.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                  <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900">Aucun événement</p>
                  <p className="mt-1 text-sm text-gray-500">Vous n'avez pas de surveillance ou d'examen planifié</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-3 ring-1 ring-purple-200">
                    <EyeIcon className="h-6 w-6 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Mes surveillances</h3>
                    <p className="text-sm text-gray-500">
                      {surveillances.length} surveillance{surveillances.length > 1 ? 's' : ''} assignée{surveillances.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="mb-4 rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200">
                  <div className="flex gap-2">
                    <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                    <p className="text-sm text-blue-900">
                      Filtré par votre département. Un mapping direct prof → surveillant reste à affiner.
                    </p>
                  </div>
                </div>
                <Table items={surveillances} emptyLabel="Aucune surveillance trouvée" icon={EyeIcon} />
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-3 ring-1 ring-blue-200">
                    <AcademicCapIcon className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Examens de mon département</h3>
                    <p className="text-sm text-gray-500">
                      {examsDept.length} examen{examsDept.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Table items={examsDept} emptyLabel="Aucun examen listé" icon={AcademicCapIcon} />
              </div>
            </div>
          )}
        </div>
      );
    }

    // Pour les étudiants
    return (
      <div className="space-y-6">
        {/* Tabs pour étudiant */}
        <div className="flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setView("calendar")}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              view === "calendar"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Squares2X2Icon className="h-4 w-4" />
            Vue calendrier
          </button>
          <button
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              view === "list"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ListBulletIcon className="h-4 w-4" />
            Vue liste
          </button>
        </div>

        {view === "calendar" ? (
          <ExamCalendar items={items} type="exams" />
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 ring-1 ring-blue-200">
                <AcademicCapIcon className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mes examens</h3>
                <p className="text-sm text-gray-500">
                  {items.length} examen{items.length > 1 ? 's' : ''} planifié{items.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Table items={items} emptyLabel="Aucun examen pour votre formation" icon={AcademicCapIcon} />
          </div>
        )}
      </div>
    );
  };

  return (
    <RoleGate allowedRoles={["etudiant", "prof"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mon planning</h1>
            <p className="mt-2 text-sm text-gray-600">
              {user?.role === "etudiant" ? "Consultez vos examens planifiés" : "Consultez vos examens et surveillances"}
            </p>
            {run && (
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Planning publié
                </span>
                <span className="text-xs text-gray-500">
                  le {run.published_at ? new Date(run.published_at).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : "-"}
                </span>
              </div>
            )}
          </div>

          {/* Compteur total d'items pour le rôle actuel */}
          {!loading && run && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 ring-1 ring-blue-200">
                {user?.role === "prof" ? (
                  <>
                    <EyeIcon className="h-4 w-4" />
                    {surveillances.length + examsDept.length} événement{surveillances.length + examsDept.length > 1 ? 's' : ''}
                  </>
                ) : (
                  <>
                    <AcademicCapIcon className="h-4 w-4" />
                    {items.length} examen{items.length > 1 ? 's' : ''}
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {renderContent()}
      </div>
    </RoleGate>
  );
}
