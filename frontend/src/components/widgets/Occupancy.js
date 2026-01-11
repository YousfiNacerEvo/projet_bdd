"use client";
import {
  BuildingOffice2Icon,
  ArrowTrendingUpIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

const formatPct = (v) => {
  if (v === null || v === undefined) return null;
  return `${Math.round((v || 0) * 100)}%`;
};

const Bar = ({ label, value, color, icon: Icon }) => {
  const pct = formatPct(value);
  if (!pct) return null;

  const colorClasses = {
    blue: "bg-blue-600",
    purple: "bg-purple-600",
    green: "bg-green-600",
    indigo: "bg-indigo-600"
  };

  return (
    <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-500" />}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-lg font-bold text-gray-900">{pct}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`${colorClasses[color] || colorClasses.blue} h-3 rounded-full transition-all duration-500`}
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
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-3 ring-1 ring-indigo-200">
            <BuildingOffice2Icon className="h-6 w-6 text-indigo-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Occupation des salles</h3>
            <p className="text-sm text-gray-500">Analyse de l'utilisation des ressources</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Chargement...</p>
            </div>
          </div>
        )}

        {!loading && !hasBars && !hasDept && (
          <div className="py-8 text-center">
            <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Données d'occupation non disponibles</p>
          </div>
        )}

        {!loading && hasBars && (
          <div className="space-y-4">
            <Bar 
              label="Taux de remplissage moyen" 
              value={avgFillRate} 
              color="blue" 
              icon={ArrowTrendingUpIcon}
            />
            <Bar 
              label="Salles utilisées / total" 
              value={roomsUsedRatio} 
              color="purple" 
              icon={BuildingOffice2Icon}
            />
          </div>
        )}

        {!loading && hasDept && (
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-gray-700" />
              <p className="font-semibold text-gray-900">Détails par département</p>
            </div>
            <div className="space-y-2">
              {occupancyByDept.slice(0, 5).map((d) => (
                <div 
                  key={d.dept_id} 
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 ring-1 ring-gray-200"
                >
                  <span className="text-sm font-medium text-gray-900">{d.dept_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{d.exams_count} examens</span>
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {formatPct(d.avg_room_fill_rate) || "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
