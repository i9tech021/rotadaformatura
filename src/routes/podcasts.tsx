// src/routes/podcasts.tsx
// Biblioteca de podcasts de áudio — upload + player + filtro por disciplina.
// Compartilhável: qualquer pessoa acessa via link (sem login).
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Calendar as CalendarIcon,
  FileText,
  GraduationCap,
  Headphones,
  Layout,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Settings,
  Upload,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { disciplinas } from "@/data/disciplines";
import {
  deletePodcast,
  listPodcasts,
  subscribePodcasts,
  uploadPodcast,
  type Podcast,
} from "@/lib/podcastService";
import { PodcastCard } from "@/components/PodcastCard";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/podcasts")({
  component: PodcastsPage,
  head: () => ({
    meta: [{ title: "Podcasts | Rota da Formatura" }],
  }),
});

function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroDisciplina, setFiltroDisciplina] = useState<string | null>(null);
  const [subindo, setSubindo] = useState(false);

  // Form de metadados do upload
  const [arquivoPendente, setArquivoPendente] = useState<File | null>(null);
  const [tituloForm, setTituloForm] = useState("");
  const [descricaoForm, setDescricaoForm] = useState("");
  const [disciplinaForm, setDisciplinaForm] = useState(disciplinas[0]?.id ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recarregar = useCallback(async () => {
    const lista = await listPodcasts();
    setPodcasts(lista);
    setCarregando(false);
  }, []);

  useEffect(() => {
    recarregar();
    return subscribePodcasts(recarregar);
  }, [recarregar]);

  const disciplinasComPodcast = useMemo(
    () => disciplinas.filter((d) => podcasts.some((p) => p.disciplina_id === d.id)),
    [podcasts],
  );

  const podcastsFiltrados = useMemo(
    () =>
      filtroDisciplina ? podcasts.filter((p) => p.disciplina_id === filtroDisciplina) : podcasts,
    [podcasts, filtroDisciplina],
  );

  const disciplinaInfo = (id: string) => disciplinas.find((d) => d.id === id);

  const selecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo de 50MB.");
      return;
    }
    if (!file.type.startsWith("audio/")) {
      toast.error("Selecione um arquivo de áudio (MP3, M4A ou WAV).");
      return;
    }
    setArquivoPendente(file);
    // pré-preenche título com nome do arquivo
    setTituloForm(file.name.replace(/\.[^.]+$/, ""));
    if (!descricaoForm) setDescricaoForm("");
  };

  const confirmarUpload = async () => {
    if (!arquivoPendente) return;
    if (!tituloForm.trim()) {
      toast.error("Dê um título ao podcast.");
      return;
    }
    if (!disciplinaForm) {
      toast.error("Selecione a disciplina.");
      return;
    }
    setSubindo(true);
    const r = await uploadPodcast(arquivoPendente, {
      disciplinaId: disciplinaForm,
      titulo: tituloForm.trim(),
      descricao: descricaoForm.trim(),
    });
    setSubindo(false);
    if (!r.ok) {
      toast.error(r.error || "Erro ao subir o podcast.");
      return;
    }
    if (!isSupabaseConfigured) {
      toast.info(
        "Salvo localmente (sem banco configurado). Configure o Supabase para compartilhar.",
      );
    } else {
      toast.success("Podcast publicado! Já está disponível para quem acessar o painel.");
    }
    setArquivoPendente(null);
    setTituloForm("");
    setDescricaoForm("");
    setSubindo(false);
    recarregar();
  };

  const handleRemover = async (podcast: Podcast) => {
    const r = await deletePodcast(podcast);
    if (!r.ok) {
      toast.error(r.error || "Erro ao remover.");
      return;
    }
    toast.success("Podcast removido.");
    recarregar();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-24">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 w-full bg-[#0A3D52] text-white px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-white/10 rounded-xl transition-colors md:hidden cursor-pointer">
                <Menu className="w-6 h-6 text-[#D4941E]" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#0A3D52] text-white border-[#D4941E]/20 p-0">
              <div className="p-6 pt-12 flex flex-col gap-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-8 h-8 text-[#D4941E]" />
                  <span className="font-bold text-lg tracking-tight uppercase">Menu Acadêmico</span>
                </div>
                <div className="flex flex-col gap-2">
                  <MobileNavLink to="/" icon={LayoutDashboard} label="Dashboard" />
                  <MobileNavLink to="/calendar" icon={CalendarIcon} label="Calendário" />
                  <MobileNavLink to="/podcasts" icon={Headphones} label="Podcasts" />
                  <MobileNavLink to="/disciplines" icon={BookOpen} label="Disciplinas" />
                  <MobileNavLink to="/materials" icon={FileText} label="Materiais" />
                  <MobileNavLink to="/community" icon={MessageCircle} label="Comunidade" />
                  <MobileNavLink to="/settings" icon={Settings} label="Configurações" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Headphones className="w-6 h-6 text-[#D4941E]" />
            <span className="font-bold text-lg tracking-tight uppercase hidden xs:inline">
              Podcasts
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 mr-6">
          <NavLinkDesktop to="/" label="Dashboard" />
          <NavLinkDesktop to="/calendar" label="Calendário" />
          <NavLinkDesktop to="/disciplines" label="Biblioteca" />
          <NavLinkDesktop to="/materials" label="Arquivos" />
        </div>

        <Link
          to="/settings"
          className="w-9 h-9 rounded-full bg-[#D4941E] flex items-center justify-center font-bold text-[#0A3D52] text-sm hover:scale-105 transition-transform"
        >
          EC
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Podcasts de Estudo</h2>
          <p className="text-[#0A3D52]/60 mt-1">
            Áudios de revisão e estudo. Ouça no ônibus, antes da prova, onde quiser.
          </p>
        </div>

        {/* Upload */}
        <section className="mb-10">
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6 shadow-sm">
            <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 text-[#D4941E]" /> Publicar novo podcast
            </h3>

            {!arquivoPendente ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#0A3D52]/20 rounded-2xl p-10 text-center hover:border-[#D4941E]/50 hover:bg-[#D4941E]/5 transition-all cursor-pointer"
              >
                <Headphones className="w-10 h-10 mx-auto mb-3 text-[#0A3D52]/25" />
                <p className="text-sm font-bold text-[#0A3D52]/60">
                  Clique para selecionar um áudio
                </p>
                <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase tracking-widest mt-1">
                  MP3, M4A ou WAV • até 50MB
                </p>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#F5F7FA] rounded-xl p-4 flex items-center gap-3">
                  <Headphones className="w-5 h-5 text-[#D4941E] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{arquivoPendente.name}</p>
                    <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                      {(arquivoPendente.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setArquivoPendente(null)}
                    className="text-[10px] font-black uppercase text-[#E74C3C] cursor-pointer"
                  >
                    Trocar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-[#0A3D52]/50 tracking-widest block mb-1">
                      Título
                    </label>
                    <input
                      value={tituloForm}
                      onChange={(e) => setTituloForm(e.target.value)}
                      placeholder="Ex: Revisão Aulas 1-5 para AP1"
                      className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[#0A3D52]/50 tracking-widest block mb-1">
                      Disciplina
                    </label>
                    <select
                      value={disciplinaForm}
                      onChange={(e) => setDisciplinaForm(e.target.value)}
                      className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none cursor-pointer"
                    >
                      {disciplinas.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-[#0A3D52]/50 tracking-widest block mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={descricaoForm}
                    onChange={(e) => setDescricaoForm(e.target.value)}
                    placeholder="Do que trata o áudio? Ex: revisão rápida dos conceitos de conjuntos para a AP1."
                    rows={2}
                    className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-medium text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none resize-none"
                  />
                </div>

                <button
                  onClick={confirmarUpload}
                  disabled={subindo}
                  className="w-full bg-[#D4941E] text-[#0A3D52] py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#D4941E]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {subindo ? "Publicando..." : "Publicar podcast"}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/*"
              className="hidden"
              onChange={selecionarArquivo}
            />
          </div>
        </section>

        {/* Filtros */}
        {disciplinasComPodcast.length > 0 && (
          <section className="mb-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setFiltroDisciplina(null)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border cursor-pointer",
                  !filtroDisciplina
                    ? "bg-[#0A3D52] text-white border-[#0A3D52]"
                    : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10 hover:border-[#D4941E]/30",
                )}
              >
                Todos ({podcasts.length})
              </button>
              {disciplinasComPodcast.map((d) => {
                const qtd = podcasts.filter((p) => p.disciplina_id === d.id).length;
                return (
                  <button
                    key={d.id}
                    onClick={() => setFiltroDisciplina(d.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border cursor-pointer",
                      filtroDisciplina === d.id
                        ? "bg-[#0A3D52] text-white border-[#0A3D52]"
                        : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10 hover:border-[#D4941E]/30",
                    )}
                  >
                    {d.codigo} ({qtd})
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Lista */}
        <section>
          {carregando ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 animate-pulse"
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0A3D52]/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#0A3D52]/10 rounded w-1/3" />
                      <div className="h-3 bg-[#0A3D52]/10 rounded w-2/3" />
                      <div className="h-2 bg-[#0A3D52]/5 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : podcastsFiltrados.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-[#0A3D52]/10 p-12 text-center">
              <Headphones className="w-12 h-12 mx-auto mb-4 text-[#0A3D52]/20" />
              <p className="font-black text-xs uppercase tracking-widest text-[#0A3D52]/40">
                {filtroDisciplina
                  ? "Nenhum podcast nesta disciplina ainda"
                  : "Nenhum podcast publicado ainda"}
              </p>
              <p className="text-sm text-[#0A3D52]/50 mt-2 font-medium">
                Use a área acima para publicar o primeiro áudio.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {podcastsFiltrados.map((p) => {
                const d = disciplinaInfo(p.disciplina_id);
                return (
                  <PodcastCard
                    key={p.id}
                    podcast={p}
                    disciplinaCor={d?.cor ?? "#0A3D52"}
                    disciplinaNome={d?.codigo ?? d?.nome ?? "Disciplina"}
                    onRemover={handleRemover}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Mobile Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#0A3D52]/10 flex justify-around p-3 md:hidden z-40">
        <Link
          to="/"
          activeProps={{ className: "text-[#D4941E]" }}
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Dashboard</span>
        </Link>
        <Link
          to="/podcasts"
          activeProps={{ className: "text-[#D4941E]" }}
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <Headphones className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Podcasts</span>
        </Link>
        <Link
          to="/calendar"
          activeProps={{ className: "text-[#D4941E]" }}
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Calendário</span>
        </Link>
        <Link
          to="/disciplines"
          activeProps={{ className: "text-[#D4941E]" }}
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <Layout className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Disciplinas</span>
        </Link>
        <Link
          to="/settings"
          activeProps={{ className: "text-[#D4941E]" }}
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Perfil</span>
        </Link>
      </div>
    </div>
  );
}

function MobileNavLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 text-white"
      activeProps={{ className: "bg-white/10 border-white/20 text-[#D4941E]" }}
    >
      <Icon className="w-5 h-5" />
      <span className="font-black text-xs uppercase tracking-widest">{label}</span>
    </Link>
  );
}

function NavLinkDesktop({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
    >
      {label}
    </Link>
  );
}
