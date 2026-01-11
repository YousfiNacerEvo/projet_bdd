"use client";
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";

const safeNumber = (v) => (typeof v === "number" ? v : 0);

export default function ConflictSummary({ capacityExceeded, roomCollisions, avgFillRate, loading }) {
  const total = safeNumber(capacityExceeded) + safeNumber(roomCollisions);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-3 ring-1 ${
            total === 0 ? 'bg-green-100 ring-green-200' : 'bg-red-100 ring-red-200'
          }`}>
            {total === 0 ? (
              <CheckCircleIcon className="h-6 w-6 text-green-700" />
            ) : (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-700" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Résumé des conflits</h3>
            <p className="text-sm text-gray-500">
              {total === 0 ? "Aucun conflit détecté" : `${total} conflit${total > 1 ? 's' : ''} détecté${total > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Chargement...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100 p-6 ring-1 ring-red-200">
                <div className="flex items-center justify-between">
                  <XCircleIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-red-600">Total</p>
                  <p className="mt-2 text-4xl font-bold text-red-900">{total}</p>
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 p-6 ring-1 ring-orange-200">
                <div className="flex items-center justify-between">
                  <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-orange-600">Capacité dépassée</p>
                  <p className="mt-2 text-4xl font-bold text-orange-900">{safeNumber(capacityExceeded)}</p>
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 ring-1 ring-yellow-200">
                <div className="flex items-center justify-between">
                  <XCircleIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-yellow-600">Collisions</p>
                  <p className="mt-2 text-4xl font-bold text-yellow-900">{safeNumber(roomCollisions)}</p>
                </div>
              </div>
            </div>

            {avgFillRate !== undefined && avgFillRate !== null && (
              <div className="mt-6 rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200">
                <div className="flex items-center gap-3">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Taux moyen de remplissage</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-3 w-full overflow-hidden rounded-full bg-blue-200">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${Math.round((avgFillRate || 0) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-blue-900">
                        {Math.round((avgFillRate || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {total === 0 && (
              <div className="mt-6 rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-6 text-center">
                <CheckCircleIcon className="mx-auto h-10 w-10 text-green-600" />
                <p className="mt-2 text-sm font-medium text-green-900">Planning validé !</p>
                <p className="mt-1 text-sm text-green-700">Aucun conflit détecté, le planning est prêt</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
