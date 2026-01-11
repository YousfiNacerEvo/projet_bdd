"use client";
import {
  ChartBarIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";

const formatPct = (v) => {
  if (v === null || v === undefined) return "-";
  return `${Math.round((v || 0) * 100)}%`;
};

const valueOrDash = (v) => (v === null || v === undefined ? "-" : v);

const cardsForRole = (role, kpis = {}) => {
  const defs = {
    exams_count: { 
      label: "Examens générés", 
      formatter: valueOrDash, 
      icon: ChartBarIcon, 
      color: "blue" 
    },
    days_covered: { 
      label: "Jours couverts", 
      formatter: valueOrDash, 
      icon: CalendarDaysIcon, 
      color: "purple" 
    },
    rooms_used: { 
      label: "Salles utilisées", 
      formatter: valueOrDash, 
      icon: BuildingOffice2Icon, 
      color: "green" 
    },
    capacity_exceeded_count: { 
      label: "Capacité dépassée", 
      formatter: valueOrDash, 
      icon: ExclamationTriangleIcon, 
      color: "red" 
    },
    room_collision_count: { 
      label: "Collisions", 
      formatter: valueOrDash, 
      icon: XCircleIcon, 
      color: "orange" 
    },
    avg_room_fill_rate: { 
      label: "Taux de remplissage", 
      formatter: formatPct, 
      icon: ArrowTrendingUpIcon, 
      color: "indigo" 
    },
    rooms_used_ratio: { 
      label: "Taux salles utilisées", 
      formatter: formatPct, 
      icon: ArrowTrendingUpIcon, 
      color: "teal" 
    }
  };

  const roleKeys = (() => {
    if (role === "admin_examens") {
      return ["exams_count", "days_covered", "rooms_used", "capacity_exceeded_count", "room_collision_count", "avg_room_fill_rate"];
    }
    if (role === "doyen") {
      return ["exams_count", "avg_room_fill_rate", "capacity_exceeded_count", "rooms_used_ratio"];
    }
    if (role === "chef_dept") {
      return ["exams_count", "days_covered", "rooms_used", "avg_room_fill_rate"];
    }
    return ["exams_count", "avg_room_fill_rate", "capacity_exceeded_count"];
  })();

  return roleKeys.map((key) => {
    const def = defs[key] || { label: key, formatter: valueOrDash, icon: ChartBarIcon, color: "gray" };
    return {
      label: def.label,
      value: def.formatter(kpis[key]),
      icon: def.icon,
      color: def.color
    };
  });
};

export default function KPICards({ role, kpis = {}, loading }) {
  const cards = cardsForRole(role, kpis);

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 text-blue-700 ring-blue-200",
      purple: "bg-purple-50 text-purple-700 ring-purple-200",
      green: "bg-green-50 text-green-700 ring-green-200",
      red: "bg-red-50 text-red-700 ring-red-200",
      orange: "bg-orange-50 text-orange-700 ring-orange-200",
      indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
      teal: "bg-teal-50 text-teal-700 ring-teal-200",
      gray: "bg-gray-50 text-gray-700 ring-gray-200"
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((kpi, index) => {
        const Icon = kpi.icon;
        const colorClasses = getColorClasses(kpi.color);
        
        return (
          <div key={index} className="rounded-lg bg-white p-6 ring-1 ring-gray-200 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-3 ring-1 ${colorClasses}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{kpi.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-300 border-r-transparent"></span>
                ) : (
                  kpi.value
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
