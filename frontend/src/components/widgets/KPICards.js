"use client";

const formatPct = (v) => {
  if (v === null || v === undefined) return "-";
  return `${Math.round((v || 0) * 100)}%`;
};

const valueOrDash = (v) => (v === null || v === undefined ? "-" : v);

const cardsForRole = (role, kpis = {}) => {
  const defs = {
    exams_count: { label: "Examens", formatter: valueOrDash },
    days_covered: { label: "Jours couverts", formatter: valueOrDash },
    rooms_used: { label: "Salles utilisées", formatter: valueOrDash },
    capacity_exceeded_count: { label: "Capacité dépassée", formatter: valueOrDash },
    room_collision_count: { label: "Collisions", formatter: valueOrDash },
    avg_room_fill_rate: { label: "Taux remplissage moyen", formatter: formatPct },
    rooms_used_ratio: { label: "Taux salles utilisées", formatter: formatPct }
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
    const def = defs[key] || { label: key, formatter: valueOrDash };
    return {
      label: def.label,
      value: def.formatter(kpis[key])
    };
  });
};

export default function KPICards({ role, kpis = {}, loading }) {
  const cards = cardsForRole(role, kpis);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((kpi, index) => (
        <div key={index} className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">{kpi.label}</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-gray-900">{loading ? "..." : kpi.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

