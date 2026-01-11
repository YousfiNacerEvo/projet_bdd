"use client";
import { useEffect, useState, useRef } from "react";
import RoleGate from "../../../../../src/components/dashboard/RoleGate";
import { adminApi } from "../../../../../src/lib/api";
import {
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

export default function ReferentielPage() {
  const [creneaux, setCreneaux] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ date: "", heure_debut: "", heure_fin: "" });
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);

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
    
    // Scroll vers le formulaire
    setTimeout(() => {
      if (formRef.current) {
        const yOffset = -20;
        const element = formRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 50);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Référentiel des créneaux</h1>
            <p className="mt-2 text-sm text-gray-600">Gérez les créneaux horaires pour les examens</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              <CalendarDaysIcon className="h-4 w-4" />
              {creneaux.length} créneau{creneaux.length > 1 ? 'x' : ''}
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
              {editingId ? "Modifier un créneau" : "Créer un nouveau créneau"}
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
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <CalendarDaysIcon className="h-4 w-4 text-gray-500" />
                  Date
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  Heure de début
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  type="time"
                  value={form.heure_debut}
                  onChange={(e) => setForm({ ...form, heure_debut: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  Heure de fin
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  type="time"
                  value={form.heure_fin}
                  onChange={(e) => setForm({ ...form, heure_fin: e.target.value })}
                  required
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
                    setForm({ date: "", heure_debut: "", heure_fin: "" });
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
                    Créer le créneau
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Liste des créneaux</h2>
            <p className="mt-1 text-sm text-gray-500">
              {creneaux.length > 0 ? `${creneaux.length} créneau${creneaux.length > 1 ? 'x' : ''} enregistré${creneaux.length > 1 ? 's' : ''}` : 'Aucun créneau enregistré'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4" />
                      Date
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      Heure début
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      Heure fin
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Durée</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {creneaux.map((c) => {
                  const debut = new Date(`2000-01-01T${c.heure_debut}`);
                  const fin = new Date(`2000-01-01T${c.heure_fin}`);
                  const dureeMinutes = (fin - debut) / 60000;
                  const dureeHeures = Math.floor(dureeMinutes / 60);
                  const dureeMinutesRestantes = dureeMinutes % 60;
                  
                  return (
                    <tr key={c.id_creneau} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {new Date(c.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{c.heure_debut}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{c.heure_fin}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {dureeHeures > 0 && `${dureeHeures}h`}
                        {dureeMinutesRestantes > 0 && `${dureeMinutesRestantes}min`}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                            onClick={() => startEdit(c)}
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                            Éditer
                          </button>
                          <button 
                            className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                            onClick={() => remove(c.id_creneau)}
                          >
                            <TrashIcon className="h-4 w-4" />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!creneaux.length && (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={5}>
                      <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm font-medium text-gray-900">Aucun créneau</p>
                      <p className="mt-1 text-sm text-gray-500">Commencez par créer votre premier créneau</p>
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
