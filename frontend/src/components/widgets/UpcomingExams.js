"use client";

export default function UpcomingExams({ role }) {
  // Données mock - à remplacer par un appel API
  const exams = [
    { id: 1, module: "Mathématiques", date: "2024-01-15", heure: "09:00", salle: "A101" },
    { id: 2, module: "Physique", date: "2024-01-17", heure: "14:00", salle: "B205" },
  ];

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {role === "etudiant" ? "Mes prochains examens" : "Prochains examens"}
      </h3>
      <div className="space-y-3">
        {exams.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun examen à venir</p>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <p className="font-medium text-gray-900">{exam.module}</p>
                <p className="text-sm text-gray-500">
                  {new Date(exam.date).toLocaleDateString("fr-FR")} à {exam.heure} - {exam.salle}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

