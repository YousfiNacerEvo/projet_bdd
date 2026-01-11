"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import RoleGate from "../../../../../../src/components/dashboard/RoleGate";
import { adminApi } from "../../../../../../src/lib/api";
import { 
  PencilSquareIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";

export default function RunDetailsPage() {
  const params = useParams();
  const runId = params?.id;
  const [run, setRun] = useState(null);
  const [items, setItems] = useState([]);
  const [conflicts, setConflicts] = useState(null);
  const [creneaux, setCreneaux] = useState([]);
  const [salles, setSalles] = useState([]);
  const [formations, setFormations] = useState([]);
  const [profs, setProfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("items");
  const [publishing, setPublishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    salle_id: "",
    creneau_id: "",
    expected_students: "",
    surveillants: [],
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!runId) return;
    setLoading(true);
    setError("");
    try {
      const [r, its, crs, sals, forms, profs] = await Promise.all([
        adminApi.getRun(runId),
        adminApi.getRunItems(runId),
        adminApi.listCreneaux(),
        adminApi.listSalles(),
        adminApi.listFormations(),
        adminApi.listProfesseurs()
      ]);
      setRun(r);
      setItems(its);
      setCreneaux(crs || []);
      setSalles(sals || []);
      setFormations(forms || []);
      setProfs(profs || []);
    } catch (err) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const loadConflicts = async () => {
    if (!runId) return;
    try {
      const data = await adminApi.getRunConflicts(runId);
      setConflicts(data);
    } catch (err) {
      setConflicts({ error: err.message });
    }
  };

  useEffect(() => {
    load();
  }, [runId]);

  useEffect(() => {
    if (tab === "conflicts" && !conflicts) {
      loadConflicts();
    }
  }, [tab, runId]);

  const publish = async () => {
    setPublishing(true);
    setError("");
    try {
      if (run?.status_doyen !== "approved") {
        setError("Publication impossible sans validation du doyen");
        return;
      }
      const res = await adminApi.publishRun(runId);
      setRun(res.run || { ...run, published: true });
    } catch (err) {
      setError(err.message || "Erreur publication");
    } finally {
      setPublishing(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await adminApi.submitRun(runId);
      setRun(res.run || run);
    } catch (err) {
      setError(err.message || "Erreur soumission");
    } finally {
      setSubmitting(false);
    }
  };

  const creneauLabel = (item) => {
    const c = item.creneau || creneaux.find((x) => x.id_creneau === item.creneau_id);
    if (!c) return { date: "-", slot: "-" };
    const slot = `${(c.heure_debut || "").slice(0, 5)}–${(c.heure_fin || "").slice(0, 5)}`;
    return { date: c.date, slot };
  };

  const salleLabel = (item) => {
    const s = item.salle || salles.find((x) => x.id_salle === item.salle_id);
    if (!s) return { label: item.salle_id, cap: "-" };
    return { label: s.nom, cap: s.capacite_examen ?? s.capacite ?? "-" };
  };

  const moduleLabel = (item) => {
    const m = item.module;
    if (!m) return `M${item.module_id}`;
    return `${m.nom} (M${item.module_id})`;
  };

  const formationLabel = (item) => {
    const f = item.module?.formation;
    if (f?.nom) return f.nom;
    const map = formations.find((x) => x.id_formation === item.module?.id_formation);
    return map?.nom || "-";
  };

  const surveillantsLabel = (item) => {
    const list = item.surveillants || [];
    if (!list.length) return "-";
    return list
      .map((s) => {
        if (s.prenom || s.nom) return `${s.prenom || ""} ${s.nom || ""}`.trim();
        if (s.id_prof) return `P${s.id_prof}`;
        return "Surveillant";
      })
      .join(", ");
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      salle_id: item.salle_id || "",
      creneau_id: item.creneau_id || "",
      expected_students: item.expected_students || "",
      surveillants: item.surveillants || [],
      notes: item.notes || ""
    });
  };

  const closeEdit = () => {
    setEditingItem(null);
    setEditForm({
      salle_id: "",
      creneau_id: "",
      expected_students: "",
      surveillants: [],
      notes: ""
    });
  };

  const saveEdit = async () => {
    if (!editingItem?.id) return;
    setSaving(true);
    setError("");
    try {
      const updated = await adminApi.updatePlanningItem(editingItem.id, editForm);
      // Mettre à jour la liste des items
      setItems(items.map(it => it.id === updated.id ? updated : it));
      closeEdit();
      // Recharger les conflits si on est dans l'onglet conflits
      if (tab === "conflicts") {
        loadConflicts();
      }
    } catch (err) {
      setError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const toggleSurveillant = (profId) => {
    const prof = profs.find(p => p.id_prof === profId);
    if (!prof) return;
    
    const exists = editForm.surveillants.some(s => s.id_prof === profId);
    if (exists) {
      setEditForm({
        ...editForm,
        surveillants: editForm.surveillants.filter(s => s.id_prof !== profId)
      });
    } else {
      setEditForm({
        ...editForm,
        surveillants: [...editForm.surveillants, {
          id_prof: prof.id_prof,
          nom: prof.nom,
          prenom: prof.prenom
        }]
      });
    }
  };

  return (
    <RoleGate allowedRoles={["admin_examens"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Planning Run #{runId}</h1>
            {run && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                  <DocumentTextIcon className="h-4 w-4" />
                  {run.scope}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
                  run.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {run.status}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  Admin: <span className="font-medium text-gray-900">{run.status_admin || "draft"}</span>
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  Doyen: <span className="font-medium text-gray-900">{run.status_doyen || "pending"}</span>
                </span>
                {run.published && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircleIcon className="h-4 w-4" />
                      Publié
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <Link 
            href="/dashboard/planning/runs" 
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour
          </Link>
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

        {!loading && (
          <div>
            <div className="mb-6 flex gap-1 border-b border-gray-200">
              <button
                onClick={() => setTab("items")}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === "items" 
                    ? "border-b-2 border-indigo-600 text-indigo-600" 
                    : "text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <DocumentTextIcon className="h-4 w-4" />
                Items du planning
              </button>
              <button
                onClick={() => setTab("conflicts")}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === "conflicts" 
                    ? "border-b-2 border-indigo-600 text-indigo-600" 
                    : "text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <ExclamationTriangleIcon className="h-4 w-4" />
                Conflits
              </button>
              <button
                onClick={() => setTab("publish")}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === "publish" 
                    ? "border-b-2 border-indigo-600 text-indigo-600" 
                    : "text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <CheckCircleIcon className="h-4 w-4" />
                Publication
              </button>
            </div>

            {tab === "items" && (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Date
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Horaire</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Module</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Formation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          <div className="flex items-center gap-2">
                            <UserGroupIcon className="h-4 w-4" />
                            Inscrits
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            Salle
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Capacité</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Surveillants</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Notes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {items.map((it) => {
                        const { date, slot } = creneauLabel(it);
                        const salleInfo = salleLabel(it);
                        return (
                          <tr key={it.id || `${it.module_id}-${it.salle_id}-${it.creneau_id}`} className="transition-colors hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{date}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{slot}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{moduleLabel(it)}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{formationLabel(it)}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{it.expected_students}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{salleInfo.label}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{salleInfo.cap}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{surveillantsLabel(it)}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{it.notes || "-"}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                              <button
                                onClick={() => startEdit(it)}
                                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                                Éditer
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {!items.length && (
                        <tr>
                          <td className="px-6 py-12 text-center text-sm text-gray-500" colSpan={10}>
                            <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2">Aucun item dans ce planning</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "conflicts" && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                {!conflicts && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                      <p className="mt-3 text-sm text-gray-600">Chargement des conflits...</p>
                    </div>
                  </div>
                )}
                {conflicts?.error && (
                  <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
                    <p className="text-sm font-medium text-red-800">{conflicts.error}</p>
                  </div>
                )}
                {conflicts && !conflicts.error && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-red-50 px-4 py-3 ring-1 ring-red-200">
                        <p className="text-xs font-medium uppercase tracking-wider text-red-600">Critiques</p>
                        <p className="mt-1 text-2xl font-bold text-red-900">{conflicts.totals?.critical ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-orange-50 px-4 py-3 ring-1 ring-orange-200">
                        <p className="text-xs font-medium uppercase tracking-wider text-orange-600">Élevés</p>
                        <p className="mt-1 text-2xl font-bold text-orange-900">{conflicts.totals?.high ?? 0}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {conflicts.conflicts?.map((c, idx) => (
                        <div 
                          key={idx} 
                          className={`rounded-lg border p-4 ${
                            c.severity === 'critical' 
                              ? 'border-red-200 bg-red-50' 
                              : 'border-orange-200 bg-orange-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <ExclamationTriangleIcon className={`h-5 w-5 flex-shrink-0 ${
                                c.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                              }`} />
                              <div>
                                <p className={`font-semibold ${
                                  c.severity === 'critical' ? 'text-red-900' : 'text-orange-900'
                                }`}>
                                  {c.type}
                                </p>
                                <p className={`mt-1 text-sm ${
                                  c.severity === 'critical' ? 'text-red-700' : 'text-orange-700'
                                }`}>
                                  Modules: {c.items.map((i) => i.module_id).join(", ")}
                                </p>
                                <p className={`mt-1 text-xs ${
                                  c.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                                }`}>
                                  Salles/Créneaux: {c.items.map((i) => `${i.salle_id}/${i.creneau_id}`).join(", ")}
                                </p>
                              </div>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              c.severity === 'critical' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {c.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                      {!conflicts.conflicts?.length && (
                        <div className="rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-8 text-center">
                          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
                          <p className="mt-3 text-sm font-medium text-green-900">Aucun conflit détecté</p>
                          <p className="mt-1 text-xs text-green-700">Le planning est valide</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "publish" && (
              <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200">
                  <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">
                    Publier rend le planning visible aux utilisateurs (professeurs et étudiants). Vous pourrez générer un nouveau planning ultérieurement.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Statut Admin</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{run?.status_admin || "draft"}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Statut Doyen</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{run?.status_doyen || "pending"}</p>
                    </div>
                  </div>

                  {run?.rejection_reason && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                      <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-900">Raison du rejet</p>
                        <p className="mt-1 text-sm text-red-700">{run.rejection_reason}</p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Chronologie</p>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Généré:</span>
                        <span>{run?.created_at ? new Date(run.created_at).toLocaleString('fr-FR') : "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Soumis:</span>
                        <span>{run?.submitted_at ? new Date(run.submitted_at).toLocaleString('fr-FR') : "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Validé:</span>
                        <span>{run?.approved_at ? new Date(run.approved_at).toLocaleString('fr-FR') : "en attente"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Publié:</span>
                        <span>{run?.published_at ? new Date(run.published_at).toLocaleString('fr-FR') : "non publié"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {(run?.status_admin === "draft" || run?.status_doyen === "rejected") && run?.status === "done" && (
                    <button
                      onClick={submit}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                      {submitting ? "Soumission..." : "Soumettre au doyen"}
                    </button>
                  )}
                  <button
                    onClick={publish}
                    disabled={publishing || run?.status_doyen !== "approved" || run?.published}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    {publishing ? "Publication..." : "Publier le planning"}
                  </button>
                  
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      run?.status_doyen === "approved"
                        ? "bg-green-100 text-green-800"
                        : run?.status_doyen === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {run?.status_doyen === "approved" && (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Validé par le doyen
                      </>
                    )}
                    {run?.status_doyen === "rejected" && (
                      <>
                        <XMarkIcon className="h-4 w-4" />
                        Rejeté
                      </>
                    )}
                    {run?.status_doyen !== "approved" && run?.status_doyen !== "rejected" && (
                      <>
                        <InformationCircleIcon className="h-4 w-4" />
                        En attente de validation
                      </>
                    )}
                  </span>
                </div>

                {run?.published && (
                  <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <p className="text-sm font-medium text-green-800">
                      Ce planning a déjà été publié et est visible par tous les utilisateurs.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal d'édition */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
              {/* Header du modal */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Éditer l&apos;item du planning
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Modifiez les détails de cet examen
                  </p>
                </div>
                <button
                  onClick={closeEdit}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Fermer"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Corps du modal */}
              <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-6">
                <div className="space-y-6 text-black">
                  {/* Informations du module */}
                  <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Module</p>
                      <p className="text-base font-semibold text-gray-900">
                        {moduleLabel(editingItem)}
                      </p>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Formation</p>
                      <p className="text-base text-gray-700">
                        {formationLabel(editingItem)}
                      </p>
                    </div>
                  </div>

                  {/* Formulaire */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-500" />
                        Salle
                      </label>
                      <select
                        value={editForm.salle_id}
                        onChange={(e) => setEditForm({ ...editForm, salle_id: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="">Sélectionner une salle</option>
                        {salles.map((s) => (
                          <option key={s.id_salle} value={s.id_salle}>
                            {s.nom} (Capacité: {s.capacite_examen ?? s.capacite})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        Créneau
                      </label>
                      <select
                        value={editForm.creneau_id}
                        onChange={(e) => setEditForm({ ...editForm, creneau_id: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="">Sélectionner un créneau</option>
                        {creneaux.map((c) => (
                          <option key={c.id_creneau} value={c.id_creneau}>
                            {c.date} • {c.heure_debut?.slice(0, 5)} - {c.heure_fin?.slice(0, 5)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <UserGroupIcon className="h-4 w-4 text-gray-500" />
                        Nombre d&apos;étudiants
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.expected_students}
                        onChange={(e) => setEditForm({ ...editForm, expected_students: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                        Notes
                      </label>
                      <input
                        type="text"
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="Notes ou remarques..."
                      />
                    </div>
                  </div>

                  {/* Sélection des surveillants */}
                  <div>
                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <UserGroupIcon className="h-4 w-4 text-gray-500" />
                      Surveillants 
                      <span className="ml-2 inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                        {editForm.surveillants.length} sélectionné{editForm.surveillants.length > 1 ? 's' : ''}
                      </span>
                    </label>
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-300 bg-white">
                      <div className="divide-y divide-gray-100">
                        {profs.map((p) => {
                          const isSelected = editForm.surveillants.some(s => s.id_prof === p.id_prof);
                          return (
                            <label
                              key={p.id_prof}
                              className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSurveillant(p.id_prof)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {p.prenom} {p.nom}
                                </span>
                                {p.id_dept && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    Dépt. {p.id_dept}
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                      <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer du modal */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  onClick={closeEdit}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  disabled={saving}
                >
                  <XMarkIcon className="h-4 w-4" />
                  Annuler
                </button>
                <button
                  onClick={saveEdit}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={saving}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}

