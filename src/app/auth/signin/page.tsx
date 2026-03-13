"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";

export default function SignIn() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Rediriger vers le dashboard si déjà connecté
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Identifiants invalides");
      }
    } catch (error) {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  // Afficher un loader si en cours de vérification de session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium font-mono uppercase tracking-widest text-xs text-center">Vérification de session</p>
        </div>
      </div>
    );
  }

  // Si déjà connecté, ne rien afficher (redirection en cours)
  if (status === "authenticated") {
    return null;
  }

  if (loading) return <Loader label="Connexion en cours..." />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo et titre */}
        <div className="text-center mb-6 sm:mb-8 transition-transform duration-500 hover:scale-105">
          <h1 className="text-4xl sm:text-5xl font-black mb-2 tracking-tight uppercase">
            <span className="text-blue-600">Blue</span><span className="text-foreground">Trace Tech</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium uppercase tracking-[0.2em]">High-Tech Traceability System</p>
        </div>

        <div className="p-1 rounded-[2.5rem] bg-gradient-to-b from-primary/20 to-transparent">
          <Card className="p-6 sm:p-8 md:p-10 bg-card backdrop-blur-xl shadow-2xl border border-border rounded-[2.4rem]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-muted-foreground mb-2">
                  Adresse email
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground/50 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-muted/5 transition-all duration-300 outline-none"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-muted-foreground mb-2">
                  Mot de passe
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground/50 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-muted/5 transition-all duration-300 outline-none"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-in fade-in zoom-in duration-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-900/20 hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Connexion...
                  </div>
                ) : (
                  "IDENTIFICATION"
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-xs font-bold text-muted-foreground text-center mb-6 uppercase tracking-widest">
                Terminaux de démonstration
              </p>
              <div className="space-y-3">
                {[
                  { email: "admin@trace.com", password: "admin", role: "Administrateur", color: "from-red-500/20 to-red-600/5 border-red-500/20 text-red-400" },
                  { email: "operateur@trace.com", password: "operateur", role: "Opérateur", color: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400" },
                  { email: "observateur@trace.com", password: "observateur", role: "Observateur", color: "from-green-500/20 to-green-600/5 border-green-500/20 text-green-400" },

                ].map((demo, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`w-full flex flex-row justify-between items-center px-4 py-3 bg-gradient-to-r ${demo.color} border rounded-xl text-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] outline-none group`}
                    onClick={() => handleFillDemo(demo.email, demo.password)}
                    disabled={isLoading}
                  >
                    <span className="font-black uppercase tracking-wider">{demo.role}</span>
                    <span className="opacity-60 group-hover:opacity-100 transition-opacity">{demo.email}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <a
                href="/"
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em]"
              >
                ← Retour au site principal
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}