"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Activity,
  BarChart3,
  Brain,
  Smartphone,
  Shield,
  ArrowRight,
  Play,
  Users,
  TrendingUp,
  Zap,
  CheckCircle2,
  Globe,
  Lock,
  Cpu
} from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-t-2 border-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-white transition-colors duration-500">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-900/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] dark:opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-3 bg-background/80 backdrop-blur-xl border-b border-border shadow-2xl' : 'py-6 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-1 group cursor-pointer transition-transform duration-300 hover:scale-105">
            <span className="text-xl sm:text-2xl font-black tracking-tight uppercase">
              <span className="text-blue-500">Blue</span><span className="text-foreground">Trace Tech</span>
            </span>
          </div>



          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/auth/signin')} className="px-6 py-2.5 rounded-full bg-foreground text-background font-bold hover:bg-primary hover:text-white hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all duration-300">
              DÉPLOYER
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold tracking-[0.2em] uppercase mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              Quantum Aquaculture Monitoring
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-foreground leading-[0.9] mb-8 tracking-tighter">
              L'AVENIR EST <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">LIQUIDE.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed mb-10">
              Système de traçabilité biométrique et d'intelligence environnementale pour les fermes aquacoles de nouvelle génération.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/auth/signin')}
                className="group relative px-8 py-5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-lg overflow-hidden flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-cyan-500/20"
              >
                ACCÈS TERMINAL
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-5 rounded-2xl bg-accent/5 border border-border text-foreground font-bold hover:bg-accent/10 transition-all flex items-center justify-center gap-3 backdrop-blur-md">
                <Play className="w-5 h-5 text-primary" />
                VUE D'ENSEMBLE
              </button>
            </div>
          </motion.div>

          {/* Abstract Tech Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full aspect-square max-w-[500px] mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
              <div className="absolute inset-0 border-[1px] border-border/50 rounded-full animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute inset-10 border-[1px] border-primary/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64 bg-background rounded-3xl border border-border shadow-2xl overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                  <Image src="/logo.png" alt="BlueTrace Tech" width={160} height={160} className="object-contain drop-shadow-[0_0_50px_rgba(6,182,212,0.4)]" />

                  {/* Digital Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 h-1 bg-accent/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-[progress_3s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              </div>

              {/* Data Floating Elements */}
              {[Activity, Zap, Shield, Brain].map((Icon, i) => (
                <div
                  key={i}
                  className="absolute w-14 h-14 bg-background/80 backdrop-blur-xl border border-border rounded-2xl flex items-center justify-center text-primary shadow-2xl"
                  style={{
                    top: i === 0 ? '10%' : i === 1 ? '80%' : i === 2 ? '40%' : '60%',
                    left: i === 0 ? '70%' : i === 1 ? '10%' : i === 2 ? '-10%' : '85%',
                    animation: `float 6s ease-in-out ${i}s infinite`
                  }}
                >
                  <Icon size={24} />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="py-20 border-y border-border bg-accent/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'INFRASTRUCTURES', val: '500+' },
            { label: 'STABILITÉ RÉSEAU', val: '99.9%' },
            { label: 'NODES IOT', val: '12.4k' },
            { label: 'ANALYSE TEMPS RÉEL', val: '24/7' }
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-sm font-bold text-primary tracking-[0.3em] mb-2 uppercase">{stat.label}</div>
              <div className="text-4xl font-black text-foreground">{stat.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Technology Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl font-black text-foreground mb-4 tracking-tight uppercase">Écosystème <span className="text-primary">Technologique</span></h2>
            <p className="text-muted-foreground max-w-xl">Supervision modulaire intégrée pour une précision sans compromis.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Télémétrie Fluide', desc: 'Protocoles basse latence pour un flux constant de données vitales.', icon: Activity },
              { title: 'IA Distribuée', desc: 'Prise de décision autonome basée sur des modèles neuronaux hybrides.', icon: Brain },
              { title: 'Sécurité Quantique', desc: 'Chiffrement AES-256 et isolation des données par environnement.', icon: Lock },
              { title: 'Visualisation 4D', desc: 'Graphiques haute définition pour une lecture instantanée des tendances.', icon: BarChart3 },
              { title: 'Edge Computing', desc: 'Traitement local des alertes pour une réactivité maximale.', icon: Cpu },
              { title: 'Connectivité Globale', desc: 'Accès satellitaire et 5G pour vos sites les plus isolés.', icon: Globe }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-card border border-border hover:bg-accent/5 hover:border-primary/30 transition-all duration-500">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4 uppercase tracking-wider">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section with high contrast */}
      <section className="py-40 relative">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="relative p-16 rounded-[40px] bg-gradient-to-br from-primary/20 to-blue-600/20 border border-border overflow-hidden shadow-3xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-dark.png')] opacity-20 dark:opacity-40"></div>
            <h2 className="text-4xl md:text-6xl font-black text-foreground mb-8 relative z-10 leading-none">VOTRE FERME,<br />VERSION <span className="text-primary">AUGMENTÉE.</span></h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto relative z-10">Rejoignez l'élite de l'aquaculture mondiale avec la solution BlueTrace Tech.</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="relative z-10 px-12 py-5 rounded-full bg-primary text-white font-black text-xl hover:bg-foreground hover:text-background transition-all shadow-[0_0_50px_rgba(6,182,212,0.4)]"
            >
              DÉMARRER MAINTENANT
            </button>
          </div>
        </div>
      </section>

      {/* Footer Minimalist & Premium */}
      <footer className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 opacity-50 relative">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="text-lg font-black text-foreground/50 uppercase">BlueTrace Tech</span>
          </div>

          <p className="text-muted-foreground/50 font-bold uppercase tracking-[0.2em] text-xs">
            © 2026 BLUETRACE TECH — TOUS DROITS RÉSERVÉS
          </p>

          <div className="flex gap-6">
            {['Privacy', 'Legal', 'Status'].map(item => (
              <a key={item} href="#" className="text-xs font-bold text-muted-foreground/70 hover:text-foreground uppercase transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* Global CSS for Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
