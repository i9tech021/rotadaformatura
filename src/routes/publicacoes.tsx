// src/routes/publicacoes.tsx
// Comunidade aberta — podcasts, PDFs e notas por disciplina, em tempo real.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { disciplinas } from "@/data/disciplines";
import {
  denunciarPublicacao,
  excluirPublicacao,
  getIdentidade,
  listPublicacoes,
  publicarNota,
  publicarPdf,
  publicarPodcast,
  salvarIdentidade,
  subscribePublicacoes,
  type Identidade,
  type Publicacao,
  type TipoPublicacao,
} from "@/lib/publicacoesService";
import { PublicacaoCard } from "@/components/PublicacaoCard";
import { IdentidadeModal } from "@/components/IdentidadeModal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/publicacoes")({
  component: PublicacoesPage,
  head: () => ({
    meta: [{ title: "Comunidade | Rota da Formatura" }],
  }),
});

function PublicacoesPage() {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroDisciplina, setFiltroDisciplina] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<TipoPublicacao | "todos">("todos");

  const [identidade, setIdentidade] = useState<Identidade | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  // Form de publicação
  const [formAberto, setFormAberto] = useState(false);
  const [tipoForm, setTipoForm] = useState<TipoPublicacao>("podcast");
  const [disciplinaForm, setDisciplinaForm] = useState(disciplinas[0]?.id ?? "");
  const [tituloForm, setTituloForm] = useState("");
  const [descricaoForm, setDescricaoForm] = useState("");
  const [conteudoForm, setConteudoForm] = useState("");
  const [arquivoForm, setArquivoForm] = useState<File | null>(null);
  const [publicando, setPublicando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recarregar = useCallback(async () => {
    const lista = await listPublicacoes();
    setPublicacoes(lista);
    setCarregando(false);
  }, []);

  useEffect(() => {
    setIdentidade(getIdentidade());
    recarregar();
    return subscribePublicacoes(recarregar);
  }, [recarregar]);

  const disciplinaInfo = (id: string) => disciplinas.find((d) => d.id === id);

  const disciplinasComPub = useMemo(
    () => disciplinas.filter((d) => publicacoes.some((p) => p.disciplina_id === d.id)),
    [publicacoes],
  );

  const publicacoesFiltradas = useMemo(() => {
    let lista = publicacoes;
    if (filtroDisciplina) lista = lista.filter((p) => p.disciplina_id === filtroDisciplina);
    if (filtroTipo !== "todos") lista = lista.filter((p) => p.tipo === filtroTipo);
    return lista;
  }, [publicacoes, filtroDisciplina, filtroTipo]);

  const abrirForm = () => {
    if (!identidade) {
      setModalAberto(true);
      return;
    }
    setFormAberto(true);
  };

  const salvarIdentidadeSubmit = (nome: string, polo: string) => {
    const ident = salvarIdentidade(nome, polo);
    setIdentidade(ident);
    setModalAberto(false);
    setFormAberto(true);
    toast.success("Identificação salva! Agora publique.");
  };

  const selecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxBytes = 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Máximo de 50MB por arquivo.");
      return;
    }
    if (tipoForm === "podcast" && !file.type.startsWith("audio/")) {
      toast.error("Selecione um arquivo de áudio (MP3, M4A, WAV).");
      return;
    }
    if (tipoForm === "pdf" && file.type !== "application/pdf") {
      toast.error("Selecione um arquivo PDF.");
      return;
    }
    setArquivoForm(file);
  };

  const trocarTipo = (t: TipoPublicacao) => {
    setTipoForm(t);
    setArquivoForm(null);
  };

  const confirmarPublicacao = async () => {
    if (!identidade) return;
    if (!disciplinaForm) {
      toast.error("Selecione a disciplina.");
      return;
    }
    if (tipoForm === "nota") {
      if (!conteudoForm.trim()) {
        toast.error("Escreva o conteúdo da nota.");
        return;
      }
    } else if (!arquivoForm) {
      toast.error(tipoForm === "podcast" ? "Selecione o áudio." : "Selecione o PDF.");
      return;
    }

    setPublicando(true);
    const base = {
      disciplinaId: disciplinaForm,
      titulo: tituloForm.trim(),
      descricao: descricaoForm.trim(),
      ident: identidade,
    };

    let r: { ok: boolean; error?: string } = { ok: false };
    if (tipoForm === "podcast") r = await publicarPodcast(base, arquivoForm as File);
    else if (tipoForm === "pdf") r = await publicarPdf(base, arquivoForm as File);
    else r = await publicarNota(base, conteudoForm);

    setPublicando(false);
    if (!r.ok) {
      toast.error(r.error || "Erro ao publicar.");
      return;
    }
    toast.success("Publicado na comunidade!");
    setFormAberto(false);
    setTituloForm("");
    setDescricaoForm("");
    setConteudoForm("");
    setArquivoForm(null);
    recarregar();
  };

  const handleExcluir = async (p: Publicacao) => {
    const r = await excluirPublicacao(p);
    if (!r.ok) {
      toast.error(r.error || "Não foi possível excluir.");
      return;
    }
    toast.success("Publicação excluída.");
    recarregar();
  };

  const handleDenunciar = async (p: Publicacao) => {
    const r = await denunciarPublicacao(p.id);
    if (r.ok) toast.success("Denúncia registrada. Obrigado!");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-24">
      {/* Header */}
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
                  <MobileNavLink to="/publicacoes" icon={Users} label="Comunidade" />
                  <MobileNavLink to="/simulados" icon={Sparkles} label="Simulados" />
                  <MobileNavLink to="/calculadora" icon={Sparkles} label="Calculadora" />
                  <MobileNavLink to="/calendar" icon={CalendarIcon} label="Calendário" />
                  <MobileNavLink to="/disciplines" icon={FileText} label="Disciplinas" />
                  <MobileNavLink to="/settings" icon={Settings} label="Configurações" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#D4941E]" />
            <span className="font-bold text-lg tracking-tight uppercase hidden xs:inline">
              Comunidade
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 mr-6">
          <Link
            to="/"
            className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/simulados"
            className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          >
            Simulados
          </Link>
          <Link
            to="/calculadora"
            className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          >
            Calculadora
          </Link>
          <Link
            to="/podcasts"
            className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          >
            Podcasts
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Comunidade de Estudos</h2>
          <p className="text-[#0A3D52]/60 mt-1">
            Compartilhe podcasts, PDFs e notas por disciplina. Em tempo real para todo mundo.
          </p>
          {identidade ? (
            <p className="text-[10px] font-bold text-[#27AE60] mt-2 uppercase tracking-widest">
              ✓ Publicando como {identidade.nome} • {identidade.polo}
            </p>
          ) : (
            <p className="text-[10px] font-bold text-[#D4941E] mt-2 uppercase tracking-widest">
              Identifique-se para publicar (nome + polo)
            </p>
          )}
        </div>

        {/* Botão publicar */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6 shadow-sm">
            {!formAberto ? (
              <button
                onClick={abrirForm}
                className="w-full border-2 border-dashed border-[#0A3D52]/20 rounded-2xl p-6 text-center hover:border-[#D4941E]/50 hover:bg-[#D4941E]/5 transition-all cursor-pointer"
              >
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-[#0A3D52]/30" />
                <p className="font-black text-xs uppercase tracking-widest text-[#0A3D52]/60">
                  Publicar algo útil para a turma
                </p>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Tipo */}
                <div className="flex gap-2">
                  {(["podcast", "pdf", "nota"] as TipoPublicacao[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => trocarTipo(t)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                        tipoForm === t
                          ? "bg-[#0A3D52] text-white border-[#0A3D52]"
                          : "bg-[#F5F7FA] text-[#0A3D52]/50 border-[#0A3D52]/10",
                      )}
                    >
                      {t === "podcast" ? "🎧 Podcast" : t === "pdf" ? "📄 PDF" : "📝 Nota"}
                    </button>
                  ))}
                </div>

                {/* Disciplina */}
                <select
                  value={disciplinaForm}
                  onChange={(e) => setDisciplinaForm(e.target.value)}
                  className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none cursor-pointer"
                >
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome} ({d.codigo})
                    </option>
                  ))}
                </select>

                <input
                  value={tituloForm}
                  onChange={(e) => setTituloForm(e.target.value)}
                  placeholder="Título"
                  className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none"
                />
                <input
                  value={descricaoForm}
                  onChange={(e) => setDescricaoForm(e.target.value)}
                  placeholder="Descrição (opcional)"
                  className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-medium text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none"
                />

                {tipoForm === "nota" ? (
                  <textarea
                    value={conteudoForm}
                    onChange={(e) => setConteudoForm(e.target.value)}
                    placeholder="Escreva sua nota/resumo aqui..."
                    rows={4}
                    className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-medium text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none resize-none"
                  />
                ) : !arquivoForm ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#0A3D52]/20 rounded-xl py-6 text-center hover:border-[#D4941E]/50 transition-all cursor-pointer"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50">
                      {tipoForm === "podcast"
                        ? "🎧 Selecionar áudio (MP3/M4A/WAV • 50MB)"
                        : "📄 Selecionar PDF (50MB)"}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 bg-[#F5F7FA] rounded-xl p-3">
                    <Headphones className="w-5 h-5 text-[#D4941E] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{arquivoForm.name}</p>
                      <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                        {(arquivoForm.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setArquivoForm(null)}
                      className="text-[10px] font-black uppercase text-[#E74C3C] cursor-pointer"
                    >
                      Trocar
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setFormAberto(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#0A3D52]/10 text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarPublicacao}
                    disabled={publicando}
                    className="flex-1 py-2.5 rounded-xl bg-[#D4941E] text-[#0A3D52] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#D4941E]/20 hover:scale-[1.01] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {publicando ? "Publicando..." : "Publicar"}
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={tipoForm === "podcast" ? "audio/*" : "application/pdf"}
              className="hidden"
              onChange={selecionarArquivo}
            />
          </div>
        </section>

        {/* Filtros */}
        {(disciplinasComPub.length > 0 || publicacoes.length > 0) && (
          <section className="mb-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => {
                  setFiltroDisciplina(null);
                  setFiltroTipo("todos");
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border cursor-pointer",
                  !filtroDisciplina && filtroTipo === "todos"
                    ? "bg-[#0A3D52] text-white border-[#0A3D52]"
                    : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10",
                )}
              >
                Tudo ({publicacoes.length})
              </button>
              {disciplinasComPub.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setFiltroDisciplina(d.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border cursor-pointer",
                    filtroDisciplina === d.id
                      ? "bg-[#0A3D52] text-white border-[#0A3D52]"
                      : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10",
                  )}
                >
                  {d.codigo}
                </button>
              ))}
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
          ) : publicacoesFiltradas.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-[#0A3D52]/10 p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-[#0A3D52]/20" />
              <p className="font-black text-xs uppercase tracking-widest text-[#0A3D52]/40">
                Nada publicado ainda
              </p>
              <p className="text-sm text-[#0A3D52]/50 mt-2 font-medium">
                Seja a primeira pessoa a compartilhar um material!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {publicacoesFiltradas.map((p) => {
                const d = disciplinaInfo(p.disciplina_id);
                return (
                  <PublicacaoCard
                    key={p.id}
                    publicacao={p}
                    disciplinaCor={d?.cor ?? "#0A3D52"}
                    disciplinaNome={d?.codigo ?? d?.nome ?? "Disciplina"}
                    ehAutor={!!identidade && p.autor_local_id === identidade.autorLocalId}
                    aoExcluir={handleExcluir}
                    aoDenunciar={handleDenunciar}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      <IdentidadeModal
        aberto={modalAberto}
        aoSalvar={salvarIdentidadeSubmit}
        aoFechar={() => setModalAberto(false)}
      />

      {/* Bottom Mobile Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#0A3D52]/10 flex justify-around p-3 md:hidden z-40">
        <MobileNavLink to="/" icon={LayoutDashboard} label="Início" bottom />
        <MobileNavLink to="/publicacoes" icon={Users} label="Comunidade" bottom />
        <MobileNavLink to="/simulados" icon={Sparkles} label="Simulado" bottom />
        <MobileNavLink to="/calculadora" icon={Sparkles} label="Calc" bottom />
        <MobileNavLink to="/calendar" icon={CalendarIcon} label="Calendário" bottom />
      </div>
    </div>
  );
}

function MobileNavLink({
  to,
  icon: Icon,
  label,
  bottom,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  bottom?: boolean;
}) {
  if (bottom) {
    return (
      <Link
        to={to}
        activeProps={{ className: "text-[#D4941E]" }}
        inactiveProps={{ className: "text-[#0A3D52]/40" }}
        className="flex flex-col items-center"
      >
        <Icon className="w-5 h-5" />
        <span className="text-[8px] font-black uppercase mt-0.5 tracking-tighter">{label}</span>
      </Link>
    );
  }
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
