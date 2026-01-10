"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGate from "../../../../../src/components/dashboard/RoleGate";
import { adminApi } from "../../../../../src/lib/api";

export default function PlanningRunsPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const badge = (run) => {
    if (run.published) return { label: "Publié", className: "bg-purple-100 text-purple-700" };
    if (run.status_doyen === "approved") return { label: "Validé doyen", className: "bg-green-100 text-green-700" };
    if (run.status_doyen === "rejected") return { label: "Rejeté", className: "bg-red-100 text-red-700" };
    if (run.status_admin === "submitted") return { label: "Soumis", className: "bg-blue-100 text-blue-700" };
    return { label: "Brouillon", className: "bg-gray-100 text-gray-700" };
  };

  return (
    <RoleGate allowedRoles={["admin_examens"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique des générations</h1>
          <p className="mt-1 text-sm text-gray-500">Consultez l&apos;historique des runs d&apos;optimisation</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          {loading && <p className="text-sm text-gray-500">Chargement...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && (
            <div className="divide-y">
              {runs.map((run) => (
                <div key={run.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(run.created_at).toLocaleString()} — {run.scope}
                    </p>
                    <p className="text-xs text-gray-500">
                      status: {run.status} | admin: {run.status_admin || "draft"} | doyen: {run.status_doyen || "pending"}
                    </p>
                    {run.metrics && (
                      <p className="text-xs text-gray-500">
                        exams: {run.metrics.nb_examens ?? 0} | conflits: {run.metrics.nb_conflits ?? 0}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge(run).className}`}>
                        {badge(run).label}
                      </span>
                      {run.status_doyen === "approved" && <span className="text-green-500 text-xs">● Validé</span>}
                      {run.published && <span className="text-purple-600 text-xs">Publié</span>}
                      {run.status_doyen === "rejected" && run.rejection_reason && (
                        <span className="text-xs text-red-500">Raison: {run.rejection_reason}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/dashboard/planning/runs/${run.id}`} className="text-indigo-600 underline text-sm">
                    Détails
                  </Link>
                </div>
              ))}
              {!runs.length && <p className="text-sm text-gray-500">Aucun run pour le moment.</p>}
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
}

