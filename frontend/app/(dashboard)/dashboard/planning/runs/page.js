"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGate from "../../../../../src/components/dashboard/RoleGate";
import { adminApi } from "../../../../../src/lib/api";
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

export default function PlanningRunsPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listRuns();
      setRuns(data || []);
    } catch (err) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (run) => {
    // Confirmation
    const confirmMessage = run.published 
      ? `⚠️ ATTENTION : Ce run est PUBLIÉ !\n\nVous ne pouvez pas supprimer un run publié.\nVeuillez d'abord le dépublier.`
      : `Êtes-vous sûr de vouloir supprimer le Run #${run.id} ?\n\nScope: ${run.scope}\nStatut: ${run.status}\n\nCette action est irréversible et supprimera aussi tous les items de planning associés.`;
    
    if (run.published) {
      alert(confirmMessage);
      return;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeleting(run.id);
    setError("");

    try {
      await adminApi.deleteRun(run.id);
      // Recharger la liste après suppression
      await load();
    } catch (err) {
      setError(err.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  };

  const badge = (run) => {
    if (run.published) 
      return { 
        label: "Publié", 
        className: "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
        icon: CheckCircleIcon
      };
    if (run.status_doyen === "approved") 
      return { 
        label: "Validé doyen", 
        className: "bg-green-100 text-green-700 ring-1 ring-green-200",
        icon: CheckCircleIcon
      };
    if (run.status_doyen === "rejected") 
      return { 
        label: "Rejeté", 
        className: "bg-red-100 text-red-700 ring-1 ring-red-200",
        icon: XCircleIcon
      };
    if (run.status_admin === "submitted") 
      return { 
        label: "Soumis", 
        className: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
        icon: ClockIcon
      };
    return { 
      label: "Brouillon", 
      className: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
      icon: InformationCircleIcon
    };
  };

  return (
    <RoleGate allowedRoles={["admin_examens"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Historique des générations</h1>
            <p className="mt-2 text-sm text-gray-600">Consultez l'historique de toutes les générations de planning</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              <ClipboardDocumentListIcon className="h-4 w-4" />
              {runs.length} run{runs.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-3 text-sm text-gray-600">Chargement...</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            {runs.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {runs.map((run) => {
                  const statusBadge = badge(run);
                  const BadgeIcon = statusBadge.icon;
                  
                  return (
                    <div key={run.id} className="px-6 py-4 transition-colors hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-base font-semibold text-gray-900">
                              Run #{run.id}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.className}`}>
                              <BadgeIcon className="h-3.5 w-3.5" />
                              {statusBadge.label}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                              {run.scope}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <ClockIcon className="h-4 w-4 text-gray-400" />
                              {new Date(run.created_at).toLocaleString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>

                            {run.metrics && (
                              <>
                                <span className="text-gray-400">•</span>
                                <div className="flex items-center gap-1.5">
                                  <ChartBarIcon className="h-4 w-4 text-gray-400" />
                                  <span>{run.metrics.exams_generated ?? run.metrics.nb_examens ?? 0} examens</span>
                                </div>
                              </>
                            )}

                            {run.metrics && run.metrics.capacity_exceeded > 0 && (
                              <>
                                <span className="text-gray-400">•</span>
                                <div className="flex items-center gap-1.5 text-orange-600">
                                  <ExclamationTriangleIcon className="h-4 w-4" />
                                  <span>{run.metrics.capacity_exceeded} capacité dépassée</span>
                                </div>
                              </>
                            )}

                            {run.published && (
                              <>
                                <span className="text-gray-400">•</span>
                                <div className="flex items-center gap-1.5 text-purple-600">
                                  <CheckCircleIcon className="h-4 w-4" />
                                  <span>Publié</span>
                                </div>
                              </>
                            )}
                          </div>

                          {run.status_doyen === "rejected" && run.rejection_reason && (
                            <div className="mt-2 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                              <XCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <span><strong>Raison du rejet:</strong> {run.rejection_reason}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(run)}
                            disabled={deleting === run.id}
                            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                              run.published
                                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                            } disabled:opacity-50`}
                            title={run.published ? "Impossible de supprimer un run publié" : "Supprimer ce run"}
                          >
                            {deleting === run.id ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent"></div>
                                Suppression...
                              </>
                            ) : (
                              <>
                                <TrashIcon className="h-4 w-4" />
                                Supprimer
                              </>
                            )}
                          </button>

                          <Link 
                            href={`/dashboard/planning/runs/${run.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                          >
                            Voir les détails
                            <ArrowRightIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-900">Aucune génération</p>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par générer votre premier planning
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/planning/generate"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                  >
                    Générer un planning
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RoleGate>
  );
}
