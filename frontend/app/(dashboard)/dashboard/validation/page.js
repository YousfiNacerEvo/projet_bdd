"use client";

import { useEffect, useState } from "react";
import RoleGate from "../../../../src/components/dashboard/RoleGate";
import { doyenApi } from "../../../../src/lib/api";

export default function ValidationPage() {
  const [runs, setRuns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  const loadRuns = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await doyenApi.listRuns(statusFilter);
      setRuns(data || []);
    } catch (err) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (runId) => {
    setLoadingItems(true);
    try {
      const data = await doyenApi.getRunItems(runId);
      setItems(data || []);
    } catch (err) {
      setError(err.message || "Erreur items");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, [statusFilter]);

  const selectRun = (run) => {
    setSelected(run);
    setItems([]);
    if (run) loadItems(run.id);
  };

  const approve = async () => {
    if (!selected) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await doyenApi.approve(selected.id);
      setSelected(res.run);
      await loadRuns();
    } catch (err) {
      setError(err.message || "Erreur approbation");
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!selected) return;
    if (!reason.trim()) {
      setError("Raison obligatoire");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      const res = await doyenApi.reject(selected.id, reason);
      setSelected(res.run);
      await loadRuns();
    } catch (err) {
      setError(err.message || "Erreur rejet");
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (run) => {
    if (run.published) return { label: "Publié", className: "bg-purple-100 text-purple-700" };
    if (run.status_doyen === "approved") return { label: "Validé", className: "bg-green-100 text-green-700" };
    if (run.status_doyen === "rejected") return { label: "Rejeté", className: "bg-red-100 text-red-700" };
    if (run.status_admin === "submitted") return { label: "Soumis", className: "bg-blue-100 text-blue-700" };
    return { label: "Brouillon", className: "bg-gray-100 text-gray-700" };
  };

  const renderItems = () => {
    if (loadingItems) return <p className="text-sm text-gray-500">Chargement des items...</p>;
    if (!items.length) return <p className="text-sm text-gray-500">Aucun item</p>;
    return (
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-black">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Slot</th>
              <th className="px-3 py-2 text-left">Module</th>
              <th className="px-3 py-2 text-left">Formation</th>
              <th className="px-3 py-2 text-left">Salle</th>
              <th className="px-3 py-2 text-left">Inscrits</th>
              <th className="px-3 py-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((it) => {
              const c = it.creneau;
              const date = c?.date || "-";
              const slot = c?.heure_debut ? `${c.heure_debut.slice(0, 5)}–${(c.heure_fin || "").slice(0, 5)}` : "-";
              const formation = it.module?.formation?.nom || "-";
              const salle = it.salle?.nom || it.salle_id;
              return (
                <tr key={it.id}>
                  <td className="px-3 py-2">{date}</td>
                  <td className="px-3 py-2">{slot}</td>
                  <td className="px-3 py-2">{it.module?.nom || `M${it.module_id}`}</td>
                  <td className="px-3 py-2">{formation}</td>
                  <td className="px-3 py-2">{salle}</td>
                  <td className="px-3 py-2">{it.expected_students}</td>
                  <td className="px-3 py-2">{it.notes || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <RoleGate allowedRoles={["doyen"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Validation des plannings</h1>
            <p className="mt-1 text-sm text-gray-500">Soumissions à valider</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border px-2 py-1 text-sm text-black"
          >
            <option value="submitted">Soumis</option>
            <option value="pending">En attente</option>
            <option value="approved">Validés</option>
            <option value="rejected">Rejetés</option>
            <option value="">Tous</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-1 rounded-lg bg-white p-4 shadow-sm">
            {loading && <p className="text-sm text-gray-500">Chargement...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && runs.map((run) => {
              const b = statusBadge(run);
              return (
                <button
                  key={run.id}
                  onClick={() => selectRun(run)}
                  className={`w-full text-left rounded border px-3 py-2 mb-2 ${selected?.id === run.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{run.scope}</p>
                      <p className="text-xs text-gray-500">{new Date(run.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.className}`}>{b.label}</span>
                  </div>
                  {run.status_doyen === "rejected" && run.rejection_reason && (
                    <p className="mt-1 text-xs text-red-600">Raison: {run.rejection_reason}</p>
                  )}
                </button>
              );
            })}
            {!loading && !runs.length && <p className="text-sm text-gray-500">Aucun run</p>}
          </div>

          <div className="md:col-span-2 rounded-lg bg-white p-4 shadow-sm space-y-4">
            {!selected && <p className="text-sm text-gray-500">Sélectionnez un run à valider</p>}
            {selected && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Run {selected.id}</p>
                    <p className="text-sm text-gray-600">
                      Scope: {selected.scope} • Admin: {selected.status_admin} • Doyen: {selected.status_doyen}
                    </p>
                    <p className="text-xs text-gray-500">
                      Soumis: {selected.submitted_at ? new Date(selected.submitted_at).toLocaleString() : "-"} •
                      Validé: {selected.approved_at ? new Date(selected.approved_at).toLocaleString() : "en attente"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={approve}
                      disabled={actionLoading || selected.status_doyen !== "pending" || selected.status_admin !== "submitted"}
                      className="rounded bg-green-600 px-3 py-2 text-white text-sm disabled:opacity-50"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={reject}
                      disabled={actionLoading || selected.status_doyen !== "pending" || selected.status_admin !== "submitted"}
                      className="rounded bg-red-600 px-3 py-2 text-white text-sm disabled:opacity-50"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
                <textarea
                  className="w-full rounded border p-2 text-sm text-black"
                  rows={3}
                  placeholder="Raison du rejet (obligatoire si rejet)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                {renderItems()}
              </>
            )}
          </div>
        </div>
      </div>
    </RoleGate>
  );
}

