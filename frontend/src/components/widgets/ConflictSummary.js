"use client";

export default function ConflictSummary() {
  // Données mock
  const conflicts = {
    total: 12,
    critiques: 3,
    mineurs: 9
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé des conflits</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-red-600">{conflicts.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-orange-600">{conflicts.critiques}</p>
          <p className="text-sm text-gray-500">Critiques</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-yellow-600">{conflicts.mineurs}</p>
          <p className="text-sm text-gray-500">Mineurs</p>
        </div>
      </div>
    </div>
  );
}

