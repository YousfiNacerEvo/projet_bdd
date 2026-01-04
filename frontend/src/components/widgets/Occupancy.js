"use client";

export default function Occupancy() {
  // Données mock
  const occupancy = {
    salles: 85,
    amphi: 92,
    total: 88
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupation des salles</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Salles</span>
            <span className="text-sm font-medium">{occupancy.salles}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${occupancy.salles}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Amphithéâtres</span>
            <span className="text-sm font-medium">{occupancy.amphi}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${occupancy.amphi}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-sm font-medium">{occupancy.total}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full" 
              style={{ width: `${occupancy.total}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

