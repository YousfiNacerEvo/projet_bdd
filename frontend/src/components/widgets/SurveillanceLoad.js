"use client";

export default function SurveillanceLoad() {
  // Données mock
  const surveillance = {
    aujourdhui: 2,
    cetteSemaine: 8,
    ceMois: 32,
    total: 145
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Charge de surveillance</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Aujourd'hui</p>
          <p className="text-2xl font-bold text-blue-600">{surveillance.aujourdhui}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Cette semaine</p>
          <p className="text-2xl font-bold text-green-600">{surveillance.cetteSemaine}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Ce mois</p>
          <p className="text-2xl font-bold text-orange-600">{surveillance.ceMois}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{surveillance.total}</p>
        </div>
      </div>
    </div>
  );
}

