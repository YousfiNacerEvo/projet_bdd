"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import RoleGate from "../../../../../../src/components/dashboard/RoleGate";
import { adminApi } from "../../../../../../src/lib/api";

export default function RunDetailsPage() {
  const params = useParams();
  const runId = params?.id;
  const [run, setRun] = useState(null);
  const [items, setItems] = useState([]);
  const [conflicts, setConflicts] = useState(null);
  const [creneaux, setCreneaux] = useState([]);
  const [salles, setSalles] = useState([]);
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("items");
  const [publishing, setPublishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!runId) return;
    setLoading(true);
    setError("");
    try {
      const [r, its, crs, sals, forms] = await Promise.all([
        adminApi.getRun(runId),
        adminApi.getRunItems(runId),
        adminApi.listCreneaux(),
        adminApi.listSalles(),
        adminApi.listFormations()
      ]);
      setRun(r);
      setItems(its);
      setCreneaux(crs || []);
      setSalles(sals || []);
      setFormations(forms || []);
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

  return (
    <RoleGate allowedRoles={["admin_examens"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Run {runId}</h1>
            {run && (
              <p className="text-sm text-gray-500">
                {run.scope} • status: {run.status} • admin: {run.status_admin || "draft"} • doyen: {run.status_doyen || "pending"} • published: {run.published ? "oui" : "non"}
              </p>
            )}
          </div>
          <Link href="/dashboard/planning/runs" className="text-sm text-indigo-600 underline">
            Retour
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-gray-500">Chargement...</p>}

        {!loading && (
          <div>
            <div className="mb-3 flex gap-3 border-b">
              <button
                onClick={() => setTab("items")}
                className={`pb-2 text-sm ${tab === "items" ? "border-b-2 border-indigo-600 font-semibold" : "text-gray-500"}`}
              >
                Items
              </button>
              <button
                onClick={() => setTab("conflicts")}
                className={`pb-2 text-sm ${tab === "conflicts" ? "border-b-2 border-indigo-600 font-semibold" : "text-gray-500"}`}
              >
                Conflits
              </button>
              <button
                onClick={() => setTab("publish")}
                className={`pb-2 text-sm ${tab === "publish" ? "border-b-2 border-indigo-600 font-semibold" : "text-gray-500"}`}
              >
                Publication
              </button>
            </div>

            {tab === "items" && (
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
                      <th className="px-4 py-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((it) => {
                      const { date, slot } = creneauLabel(it);
                      const salleInfo = salleLabel(it);
                      return (
                        <tr key={it.id || `${it.module_id}-${it.salle_id}-${it.creneau_id}`}>
                          <td className="px-4 py-2">{date}</td>
                          <td className="px-4 py-2">{slot}</td>
                          <td className="px-4 py-2">{moduleLabel(it)}</td>
                          <td className="px-4 py-2">{formationLabel(it)}</td>
                          <td className="px-4 py-2">{it.expected_students}</td>
                          <td className="px-4 py-2">{salleInfo.label}</td>
                          <td className="px-4 py-2">{salleInfo.cap}</td>
                          <td className="px-4 py-2">{surveillantsLabel(it)}</td>
                          <td className="px-4 py-2">{it.notes || "-"}</td>
                        </tr>
                      );
                    })}
                    {!items.length && (
                      <tr>
                        <td className="px-4 py-2 text-gray-500" colSpan={9}>
                          Aucun item.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "conflicts" && (
              <div className="rounded-md border p-3">
                {!conflicts && <p className="text-sm text-gray-500">Chargement des conflits...</p>}
                {conflicts?.error && <p className="text-sm text-red-600">{conflicts.error}</p>}
                {conflicts && !conflicts.error && (
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-700">
                      Totaux — critical: {conflicts.totals?.critical ?? 0}, high: {conflicts.totals?.high ?? 0}
                    </p>
                    {conflicts.conflicts?.map((c, idx) => (
                      <div key={idx} className="rounded border border-yellow-200 bg-yellow-50 p-2">
                        <p className="font-semibold">
                          {c.type} ({c.severity})
                        </p>
                        <p className="text-gray-600">
                          Items: {c.items.map((i) => i.module_id).join(", ")} — salles/creneaux:{" "}
                          {c.items.map((i) => `${i.salle_id}/${i.creneau_id}`).join(", ")}
                        </p>
                      </div>
                    ))}
                    {!conflicts.conflicts?.length && <p className="text-gray-500">Aucun conflit.</p>}
                  </div>
                )}
              </div>
            )}

            {tab === "publish" && (
              <div className="space-y-3 rounded-md border p-3">
                <p className="text-sm text-gray-700">
                  Publier rend le run visible aux utilisateurs (prof/étudiants). Vous pourrez réécrire avec un nouveau run.
                </p>
                <div className="text-sm text-gray-700">
                  <p>Statut admin: {run?.status_admin || "draft"}</p>
                  <p>Statut doyen: {run?.status_doyen || "pending"}</p>
                  {run?.rejection_reason && (
                    <p className="text-red-600">Raison rejet: {run.rejection_reason}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Timeline: généré {run?.created_at ? new Date(run.created_at).toLocaleString() : "-"} → soumis {run?.submitted_at ? new Date(run.submitted_at).toLocaleString() : "-"} → validé {run?.approved_at ? new Date(run.approved_at).toLocaleString() : "en attente"} → publié {run?.published_at ? new Date(run.published_at).toLocaleString() : "non publié"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(run?.status_admin === "draft" || run?.status_doyen === "rejected") && run?.status === "done" && (
                    <button
                      onClick={submit}
                      disabled={submitting}
                      className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? "Soumission..." : "Soumettre au doyen"}
                    </button>
                  )}
                  <button
                    onClick={publish}
                    disabled={publishing || run?.status_doyen !== "approved" || run?.published}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {publishing ? "Publication..." : "Publier"}
                  </button>
                </div>
                <button
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    run?.status_doyen === "approved"
                      ? "bg-green-100 text-green-700"
                      : run?.status_doyen === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  disabled
                >
                  {run?.status_doyen === "approved" && "Validé par doyen"}
                  {run?.status_doyen === "rejected" && "Rejeté"}
                  {run?.status_doyen !== "approved" && run?.status_doyen !== "rejected" && "En attente validation"}
                </button>
                {run?.published && <p className="text-sm text-green-700">Déjà publié.</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </RoleGate>
  );
}

