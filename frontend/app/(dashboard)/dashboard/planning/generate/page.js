"use client";
import { useState } from "react";
import Link from "next/link";
import RoleGate from "../../../../../src/components/dashboard/RoleGate";
import { adminApi } from "../../../../../src/lib/api";
import {
  CogIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

export default function GeneratePlanningPage() {
  const [scope, setScope] = useState("global");
  const [deptId, setDeptId] = useState("");
  const [formationId, setFormationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = { scope };
      if (scope === "departement") payload.dept_id = Number(deptId);
      if (scope === "formation") payload.formation_id = Number(formationId);
      if (startDate) payload.start_date = startDate;
      if (endDate) payload.end_date = endDate;
      const res = await adminApi.runPlanning(payload);
      setResult(res);
    } catch (err) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGate allowedRoles={["admin_examens"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Générer un planning</h1>
            <p className="mt-2 text-sm text-gray-600">Lancez la génération automatique du planning d'examens optimisé</p>
          </div>
          <SparklesIcon className="h-12 w-12 text-indigo-600" />
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">Erreur de génération</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="overflow-hidden rounded-lg border border-green-200 bg-green-50 shadow-sm">
            <div className="border-b border-green-200 bg-green-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-700" />
                <div>
                  <h3 className="font-semibold text-green-900">Génération réussie !</h3>
                  <p className="text-sm text-green-700">Le planning a été généré avec succès</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-white p-4 ring-1 ring-green-200">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Run ID</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">#{result.run?.id || result.run_id}</p>
                </div>
                {result.run?.metrics && (
                  <>
                    <div className="rounded-lg bg-white p-4 ring-1 ring-green-200">
                      <div className="flex items-center gap-2">
                        <ChartBarIcon className="h-4 w-4 text-gray-500" />
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Examens générés</p>
                      </div>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {result.run.metrics.exams_generated ?? result.run.metrics.nb_examens ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-4 ring-1 ring-green-200">
                      <div className="flex items-center gap-2">
                        <InformationCircleIcon className="h-4 w-4 text-gray-500" />
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Taux d'occupation</p>
                      </div>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {Math.round((result.run.metrics.avg_room_fill_rate || 0) * 100)}%
                      </p>
                    </div>
                  </>
                )}
              </div>

              {result.run?.metrics && result.run.metrics.capacity_exceeded > 0 && (
                <div className="mt-4 flex items-start gap-2 rounded-md bg-orange-50 px-4 py-3 text-sm">
                  <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">Attention</p>
                    <p className="text-orange-700">
                      {result.run.metrics.capacity_exceeded} salle(s) avec capacité dépassée
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Link 
                  href={`/dashboard/planning/runs/${result.run?.id || result.run_id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800"
                >
                  Voir les détails du planning
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <CogIcon className="h-6 w-6 text-gray-700" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Configuration de la génération</h2>
                <p className="text-sm text-gray-500">Définissez les paramètres pour générer le planning</p>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-6">
            <div className="space-y-6">
              <div className="rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200">
                <div className="flex gap-3">
                  <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium">Informations importantes</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-blue-800">
                      <li>La génération peut prendre quelques secondes selon le volume</li>
                      <li>Le système optimise automatiquement l'affectation des salles et des créneaux</li>
                      <li>Les surveillants sont assignés en respectant la limite de 3 examens par jour</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Périmètre de génération
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-gray-900"
                >
                  <option value="global">Global (toute l'université)</option>
                  {/* <option value="departement">Département</option>
                  <option value="formation">Formation</option> */}
                </select>
              </div>

              {scope === "departement" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Département ID</label>
                  <input
                    type="number"
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="1"
                  />
                </div>
              )}

              {scope === "formation" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Formation ID</label>
                  <input
                    type="number"
                    value={formationId}
                    onChange={(e) => setFormationId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="1"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Période (optionnel)
                </label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600">
                      <CalendarDaysIcon className="h-4 w-4" />
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600">
                      <CalendarDaysIcon className="h-4 w-4" />
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Si non spécifié, le système utilisera tous les créneaux disponibles
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      Lancer la génération
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </RoleGate>
  );
}
