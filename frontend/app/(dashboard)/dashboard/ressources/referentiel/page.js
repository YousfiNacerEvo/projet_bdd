"use client";
import { useEffect, useState } from "react";
import RoleGate from "../../../../../src/components/dashboard/RoleGate";
import { adminApi } from "../../../../../src/lib/api";

export default function ReferentielPage() {
  const [creneaux, setCreneaux] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ date: "", heure_debut: "", heure_fin: "" });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listCreneaux();
      setCreneaux(data || []);
    } catch (err) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await adminApi.updateCreneau(editingId, form);
      } else {
        await adminApi.createCreneau(form);
      }
      setForm({ date: "", heure_debut: "", heure_fin: "" });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message || "Erreur");
    }
  };

  const startEdit = (cr) => {
    setEditingId(cr.id_creneau);
    setForm({ date: cr.date, heure_debut: cr.heure_debut, heure_fin: cr.heure_fin });
  };

  const remove = async (id) => {
    if (!confirm("Supprimer ce créneau ?")) return;
    setError("");
    try {
      await adminApi.deleteCreneau(id);
      if (editingId === id) {
        setEditingId(null);
        setForm({ date: "", heure_debut: "", heure_fin: "" });
      }
      load();
    } catch (err) {
      setError(
        err.message ||
          "Impossible de supprimer ce créneau (il est peut-être utilisé dans un planning ou une autre ressource)."
      );
    }
  };

  return (
    <RoleGate allowedRoles={["admin_examens"]}>
      <div className="space-y-6 text-black">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Référentiel</h1>
          <p className="mt-1 text-sm text-gray-500">Gestion des créneaux d&apos;examens</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input
              className="rounded border p-2"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <input
              className="rounded border p-2"
              type="time"
              value={form.heure_debut}
              onChange={(e) => setForm({ ...form, heure_debut: e.target.value })}
            />
            <input
              className="rounded border p-2"
              type="time"
              value={form.heure_fin}
              onChange={(e) => setForm({ ...form, heure_fin: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <button className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700" type="submit">
                {editingId ? "Mettre à jour" : "Créer"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="rounded bg-gray-200 px-3 py-2 text-gray-700"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ date: "", heure_debut: "", heure_fin: "" });
                  }}
                >
                  Annuler
                </button>
              )}
            </div>
          </form>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 overflow-x-auto rounded border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Début</th>
                  <th className="px-4 py-2 text-left">Fin</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {creneaux.map((c) => (
                  <tr key={c.id_creneau}>
                    <td className="px-4 py-2">{c.date}</td>
                    <td className="px-4 py-2">{c.heure_debut}</td>
                    <td className="px-4 py-2">{c.heure_fin}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <button className="text-indigo-600 underline" onClick={() => startEdit(c)}>
                          Éditer
                        </button>
                        <button className="text-red-600 underline" onClick={() => remove(c.id_creneau)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!creneaux.length && (
                  <tr>
                    <td className="px-4 py-2 text-gray-500" colSpan={4}>
                      Aucun créneau.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}

