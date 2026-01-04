"use client";

export default function KPICards({ role }) {
  // Données mock selon le rôle
  const kpis = role === "doyen" 
    ? [
        { label: "Taux conflits global", value: "2.3%", trend: "↓" },
        { label: "Occupation moyenne", value: "88%", trend: "↑" },
        { label: "Examens planifiés", value: "1247", trend: "→" },
        { label: "Heures surveillance", value: "3420h", trend: "↑" }
      ]
    : [
        { label: "Taux conflits dept", value: "1.8%", trend: "↓" },
        { label: "Examens dept", value: "187", trend: "→" },
        { label: "Surveillances profs", value: "245h", trend: "↑" }
      ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <div key={index} className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">{kpi.label}</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <span className="text-lg text-gray-400">{kpi.trend}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

