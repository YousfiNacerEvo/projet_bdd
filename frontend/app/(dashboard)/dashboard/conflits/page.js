"use client";
import { useEffect, useState } from "react";
import RoleGate from "../../../../src/components/dashboard/RoleGate";
import { adminApi, planningApi } from "../../../../src/lib/api";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  FunnelIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClockIcon,
  AcademicCapIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

export default function ConflitsPage() {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [conflicts, setConflicts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Charger la liste des runs
  const loadRuns = async () => {
    try {
      const data = await adminApi.listRuns();
      setRuns(data || []);
      
      // Sélectionner le dernier run publié par défaut
      const publishedRun = data.find(r => r.published);
      if (publishedRun) {
        setSelectedRunId(publishedRun.id);
        loadConflicts(publishedRun.id);
      } else if (data.length > 0) {
        // Sinon prendre le plus récent
        setSelectedRunId(data[0].id);
        loadConflicts(data[0].id);
      }
    } catch (err) {
      console.error("Error loading runs:", err);
    }
  };

  // Charger les conflits d'un run
  const loadConflicts = async (runId) => {
    if (!runId) return;
    
    setLoading(true);
    setError("");
    setConflicts(null);
    
    try {
      const data = await adminApi.getRunConflicts(runId);
      setConflicts(data);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des conflits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleRunChange = (runId) => {
    setSelectedRunId(runId);
    if (runId) {
      loadConflicts(runId);
    }
  };

  const handleRefresh = () => {
    if (selectedRunId) {
      loadConflicts(selectedRunId);
    }
  };

  // Filtrer les conflits par type
  const filteredConflicts = conflicts?.conflicts?.filter(c => {
    if (filterType === "all") return true;
    if (filterType === "critical") return c.severity === "critical";
    if (filterType === "high") return c.severity === "high";
    if (filterType === "ROOM_COLLISION") return c.type === "ROOM_COLLISION";
    if (filterType === "CAPACITY_EXCEEDED") return c.type === "CAPACITY_EXCEEDED";
    return true;
  }) || [];

  const selectedRun = runs.find(r => r.id === parseInt(selectedRunId));

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 ring-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 ring-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 ring-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 ring-gray-200";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "critical":
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case "high":
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <RoleGate allowedRoles={["admin_examens", "chef_dept", "doyen"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des conflits</h1>
            <p className="mt-2 text-sm text-gray-600">
              Détection et analyse des conflits dans les plannings générés
            </p>
          </div>
          {conflicts && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                conflicts.totals?.critical > 0 
                  ? 'bg-red-100 text-red-700 ring-1 ring-red-200'
                  : conflicts.totals?.high > 0
                  ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-200'
                  : 'bg-green-100 text-green-700 ring-1 ring-green-200'
              }`}>
                {conflicts.totals?.critical > 0 ? (
                  <XCircleIcon className="h-4 w-4" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                {conflicts.conflicts?.length || 0} conflit{conflicts.conflicts?.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Sélection du run et filtres */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Planning :</label>
              <select
                value={selectedRunId}
                onChange={(e) => handleRunChange(e.target.value)}
                className="flex-1 text-gray-900 rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 md:flex-none md:min-w-[300px]"
              >
                <option value="" className="text-gray-900">Sélectionner un run...</option>
                {runs.map((run) => (
                  <option key={run.id} value={run.id}>
                    Run #{run.id} - {run.scope} - {run.published ? "Publié" : "Non publié"} - {new Date(run.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-4 w-4 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-lg border border-gray-300 text-gray-900 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="all">Tous les conflits</option>
                  <option value="critical">Critiques uniquement</option>
                  <option value="high">Élevés uniquement</option>
                  <option value="ROOM_COLLISION">Collisions de salles</option>
                  <option value="CAPACITY_EXCEEDED">Capacité dépassée</option>
                </select>
              </div>

              <button
                onClick={handleRefresh}
                disabled={!selectedRunId || loading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>

          {selectedRun && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Infos du run :</span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                {selectedRun.scope}
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {selectedRun.status}
              </span>
              {selectedRun.published && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Publié
                </span>
              )}
            </div>
          )}
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-3 text-sm text-gray-600">Chargement des conflits...</p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">Erreur</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Résumé des conflits */}
        {!loading && conflicts && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 ring-1 ring-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-red-50 p-3 ring-1 ring-red-200">
                    <XCircleIcon className="h-6 w-6 text-red-700" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Conflits critiques</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{conflicts.totals?.critical || 0}</p>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 ring-1 ring-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-orange-50 p-3 ring-1 ring-orange-200">
                    <ExclamationTriangleIcon className="h-6 w-6 text-orange-700" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Conflits élevés</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{conflicts.totals?.high || 0}</p>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 ring-1 ring-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-3 ring-1 ${
                    (conflicts.totals?.critical || 0) + (conflicts.totals?.high || 0) === 0
                      ? 'bg-green-50 ring-green-200'
                      : 'bg-gray-50 ring-gray-200'
                  }`}>
                    {(conflicts.totals?.critical || 0) + (conflicts.totals?.high || 0) === 0 ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-700" />
                    ) : (
                      <ChartBarIcon className="h-6 w-6 text-gray-700" />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total conflits</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{conflicts.conflicts?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Liste des conflits */}
            {filteredConflicts.length > 0 ? (
              <div className="space-y-4">
                {filteredConflicts.map((conflict, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-6 shadow-sm ${
                      conflict.severity === 'critical'
                        ? 'border-red-200 bg-red-50'
                        : conflict.severity === 'high'
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(conflict.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className={`text-lg font-semibold ${
                              conflict.severity === 'critical'
                                ? 'text-red-900'
                                : conflict.severity === 'high'
                                ? 'text-orange-900'
                                : 'text-yellow-900'
                            }`}>
                              {conflict.type === 'ROOM_COLLISION' ? 'Collision de salle' : 'Capacité dépassée'}
                            </h3>
                          </div>
                          <p className={`mt-1 text-sm ${
                            conflict.severity === 'critical'
                              ? 'text-red-700'
                              : conflict.severity === 'high'
                              ? 'text-orange-700'
                              : 'text-yellow-700'
                          }`}>
                            {conflict.type === 'ROOM_COLLISION' 
                              ? `${conflict.items.length} examens assignés à la même salle au même créneau`
                              : `La salle n'a pas une capacité suffisante pour accueillir tous les étudiants`
                            }
                          </p>

                          {/* Détails des items en conflit */}
                          <div className="mt-4 space-y-3">
                            {conflict.items.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                className="rounded-lg bg-white p-4 ring-1 ring-gray-200"
                              >
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                                  <div className="flex items-center gap-2">
                                    <AcademicCapIcon className="h-4 w-4 text-gray-500" />
                                    <div>
                                      <p className="text-xs text-gray-500">Module</p>
                                      <p className="text-sm font-medium text-gray-900">
                                        Module #{item.module_id}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <BuildingOffice2Icon className="h-4 w-4 text-gray-500" />
                                    <div>
                                      <p className="text-xs text-gray-500">Salle</p>
                                      <p className="text-sm font-medium text-gray-900">
                                        Salle #{item.salle_id}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <CalendarDaysIcon className="h-4 w-4 text-gray-500" />
                                    <div>
                                      <p className="text-xs text-gray-500">Créneau</p>
                                      <p className="text-sm font-medium text-gray-900">
                                        #{item.creneau_id}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <ChartBarIcon className="h-4 w-4 text-gray-500" />
                                    <div>
                                      <p className="text-xs text-gray-500">Étudiants</p>
                                      <p className="text-sm font-medium text-gray-900">
                                        {item.expected_students}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getSeverityColor(conflict.severity)}`}>
                        {conflict.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-12 text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
                <p className="mt-3 text-sm font-medium text-green-900">
                  {filterType === "all" 
                    ? "Aucun conflit détecté !" 
                    : `Aucun conflit de type "${filterType}"`
                  }
                </p>
                <p className="mt-1 text-sm text-green-700">
                  {filterType === "all"
                    ? "Le planning est valide et prêt à être utilisé"
                    : "Essayez de changer le filtre pour voir d'autres conflits"
                  }
                </p>
              </div>
            )}
          </>
        )}

        {/* Aucun run sélectionné */}
        {!loading && !conflicts && !error && selectedRunId === "" && (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
            <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">Aucun planning sélectionné</p>
            <p className="mt-1 text-sm text-gray-500">
              Sélectionnez un run dans la liste ci-dessus pour voir ses conflits
            </p>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
