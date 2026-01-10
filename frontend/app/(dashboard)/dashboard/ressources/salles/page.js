"use client";
import { useEffect, useState } from "react";
import RoleGate from "../../../../../src/components/dashboard/RoleGate";
import { adminApi } from "../../../../../src/lib/api";

export default function SallesPage() {
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nom: "",
    batiment: "",
    type: "salle",
    capacite: "",
    capacite_examen: ""
  });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listSalles();
      setSalles(data || []);
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
        await adminApi.updateSalle(editingId, {
          ...form,
          capacite: Number(form.capacite),
          capacite_examen: Number(form.capacite_examen || form.capacite)
        });
      } else {
        await adminApi.createSalle({
          ...form,
          capacite: Number(form.capacite),
          capacite_examen: Number(form.capacite_examen || form.capacite)
        });
      }
      setForm({ nom: "", batiment: "", type: "salle", capacite: "", capacite_examen: "" });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message || "Erreur");
    }
  };

  const startEdit = (salle) => {
    setEditingId(salle.id_salle);
    setForm({
      nom: salle.nom,
      batiment: salle.batiment,
      type: salle.type,
      capacite: salle.capacite ?? salle.capacite_normale ?? "",
      capacite_examen: salle.capacite_examen ?? ""
    });
  };

  const remove = async (id) => {
    if (!confirm("Supprimer cette salle ?")) return;
    setError("");
    try {
      await adminApi.deleteSalle(id);
      if (editingId === id) {
        setEditingId(null);
        setForm({ nom: "", batiment: "", type: "salle", capacite: "", capacite_examen: "" });
      }
      load();
    } catch (err) {
      setError(
        err.message ||
          "Impossible de supprimer cette salle (elle est peut-être utilisée dans un planning ou une autre ressource)."
      );
    }
  };

  return (
    <RoleGate allowedRoles={["admin_examens"]}>
      <div className="space-y-6 text-black">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des salles</h1>
          <p className="mt-1 text-sm text-gray-500">CRUD salles et amphithéâtres avec capacités</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              className="rounded border p-2"
              placeholder="Nom"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />
            <input
              className="rounded border p-2"
              placeholder="Bâtiment"
              value={form.batiment}
              onChange={(e) => setForm({ ...form, batiment: e.target.value })}
            />
            <select
              className="rounded border p-2"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="salle">Salle</option>
              <option value="amphi">Amphi</option>
            </select>
            <input
              className="rounded border p-2"
              placeholder="Capacité"
              type="number"
              value={form.capacite}
              onChange={(e) => setForm({ ...form, capacite: e.target.value })}
            />
            <input
              className="rounded border p-2"
              placeholder="Capacité examen (optionnel)"
              type="number"
              value={form.capacite_examen}
              onChange={(e) => setForm({ ...form, capacite_examen: e.target.value })}
            />
            <button
              type="submit"
              className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              disabled={loading}
            >
              {editingId ? "Mettre à jour" : "Créer"}
            </button>
            {editingId && (
              <button
                type="button"
                className="rounded bg-gray-200 px-4 py-2 text-gray-700"
                onClick={() => {
                  setEditingId(null);
                  setForm({ nom: "", batiment: "", type: "salle", capacite: "", capacite_examen: "" });
                }}
              >
                Annuler
              </button>
            )}
          </form>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 overflow-x-auto rounded border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Nom</th>
                  <th className="px-4 py-2 text-left">Bâtiment</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Capacité</th>
                  <th className="px-4 py-2 text-left">Capacité examen</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salles.map((s) => (
                  <tr key={s.id_salle}>
                    <td className="px-4 py-2">{s.nom}</td>
                    <td className="px-4 py-2">{s.batiment}</td>
                    <td className="px-4 py-2">{s.type}</td>
                    <td className="px-4 py-2">{s.capacite ?? s.capacite_normale}</td>
                    <td className="px-4 py-2">{s.capacite_examen ?? "-"}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <button className="text-indigo-600 underline" onClick={() => startEdit(s)}>
                          Éditer
                        </button>
                        <button className="text-red-600 underline" onClick={() => remove(s.id_salle)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!salles.length && (
                  <tr>
                    <td className="px-4 py-2 text-gray-500" colSpan={6}>
                      Aucune salle.
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

