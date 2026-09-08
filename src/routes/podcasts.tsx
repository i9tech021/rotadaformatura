// src/routes/podcasts.tsx
// Acervo global de podcasts — upload, player, filtro por disciplina.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Headphones,
  Menu,
  Upload,
  Search,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
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
  const [busca, setBusca] = useState("");

  const [arquivoPendente, setArquivoPendente] = useState<File | null>(null);
  const [tituloForm, setTituloForm] = useState("");
  const [descricaoForm, setDescricaoForm] = useState("");
  const [objetivoForm, setObjetivoForm] = useState("");
  const [disciplinaForm, setDisciplinaForm] = useState(disciplinas[0]?.id ?? "");
  const [uploadProgress, setUploadProgress] = useState(0);
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

  const qtdPorDisciplina = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of podcasts) {
      map[p.disciplina_id] = (map[p.disciplina_id] || 0) + 1;
    }
    return map;
  }, [podcasts]);

  const podcastsFiltrados = useMemo(() => {
    let lista = filtroDisciplina
      ? podcasts.filter((p) => p.disciplina_id === filtroDisciplina)
      : podcasts;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.titulo.toLowerCase().includes(q) ||
          p.descricao?.toLowerCase().includes(q),
      );
    }
    return lista;
  }, [podcasts, filtroDisciplina, busca]);

  const disciplinaInfo = (id: string) => disciplinas.find((d) => d.id === id);

  const selecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Maximo de 50MB.");
      return;
    }
    if (!file.type.startsWith("audio/")) {
      toast.error("Selecione um arquivo de audio (MP3, M4A ou WAV).");
      return;
    }
    setArquivoPendente(file);
    setTituloForm(file.name.replace(/\.[^.]+$/, ""));
  };

  const confirmarUpload = async () => {
    if (!arquivoPendente) return;
    if (!tituloForm.trim()) {
      toast.error("De um titulo ao podcast.");
      return;
    }
    if (!disciplinaForm) {
      toast.error("Selecione a disciplina.");
      return;
    }
    setSubindo(true);
    setUploadProgress(5);
    const r = await uploadPodcast(
      arquivoPendente,
      {
        disciplinaId: disciplinaForm,
        titulo: tituloForm.trim(),
        descricao: descricaoForm.trim(),
        objetivo: objetivoForm,
      },
      setUploadProgress,
    );
    setSubindo(false);
    setUploadProgress(0);
    if (!r.ok) {
      toast.error(r.error || "Erro ao subir o podcast.");
      return;
    }
    if (!isSupabaseConfigured) {
      toast.info("Salvo localmente (sem banco configurado).");
    } else {
      toast.success("Podcast publicado!");
    }
    setArquivoPendente(null);
    setTituloForm("");
    setDescricaoForm("");
    setObjetivoForm("");
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
      {/* Header */}
      <nav className="bg-[#0A3D52] text-white px-4 py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded-xl transition-colors md:hidden cursor-pointer">
                  <Menu className="w-6 h-6 text-[#D4941E]" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#0A3D52] text-white border-[#D4941E]/20 p-0">
                <AppMobileMenu />
              </SheetContent>
            </Sheet>
            <Headphones className="w-6 h-6 text-[#D4941E]" />
            <span className="font-bold text-lg uppercase tracking-tight hidden min-[420px]:inline">
              Podcasts
            </span>
          </div>
          <AppDesktopNav />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Banner hero */}
        <div className="bg-gradient-to-br from-[#7C3AED] to-[#7C3AED]/80 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Podcasts de Estudo</h2>
                <p className="text-[11px] font-bold text-white/50 mt-0.5">
                  {podcasts.length} episodio{podcasts.length !== 1 ? "s" : ""} disponiveis
                </p>
              </div>
            </div>
            <p className="text-[12px] text-white/60 max-w-lg">
              Audios de revisao e estudo. Ouca no onibus, antes da prova, onde quiser. Seja o primeiro a enviar um podcast!
            </p>
          </div>
        </div>

        {/* Filtro por disciplina — mostra TODAS */}
        <div className="mb-5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setFiltroDisciplina(null)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border cursor-pointer",
                !filtroDisciplina
                  ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-md shadow-[#7C3AED]/20"
                  : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10 hover:border-[#7C3AED]/30",
              )}
            >
              Todas ({podcasts.length})
            </button>
            {disciplinas.map((d) => {
              const qtd = qtdPorDisciplina[d.id] || 0;
              return (
                <button
                  key={d.id}
                  onClick={() => setFiltroDisciplina(d.id)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border flex items-center gap-1.5 cursor-pointer",
                    filtroDisciplina === d.id
                      ? "text-white border-transparent shadow-md"
                      : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10 hover:border-[#7C3AED]/30",
                  )}
                  style={
                    filtroDisciplina === d.id
                      ? { background: d.cor, borderColor: d.cor }
                      : {}
                  }
                >
                  <span>{d.codigo}</span>
                  {qtd > 0 && (
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-black",
                        filtroDisciplina === d.id
                          ? "bg-white/20 text-white"
                          : "bg-[#0A3D52]/8 text-[#0A3D52]/50",
                      )}
                    >
                      {qtd}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Busca */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A3D52]/30" />
          <input
            type="text"
            placeholder="Buscar podcast..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-white border border-[#0A3D52]/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#7C3AED] outline-none"
          />
        </div>

        {/* Upload colapsavel */}
        <details className="group mb-6">
          <summary className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 shadow-sm flex items-center gap-3 cursor-pointer hover:border-[#7C3AED]/30 transition-colors list-none">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-sm uppercase">Publicar podcast</h4>
              <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                Envie um audio para a turma
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#0A3D52]/20 group-open:rotate-90 transition-transform" />
          </summary>

          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 border-t-0 rounded-t-none p-5 shadow-sm space-y-3 -mt-2 pt-6">
            {!arquivoPendente ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#7C3AED]/20 rounded-2xl p-8 text-center hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/5 transition-all cursor-pointer"
              >
                <Headphones className="w-8 h-8 mx-auto mb-2 text-[#7C3AED]/30" />
                <p className="text-sm font-bold text-[#0A3D52]/60">
                  Clique para selecionar um audio
                </p>
                <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase tracking-widest mt-1">
                  MP3, M4A ou WAV — ate 50MB
                </p>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#F5F7FA] rounded-xl p-3 flex items-center gap-3">
                  <Headphones className="w-5 h-5 text-[#7C3AED] shrink-0" />
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

                <input
                  value={tituloForm}
                  onChange={(e) => setTituloForm(e.target.value)}
                  placeholder="Titulo do episodio"
                  className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7C3AED] outline-none"
                />

                <select
                  value={disciplinaForm}
                  onChange={(e) => setDisciplinaForm(e.target.value)}
                  className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7C3AED] outline-none cursor-pointer"
                >
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.codigo} — {d.nome}
                    </option>
                  ))}
                </select>

                <select
                  value={objetivoForm}
                  onChange={(e) => setObjetivoForm(e.target.value)}
                  className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7C3AED] outline-none cursor-pointer"
                >
                  <option value="">Selecione o objetivo...</option>
                  <option value="AP1">AP1 — Prova Presencial 1</option>
                  <option value="AP2">AP2 — Prova Presencial 2</option>
                  <option value="AP3">AP3 — Recuperacao</option>
                  <option value="AD1">AD1 — Atividade a Distancia 1</option>
                  <option value="AD2">AD2 — Atividade a Distancia 2</option>
                  <option value="revisao">Revisao Geral</option>
                  <option value="conteudo">Conteudo de Aula</option>
                  <option value="dica">Dica / Resumo Rapido</option>
                </select>

                <textarea
                  value={descricaoForm}
                  onChange={(e) => setDescricaoForm(e.target.value)}
                  placeholder="Descricao (opcional)"
                  rows={2}
                  className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7C3AED] outline-none resize-none"
                />

                {/* Barra de progresso durante upload */}
                {subindo && (
                  <div className="space-y-1.5">
                    <div className="w-full h-2.5 bg-[#F5F7FA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#7C3AED] to-[#7C3AED]/70 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-[#0A3D52]/40 text-center">
                      {uploadProgress < 20
                        ? "Preparando audio..."
                        : uploadProgress < 80
                          ? `Enviando... ${uploadProgress}%`
                          : uploadProgress < 95
                            ? "Salvando..."
                            : "Quase pronto!"}
                    </p>
                  </div>
                )}

                <button
                  onClick={confirmarUpload}
                  disabled={subindo || !tituloForm.trim()}
                  className={cn(
                    "w-full py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all",
                    subindo || !tituloForm.trim()
                      ? "bg-[#0A3D52]/10 text-[#0A3D52]/30 cursor-not-allowed"
                      : "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20 hover:scale-[1.01] cursor-pointer",
                  )}
                >
                  {subindo ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    "Publicar podcast"
                  )}
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
        </details>

        {/* Lista de podcasts */}
        {carregando ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 animate-pulse"
              >
                <div className="flex gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[#F5F7FA]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#F5F7FA] rounded w-1/3" />
                    <div className="h-4 bg-[#F5F7FA] rounded w-2/3" />
                  </div>
                </div>
                <div className="h-12 bg-[#F5F7FA] rounded-xl" />
              </div>
            ))}
          </div>
        ) : podcastsFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#0A3D52]/10">
            <Headphones className="w-14 h-14 text-[#0A3D52]/8 mx-auto mb-4" />
            <p className="font-black text-xs uppercase tracking-widest text-[#0A3D52]/30 mb-2">
              {filtroDisciplina
                ? "Nenhum podcast nesta disciplina"
                : "Nenhum podcast publicado ainda"}
            </p>
            <p className="text-[11px] text-[#0A3D52]/30 max-w-xs mx-auto">
              {filtroDisciplina
                ? "Seja o primeiro a enviar um audio para esta disciplina!"
                : "Use o formulario acima para publicar o primeiro audio."}
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
                  disciplinaCor={d?.cor ?? "#7C3AED"}
                  disciplinaNome={d?.codigo ?? "Disciplina"}
                  podeRemover
                  onRemover={handleRemover}
                />
              );
            })}
          </div>
        )}

        {/* Link para podcast por disciplina */}
        <div className="mt-8">
          <Link
            to="/disciplines"
            className="flex items-center gap-3 bg-white rounded-2xl border border-[#0A3D52]/10 p-4 shadow-sm hover:border-[#7C3AED]/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-sm uppercase group-hover:text-[#7C3AED] transition-colors">
                Podcasts por Disciplina
              </h4>
              <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                Acesse a pagina da disciplina para ver e enviar podcasts
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#0A3D52]/20 group-hover:text-[#7C3AED] shrink-0" />
          </Link>
        </div>
      </main>

      <AppBottomNav />
    </div>
  );
}
