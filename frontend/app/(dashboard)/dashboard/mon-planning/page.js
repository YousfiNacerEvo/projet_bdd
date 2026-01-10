"use client";

import { useEffect, useState } from "react";
import RoleGate from "../../../../src/components/dashboard/RoleGate";
import { useUserStore } from "../../../../src/stores/userStore";
import { planningApi } from "../../../../src/lib/api";

export default function MonPlanningPage() {
  const { user } = useUserStore();
  const [items, setItems] = useState([]);
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await planningApi.getPublished();
      setRun(data.run);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const renderTable = () => {
    if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (!run) return <p className="text-sm text-gray-500">Aucun planning publié.</p>;
    if (!items.length) return <p className="text-sm text-gray-500">Aucun item pour votre périmètre.</p>;

    return (
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-black">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Slot</th>
              <th className="px-4 py-2 text-left">Module</th>
              <th className="px-4 py-2 text-left">Formation</th>
              <th className="px-4 py-2 text-left">Inscrits</th>
              <th className="px-4 py-2 text-left">Salle</th>
              <th className="px-4 py-2 text-left">Capacité_exam</th>
              <th className="px-4 py-2 text-left">Surveillants</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((it) => {
              const c = it.creneau || {};
              const slot = c.heure_debut ? `${c.heure_debut.slice(0, 5)}–${(c.heure_fin || "").slice(0, 5)}` : "-";
              const salle = it.salle || {};
              const formation = it.module?.formation?.nom || "-";
              const surveillants =
                (it.surveillants || [])
                  .map((s) => (s.prenom || s.nom ? `${s.prenom || ""} ${s.nom || ""}`.trim() : s.id_prof || ""))
                  .filter(Boolean)
                  .join(", ") || "-";
              return (
                <tr key={it.id}>
                  <td className="px-4 py-2">{c.date || "-"}</td>
                  <td className="px-4 py-2">{slot}</td>
                  <td className="px-4 py-2">{it.module?.nom || `M${it.module_id}`}</td>
                  <td className="px-4 py-2">{formation}</td>
                  <td className="px-4 py-2">{it.expected_students}</td>
                  <td className="px-4 py-2">{salle.nom || it.salle_id}</td>
                  <td className="px-4 py-2">{salle.capacite_examen ?? salle.capacite ?? "-"}</td>
                  <td className="px-4 py-2">{surveillants}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <RoleGate allowedRoles={["etudiant", "prof"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon planning</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === "etudiant" ? "Consultez vos examens planifiés" : "Consultez vos examens et surveillances"}
          </p>
          {run && (
            <p className="text-xs text-gray-500 mt-1">
              Run {run.id} publié le {run.published_at ? new Date(run.published_at).toLocaleString() : "-"}
            </p>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">{renderTable()}</div>
      </div>
    </RoleGate>
  );
}

