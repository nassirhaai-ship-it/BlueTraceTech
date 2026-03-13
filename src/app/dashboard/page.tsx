"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import ObservateurDashboard from "@/components/dashboard/ObservateurDashboard";
import OperateurDashboard from "@/components/dashboard/OperateurDashboard";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium font-mono uppercase tracking-widest text-xs">Chargement du dashboard</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Afficher le dashboard approprié selon le rôle
  switch (session.user?.role) {
    case "observateur":
      return <ObservateurDashboard />;
    case "operateur":
      return <OperateurDashboard />;
    case "admin":
    default:
      return <AdminDashboard />;
  }
}