"use client";

const formatPct = (v) => {
  if (v === null || v === undefined) return null;
  return `${Math.round((v || 0) * 100)}%`;
};

const Bar = ({ label, value, color }) => {
  const pct = formatPct(value);
  if (!pct) return null;

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium">{pct}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full`}
          style={{ width: pct }}
        ></div>
      </div>
    </div>
  );
};

export default function Occupancy({ avgFillRate, roomsUsedRatio, occupancyByDept = [], loading }) {
  const hasBars = avgFillRate !== undefined || roomsUsedRatio !== undefined;
  const hasDept = Array.isArray(occupancyByDept) && occupancyByDept.length > 0;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupation des salles</h3>

      {loading && <p className="text-sm text-gray-500">Chargement...</p>}

      {!loading && !hasBars && !hasDept && (
        <p className="text-sm text-gray-500">Données indisponibles</p>
      )}

      {!loading && hasBars && (
        <div className="space-y-4">
          <Bar label="Taux de remplissage moyen" value={avgFillRate} color="bg-blue-600" />
          <Bar label="Salles utilisées / total" value={roomsUsedRatio} color="bg-purple-600" />
        </div>
      )}

      {!loading && hasDept && (
        <div className="mt-6">
          <p className="font-semibold mb-2 text-gray-900">Par département</p>
          <div className="space-y-2 text-sm text-gray-800">
            {occupancyByDept.slice(0, 5).map((d) => (
              <div key={d.dept_id} className="flex justify-between">
                <span>{d.dept_name}</span>
                <span>
                  {formatPct(d.avg_room_fill_rate) || "-"} • {d.exams_count} exams
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

