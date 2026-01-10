"use client";

const formatDate = (date) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("fr-FR");
  } catch (e) {
    return date;
  }
};

export default function UpcomingExams({ role, exams = [], loading }) {
  const title = role === "etudiant" ? "Mes prochains examens" : "Prochains examens";
  const isEmpty = !loading && (!exams || exams.length === 0);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : isEmpty ? (
          <p className="text-sm text-gray-500">Aucun examen à venir</p>
        ) : (
          exams.map((exam, idx) => (
            <div
              key={exam.id || `${exam.module}-${idx}`}
              className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="font-medium text-gray-900">{exam.module}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(exam.date)} {exam.slot ? `• ${exam.slot}` : ""} {exam.salle ? `- ${exam.salle}` : ""}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

