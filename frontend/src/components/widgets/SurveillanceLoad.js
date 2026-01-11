"use client";
import {
  EyeIcon,
  InformationCircleIcon,
  CalendarDaysIcon
} from "@heroicons/react/24/outline";

export default function SurveillanceLoad({ surveillancesCount, todo, loading }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-3 ring-1 ring-purple-200">
            <EyeIcon className="h-6 w-6 text-purple-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Charge de surveillance</h3>
            <p className="text-sm text-gray-500">Vos surveillances planifiées</p>
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
          <div className="space-y-6">
            <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-6 ring-1 ring-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-purple-600">Surveillances prévues</p>
                  <p className="mt-2 text-4xl font-bold text-purple-900">{surveillancesCount ?? 0}</p>
                </div>
                <CalendarDaysIcon className="h-12 w-12 text-purple-400" />
              </div>
            </div>

            {todo && (
              <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200">
                <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <p className="text-sm text-blue-900">
                  {todo}
                </p>
              </div>
            )}

            {!todo && (
              <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
                <p className="text-sm text-gray-600">
                  Les détails de vos surveillances seront affichés dès qu'ils seront disponibles.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
