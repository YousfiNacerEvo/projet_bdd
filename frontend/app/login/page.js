"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../src/stores/userStore";
import {
  AcademicCapIcon,
  EnvelopeIcon,
  LockClosedIcon,
  SparklesIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useUserStore();
  const API_URL = "https://projet-bdd-8nz1.onrender.com"; 
  "http://localhost:4001"


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Afficher l'erreur avec les détails si disponibles
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || "Erreur lors de la connexion";
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Stocker le token et les données utilisateur dans le localStorage
      if (data.session?.access_token) {
        localStorage.setItem("auth_token", data.session.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Préparer les données pour le store
        if (data.userMeta) {
          const enrichedMeta = {
            ...data.userMeta,
            email: data.user.email
          };
          localStorage.setItem("userMeta", JSON.stringify(enrichedMeta));
          // Initialiser le store avec les données
          setUser({
            id: data.user.id,
            role: data.userMeta.role,
            dept_id: data.userMeta.dept_id,
            formation_id: data.userMeta.formation_id,
            email: data.user.email,
            nom: data.userMeta.nom,
            prenom: data.userMeta.prenom
          });
        } else {
          // Si pas de userMeta, essayer de récupérer depuis l'API
          // Mais pour l'instant, on redirige quand même
        }
      }

      // Rediriger vers le dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur de connexion au serveur");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Section gauche - Gradient avec illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Motif de fond décoratif */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 backdrop-blur-sm p-3 ring-1 ring-white/30">
              <AcademicCapIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ExamPlan</h1>
              <p className="text-indigo-200 text-sm">Gestion d'examens</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-white/20 backdrop-blur-sm p-2 ring-1 ring-white/30">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Planification intelligente
              </h3>
              <p className="text-indigo-200 text-sm">
                Génération automatique de planning d'examens avec optimisation des contraintes
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-white/20 backdrop-blur-sm p-2 ring-1 ring-white/30">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Pour tous les acteurs
              </h3>
              <p className="text-indigo-200 text-sm">
                Étudiants, professeurs, chefs de département et administrateurs
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-indigo-200 text-sm">
            © 2026 ExamPlan. Plateforme d'optimisation des emplois du temps.
          </p>
        </div>
      </div>

      {/* Section droite - Formulaire de connexion */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-indigo-600 p-2">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ExamPlan</h1>
            </div>
            <p className="text-sm text-gray-600">Gestion d'examens</p>
          </div>

          {/* Card de connexion */}
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Bienvenue !
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Connectez-vous pour accéder à votre espace
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-900">Erreur de connexion</p>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            En vous connectant, vous acceptez nos conditions d'utilisation
          </p>
        </div>
      </div>
    </div>
  );
}

