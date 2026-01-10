"use client";

export default function SurveillanceLoad({ surveillancesCount, todo, loading }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Charge de surveillance</h3>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement...</p>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Surveillances prévues</p>
            <p className="text-2xl font-bold text-blue-600">{surveillancesCount ?? 0}</p>
          </div>
          <p className="text-xs text-gray-500">
            {todo || "Les détails de surveillance seront affichés dès qu'ils seront disponibles."}
          </p>
        </div>
      )}
    </div>
  );
}

