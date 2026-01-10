"use client";

import { useEffect, useState } from "react";
import RoleGate from "../../../../src/components/dashboard/RoleGate";
import { kpiApi } from "../../../../src/lib/api";
import { useUserStore } from "../../../../src/stores/userStore";

const formatPct = (v) => `${Math.round((v || 0) * 100)}%`;

export default function KpisPage() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [runIdInput, setRunIdInput] = useState("");

  const load = async (runId) => {
    setLoading(true);
    setError("");
    try {
      const res = await kpiApi.get(runId ? { run_id: runId } : {});
      setData(res);
    } catch (err) {
      setError(err.message || "Erreur KPI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const role = data?.role || user?.role;
  const kpis = data?.kpis || {};
  const run = data?.run;

  const baseCards = [
    { label: "Examens", value: kpis.exams_count },
    { label: "Jours couverts", value: kpis.days_covered },
    { label: "Salles utilisées", value: kpis.rooms_used },
    { label: "Capacité dépassée", value: kpis.capacity_exceeded_count },
    { label: "Collisions", value: kpis.room_collision_count },
    { label: "Taux remplissage moyen", value: formatPct(kpis.avg_room_fill_rate) }
  ];

  const renderAdmin = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {baseCards.slice(0, 6).map((c, idx) => (
          <div key={idx} className="rounded border p-3">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-semibold text-gray-900">{c.value ?? "-"}</p>
          </div>
        ))}
      </div>

      {kpis.exams_per_day?.length ? (
        <div className="rounded border p-3">
          <p className="font-semibold mb-2 text-gray-900">Examens par jour</p>
          <div className="space-y-1 text-sm text-gray-800">
            {kpis.exams_per_day.map((d) => (
              <div key={d.date} className="flex justify-between">
                <span>{d.date}</span>
                <span>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {kpis.top_over_capacity?.length ? (
        <div className="rounded border p-3">
          <p className="font-semibold mb-2 text-gray-900">Top dépassements</p>
          <div className="text-sm text-gray-800 space-y-1">
            {kpis.top_over_capacity.map((t, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{t.module} — {t.salle} ({t.date} {t.slot})</span>
                <span className="text-red-600">+{t.diff}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {kpis.top_underused_rooms?.length ? (
        <div className="rounded border p-3">
          <p className="font-semibold mb-2 text-gray-900">Salles sous-utilisées</p>
          <div className="text-sm text-gray-800 space-y-1">
            {kpis.top_underused_rooms.map((t, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{t.salle} — {t.module} ({t.date} {t.slot})</span>
                <span>{formatPct(t.fill_rate)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderDoyen = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { label: "Examens", value: kpis.exams_count },
          { label: "Taux remplissage", value: formatPct(kpis.avg_room_fill_rate) },
          { label: "Capacité dépassée", value: kpis.capacity_exceeded_count }
        ].map((c, idx) => (
          <div key={idx} className="rounded border p-3">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-semibold text-gray-900">{c.value ?? "-"}</p>
          </div>
        ))}
      </div>
      {kpis.occupancy_by_dept?.length ? (
        <div className="rounded border p-3">
          <p className="font-semibold mb-2 text-gray-900">Occupancy par département</p>
          <div className="text-sm text-gray-800 space-y-1">
            {kpis.occupancy_by_dept.map((d) => (
              <div key={d.dept_id} className="flex justify-between">
                <span>{d.dept_name}</span>
                <span>{formatPct(d.avg_room_fill_rate)} • {d.exams_count} exams</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {kpis.conflicts_by_dept?.length ? (
        <div className="rounded border p-3">
          <p className="font-semibold mb-2 text-gray-900">Dépassements par département</p>
          <div className="text-sm text-gray-800 space-y-1">
            {kpis.conflicts_by_dept.map((d) => (
              <div key={d.dept_id} className="flex justify-between">
                <span>{d.dept_name}</span>
                <span className="text-red-600">{d.capacity_exceeded_count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderChef = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {baseCards.slice(0, 4).map((c, idx) => (
          <div key={idx} className="rounded border p-3">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-semibold text-gray-900">{c.value ?? "-"}</p>
          </div>
        ))}
      </div>
      {kpis.formation_most_loaded?.length ? (
        <div className="rounded border p-3">
          <p className="font-semibold mb-2 text-gray-900">Formations les plus chargées</p>
          <div className="text-sm text-gray-800 space-y-1">
            {kpis.formation_most_loaded.map((f) => (
              <div key={f.id_formation} className="flex justify-between">
                <span>{f.nom}</span>
                <span>{f.count} exams</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderProf = () => (
    <div className="space-y-4">
      <div className="rounded border p-3">
        <p className="text-xs text-gray-500">Surveillances</p>
        <p className="text-xl font-semibold text-gray-900">{kpis.surveillances_count ?? 0}</p>
        {kpis.todo && <p className="text-xs text-gray-500 mt-1">{kpis.todo}</p>}
      </div>
      <div className="rounded border p-3">
        <p className="font-semibold mb-2 text-gray-900">Prochains examens (placeholder)</p>
        <p className="text-sm text-gray-600">Les surveillances seront disponibles quand le module sera implémenté.</p>
      </div>
    </div>
  );

  const renderEtudiant = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded border p-3">
          <p className="text-xs text-gray-500">Examens à venir</p>
          <p className="text-xl font-semibold text-gray-900">{kpis.exams_count ?? 0}</p>
        </div>
      </div>
      <div className="rounded border p-3">
        <p className="font-semibold mb-2 text-gray-900">Prochains examens</p>
        <div className="text-sm text-gray-800 space-y-1">
          {kpis.upcoming_exams?.length ? (
            kpis.upcoming_exams.map((e, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{e.date} {e.slot}</span>
                <span>{e.module} — {e.salle}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">Aucun examen planifié.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <RoleGate allowedRoles={["admin_examens", "doyen", "chef_dept", "prof", "etudiant"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KPIs</h1>
            {run && (
              <p className="text-sm text-gray-500">
                Run {run.id} • {run.scope} • status {run.status} • {run.published ? "publié" : "non publié"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="rounded border p-2 text-sm text-black"
              placeholder="Run ID (optionnel)"
              value={runIdInput}
              onChange={(e) => setRunIdInput(e.target.value)}
            />
            <button
              onClick={() => load(runIdInput || undefined)}
              disabled={loading}
              className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Recharger"}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!error && (
          <div>
            {role === "admin_examens" && renderAdmin()}
            {role === "doyen" && renderDoyen()}
            {role === "chef_dept" && renderChef()}
            {role === "prof" && renderProf()}
            {role === "etudiant" && renderEtudiant()}
          </div>
        )}
      </div>
    </RoleGate>
  );
}
