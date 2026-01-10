"use client";

const safeNumber = (v) => (typeof v === "number" ? v : 0);

export default function ConflictSummary({ capacityExceeded, roomCollisions, avgFillRate, loading }) {
  const total = safeNumber(capacityExceeded) + safeNumber(roomCollisions);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé des conflits</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-red-600">{loading ? "..." : total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-orange-600">{loading ? "..." : safeNumber(capacityExceeded)}</p>
          <p className="text-sm text-gray-500">Capacité dépassée</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-yellow-600">{loading ? "..." : safeNumber(roomCollisions)}</p>
          <p className="text-sm text-gray-500">Collisions salles</p>
        </div>
      </div>
      {avgFillRate !== undefined && avgFillRate !== null && (
        <p className="mt-3 text-xs text-gray-500">
          Taux moyen de remplissage : {Math.round((avgFillRate || 0) * 100)}%
        </p>
      )}
    </div>
  );
}

