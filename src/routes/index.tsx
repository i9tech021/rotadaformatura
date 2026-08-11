import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  MessageCircle,
  MoreVertical,
  Target,
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/")({
  component: Index,
});

const DISCIPLINES = [
  {
    id: 1,
    name: "Métodos Determinísticos I",
    ch: "45h",
    progress: 45,
    nextExam: "AP1 em 5 dias",
    status: "urgent",
  },
  {
    id: 2,
    name: "História do Pensamento Adm. II",
    ch: "60h",
    progress: 25,
    nextExam: "AP1 em 6 dias",
    status: "urgent",
  },
  {
    id: 3,
    name: "Contabilidade Geral I",
    ch: "45h",
    progress: 10,
    nextExam: "AP1 em 13 dias",
    status: "warning",
  },
];

function Index() {
  const [userName] = useState("Vinícius");
  const greeting = "Bom dia";

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8 font-sans text-[#0A3D52]">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {userName}!</h1>
          <p className="text-[#0A3D52]/70">Administração | 5º Período | UFRRJ/CEDERJ</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-[#0A3D52] text-white flex items-center justify-center font-bold">
          VL
        </div>
      </header>

      {/* Hero Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#0A3D52]/10">
          <p className="text-sm text-[#0A3D52]/70 font-medium">Disciplinas</p>
          <p className="text-3xl font-bold">7</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#0A3D52]/10">
          <p className="text-sm text-[#0A3D52]/70 font-medium">Horas Totais</p>
          <p className="text-3xl font-bold">330h</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#0A3D52]/10">
          <p className="text-sm text-[#0A3D52]/70 font-medium">Próxima Prova</p>
          <p className="text-xl font-bold text-[#D4941E]">AP1 Métodos (5 dias)</p>
        </div>
      </section>

      {/* Próxima Missão */}
      <section className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#D4941E] mb-8">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Target className="text-[#D4941E]" /> Próxima Missão
        </h2>
        <p className="mt-2 text-xl font-semibold">AD1 de Contabilidade Geral I em 5 dias</p>
        <div className="mt-4 flex gap-4">
          <button className="bg-[#0A3D52] text-white px-6 py-2 rounded-lg text-sm font-bold">Entrar na Rota</button>
        </div>
      </section>

      {/* Lista de Disciplinas */}
      <section>
        <h2 className="text-lg font-bold mb-4">Disciplinas do Semestre</h2>
        <div className="space-y-4">
          {DISCIPLINES.map((d) => (
            <div key={d.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#0A3D52]/10 flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-[#0A3D52]">{d.name}</h3>
                <p className="text-sm text-[#0A3D52]/70">{d.ch} | {d.nextExam}</p>
                <div className="mt-2 h-2 w-full bg-[#F5F7FA] rounded-full overflow-hidden">
                  <div className={`h-full ${d.status === 'urgent' ? 'bg-[#E74C3C]' : 'bg-[#D4941E]'} rounded-full`} style={{ width: `${d.progress}%` }} />
                </div>
              </div>
              <button className="ml-4 p-2 hover:bg-[#F5F7FA] rounded-lg">
                <MoreVertical className="text-[#0A3D52]/50" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Chat */}
      <button className="fixed bottom-6 right-6 bg-[#D4941E] text-white p-4 rounded-full shadow-lg hover:bg-[#D4941E]/90 transition-all">
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
