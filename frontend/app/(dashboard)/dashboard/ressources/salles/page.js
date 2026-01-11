"use client";
import { useEffect, useState, useRef } from "react";
import RoleGate from "../../../../../src/components/dashboard/RoleGate";
import { adminApi } from "../../../../../src/lib/api";
import {
  BuildingOffice2Icon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

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
  const formRef = useRef(null);

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
    
    // Validation côté client: capacité maximum 40 élèves
    const capacite = Number(form.capacite);
    const capaciteExamen = Number(form.capacite_examen || form.capacite);
    
    if (capacite > 40) {
      setError("La capacité d'une salle ne peut pas dépasser 40 élèves");
      return;
    }
    
    if (capaciteExamen > 40) {
      setError("La capacité d'examen d'une salle ne peut pas dépasser 40 élèves");
      return;
    }
    
    try {
      if (editingId) {
        await adminApi.updateSalle(editingId, {
          ...form,
          capacite: capacite,
          capacite_examen: capaciteExamen
        });
      } else {
        await adminApi.createSalle({
          ...form,
          capacite: capacite,
          capacite_examen: capaciteExamen
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
    
    // Scroll vers le formulaire
    setTimeout(() => {
      if (formRef.current) {
        const yOffset = -20; // Petit décalage pour ne pas coller au bord
        const element = formRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 50);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des salles</h1>
            <p className="mt-2 text-sm text-gray-600">Gérez les salles et amphithéâtres avec leurs capacités</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              <BuildingOffice2Icon className="h-4 w-4" />
              {salles.length} {salles.length > 1 ? 'salles' : 'salle'}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm" ref={formRef}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Modifier une salle" : "Créer une nouvelle salle"}
            </h2>
            {editingId && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                <PencilSquareIcon className="h-3.5 w-3.5" />
                Mode édition
              </span>
            )}
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nom de la salle
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Ex: Salle A101"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Bâtiment
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Ex: Bâtiment A"
                  value={form.batiment}
                  onChange={(e) => setForm({ ...form, batiment: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="salle">Salle</option>
                  <option value="amphi">Amphi</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Capacité normale (max 40)
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="30"
                  type="number"
                  min="1"
                  max="40"
                  value={form.capacite}
                  onChange={(e) => setForm({ ...form, capacite: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Capacité examen (optionnel)
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="25"
                  type="number"
                  min="1"
                  max="40"
                  value={form.capacite_examen}
                  onChange={(e) => setForm({ ...form, capacite_examen: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              {editingId && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ nom: "", batiment: "", type: "salle", capacite: "", capacite_examen: "" });
                  }}
                >
                  <XMarkIcon className="h-4 w-4" />
                  Annuler
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              >
                {editingId ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Mettre à jour
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4" />
                    Créer la salle
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Liste des salles</h2>
            <p className="mt-1 text-sm text-gray-500">
              {salles.length > 0 ? `${salles.length} salle${salles.length > 1 ? 's' : ''} enregistrée${salles.length > 1 ? 's' : ''}` : 'Aucune salle enregistrée'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-2">
                      <BuildingOffice2Icon className="h-4 w-4" />
                      Nom
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Bâtiment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Capacité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cap. Examen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {salles.map((s) => (
                  <tr key={s.id_salle} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{s.nom}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{s.batiment || '-'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.type === 'amphi' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {s.type === 'amphi' ? 'Amphi' : 'Salle'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{s.capacite ?? s.capacite_normale}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{s.capacite_examen ?? "-"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button 
                          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                          onClick={() => startEdit(s)}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Éditer
                        </button>
                        <button 
                          className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                          onClick={() => remove(s.id_salle)}
                        >
                          <TrashIcon className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!salles.length && (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={6}>
                      <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm font-medium text-gray-900">Aucune salle</p>
                      <p className="mt-1 text-sm text-gray-500">Commencez par créer votre première salle</p>
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

