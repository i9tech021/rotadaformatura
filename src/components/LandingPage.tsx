import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Brain,
  Calendar,
  Calculator,
  Headphones,
  Trophy,
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Target,
  GraduationCap,
  Globe,
  BarChart3,
  Zap,
} from "lucide-react";

const STATS = [
  { number: "3.000+", label: "Alunos de Administração", icon: Users },
  { number: "43", label: "Polos no Estado do RJ", icon: Globe },
  { number: "7", label: "Disciplinas com Conteúdo", icon: BookOpen },
  { number: "100%", label: "Gratuito e Open Source", icon: CheckCircle2 },
];

const FEATURES = [
  {
    icon: Brain,
    title: "Tutor com IA",
    description: "Pergunte sobre qualquer matéria e receba explicações personalizadas com base no conteúdo da turma.",
  },
  {
    icon: Target,
    title: "Simulados Inteligentes",
    description: "Questões geradas por IA com base nas avaliações reais, provas anteriores e materiais da turma.",
  },
  {
    icon: Headphones,
    title: "Podcasts e Resumos",
    description: "Áudios e resumos criados por alunos e professores para estudar em qualquer lugar.",
  },
  {
    icon: Calculator,
    title: "Calculadora de Média",
    description: "Calcule sua média em tempo real e saiba exatamente o que precisa para passar.",
  },
  {
    icon: Trophy,
    title: "Ranking da Turma",
    description: "Compare seu desempenho com outros polos e veja sua posição no ranking geral.",
  },
  {
    icon: Calendar,
    title: "Cronograma Integrado",
    description: "Todas as datas importantes em um só lugar: provas, trancamentos, matrículas e ENADE.",
  },
];

const COURSES = [
  "Administração",
  "Ciências Contábeis",
  "Engenharia de Produção",
  "Engenharia Ambiental",
  "Serviço Social",
  "Relações Internacionais",
  "Economia",
  "Pedagogia",
  "Licenciatura em Matemática",
  "Licenciatura em Física",
  "Licenciatura em Química",
  "Licenciatura em Letras",
  "Biblioteconomia",
  "Arquitetura e Urbanismo",
  "Direito",
  "Medicina Veterinária",
  "Zootecnia",
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">Rota da Formatura</span>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Entrar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            CEDERJ 2026-2 · Administração
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Organize seus estudos.
            <br />
            <span className="text-primary">Passe de ano.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Dashboard acadêmico completo para alunos do CEDERJ. Cronograma, simulados com IA,
            podcasts, calculadora de média e muito mais — tudo gratuito.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Começar agora
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
            >
              Saiba mais
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-muted/30 px-4 py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-bold text-foreground">{stat.number}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">Tudo que você precisa</h2>
            <p className="mt-3 text-muted-foreground">
              Ferramentas criadas por alunos, para alunos, com tecnologia de ponta.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/30 hover:shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">Como funciona</h2>
            <p className="mt-3 text-muted-foreground">
              Simples, rápido e sem burocracia. Em 30 segundos você está dentro.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Digite seu nome",
                desc: "Sem cadastro, sem senha. Só seu nome e polo.",
              },
              {
                step: "2",
                title: "Escolha a disciplina",
                desc: "Acesse cronograma, materiais, podcasts e simulados.",
              },
              {
                step: "3",
                title: "Estude com IA",
                desc: "Tutor inteligente responde suas dúvidas 24h por dia.",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-foreground">17 cursos do CEDERJ</h2>
          <p className="mt-3 text-muted-foreground">
            O projeto atende todos os cursos do consórcio, com foco inicial em Administração.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {COURSES.map((c) => (
              <span
                key={c}
                className="rounded-full border border-border/50 bg-muted/50 px-3 py-1 text-sm text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-y border-border/50 bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-foreground">Tecnologia</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Construído com stack moderna e escalável
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {["React 19", "TanStack Start", "TypeScript", "Tailwind CSS", "Supabase", "OpenRouter AI", "Vercel"].map(
              (t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm font-medium text-foreground"
                >
                  <Zap className="h-3.5 w-3.5 text-secondary" />
                  {t}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground">Pronto pra começar?</h2>
          <p className="mt-3 text-muted-foreground">
            É grátis, não precisa de cadastro e leva 30 segundos.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Entrar agora
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>Rota da Formatura · CEDERJ 2026-2</span>
          </div>
          <span>Projeto acadêmico sem fins lucrativos</span>
        </div>
      </footer>
    </div>
  );
}
