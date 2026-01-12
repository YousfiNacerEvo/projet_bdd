"use client";
import {
  CalendarDaysIcon,
  ClockIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  EyeIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

const formatDate = (date) => {
  if (!date) return "-";
  try {
    return new Date(date + 'T00:00:00').toLocaleDateString("fr-FR", {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return date;
  }
};

const slotLabel = (c = {}) =>
  c.heure_debut ? `${c.heure_debut.slice(0, 5)}–${(c.heure_fin || "").slice(0, 5)}` : "-";

const surveillantsLabel = (list = []) =>
  list
    .map((s) => (s.prenom || s.nom ? `${s.prenom || ""} ${s.nom || ""}`.trim() : s.id_prof || ""))
    .filter(Boolean)
    .join(", ") || "-";

export default function ExamCalendar({ items = [], type = "exams" }) {
  const title = type === "surveillances" ? "Mes surveillances" : "Examens";
  const Icon = type === "surveillances" ? EyeIcon : AcademicCapIcon;
  const bgColor = type === "surveillances" ? "bg-purple-100" : "bg-blue-100";
  const ringColor = type === "surveillances" ? "ring-purple-200" : "ring-blue-200";
  const iconColor = type === "surveillances" ? "text-purple-700" : "text-blue-700";

  // Grouper les items par date
  const groupedByDate = items.reduce((acc, item) => {
    const date = item.creneau?.date || "Sans date";
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  // Trier les dates
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    if (a === "Sans date") return 1;
    if (b === "Sans date") return -1;
    return new Date(a) - new Date(b);
  });

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
        <Icon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-900">Aucun événement</p>
        <p className="mt-1 text-sm text-gray-500">
          {type === "surveillances" 
            ? "Vous n'avez pas de surveillance planifiée" 
            : "Aucun examen planifié"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg ${bgColor} p-3 ring-1 ${ringColor}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">
              {items.length} {type === "surveillances" ? "surveillance" : "examen"}{items.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date} className="space-y-3">
              {/* En-tête de date */}
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-900">
                  {date === "Sans date" ? date : formatDate(date)}
                </h4>
                <span className="ml-auto rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {groupedByDate[date].length}
                </span>
              </div>

              {/* Événements pour cette date */}
              <div className="space-y-3">
                {groupedByDate[date].map((item) => {
                  const c = item.creneau || {};
                  const salle = item.salle || {};
                  const formation = item.module?.formation?.nom || "-";
                  
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">
                              {item.module?.nom || `Module ${item.module_id}`}
                            </p>
                            {item.expected_students && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                <UserGroupIcon className="h-3 w-3" />
                                {item.expected_students}
                              </span>
                            )}
                          </div>
                          
                          <p className="mt-1 text-sm text-gray-600">{formation}</p>
                          
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                            {/* Horaire */}
                            <div className="flex items-center gap-1.5">
                              <ClockIcon className="h-4 w-4 text-gray-400" />
                              <span>{slotLabel(c)}</span>
                            </div>
                            
                            {/* Salle */}
                            {salle.nom && (
                              <>
                                <span className="text-gray-400">•</span>
                                <div className="flex items-center gap-1.5">
                                  <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
                                  <span>
                                    {salle.nom}
                                    {salle.capacite_examen && ` (${salle.capacite_examen} places)`}
                                  </span>
                                </div>
                              </>
                            )}
                            
                            {/* Surveillants */}
                            {type === "surveillances" && item.surveillants && item.surveillants.length > 0 && (
                              <>
                                <span className="text-gray-400">•</span>
                                <div className="flex items-center gap-1.5">
                                  <EyeIcon className="h-4 w-4 text-gray-400" />
                                  <span>{surveillantsLabel(item.surveillants)}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
