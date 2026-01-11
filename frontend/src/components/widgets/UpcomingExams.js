"use client";
import {
  CalendarDaysIcon,
  ClockIcon,
  BuildingOffice2Icon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";

const formatDate = (date) => {
  if (!date) return "-";
  try {
    return new Date(date + 'T00:00:00').toLocaleDateString("fr-FR", {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return date;
  }
};

export default function UpcomingExams({ role, exams = [], loading }) {
  const title = role === "etudiant" ? "Mes prochains examens" : "Prochains examens";
  const isEmpty = !loading && (!exams || exams.length === 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3 ring-1 ring-blue-200">
            <AcademicCapIcon className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">
              {loading ? "Chargement..." : `${exams.length} examen${exams.length > 1 ? 's' : ''} à venir`}
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
        ) : isEmpty ? (
          <div className="py-8 text-center">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">Aucun examen à venir</p>
            <p className="mt-1 text-sm text-gray-500">Vous n'avez pas d'examen planifié pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam, idx) => (
              <div
                key={exam.id || `${exam.module}-${idx}`}
                className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{exam.module}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                      {exam.date && (
                        <div className="flex items-center gap-1.5">
                          <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(exam.date)}</span>
                        </div>
                      )}
                      {exam.slot && (
                        <>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-1.5">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <span>{exam.slot}</span>
                          </div>
                        </>
                      )}
                      {exam.salle && (
                        <>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-1.5">
                            <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
                            <span>{exam.salle}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
