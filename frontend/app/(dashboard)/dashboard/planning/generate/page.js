"use client";
import { useState } from "react";
import Link from "next/link";
import RoleGate from "../../../../../src/components/dashboard/RoleGate";
import { adminApi } from "../../../../../src/lib/api";

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Générer le planning</h1>
          <p className="mt-1 text-sm text-gray-500">Lancez la génération automatique du planning d&apos;examens</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-black"
              >
                <option value="global">Global</option>
                {/* <option value="departement">Département</option>
                <option value="formation">Formation</option> */}
              </select>
            </div>

            {scope === "departement" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Département ID</label>
                <input
                  type="number"
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-black"
                />
              </div>
            )}

            {scope === "formation" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Formation ID</label>
                <input
                  type="number"
                  value={formationId}
                  onChange={(e) => setFormationId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-black"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-black"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Génération..." : "Lancer"}
            </button>
          </form>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {result && (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p>Run lancé: {result.run_id}</p>
              <p>Status: {result.status}</p>
              {result.metrics && (
                <div className="mt-2">
                  <p>Examens: {result.metrics.nb_examens}</p>
                  <p>Conflits: {result.metrics.nb_conflits}</p>
                  <p>Occupancy: {Math.round((result.metrics.occupancy_estimate || 0) * 100)}%</p>
                </div>
              )}
              <Link href={`/dashboard/planning/runs`} className="mt-2 inline-block text-indigo-600 underline">
                Voir les runs
              </Link>
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
}

