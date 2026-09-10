// src/routes/podcasts.tsx
// Acervo global de podcasts — upload, player, filtro por disciplina.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Headphones,
  Menu,
  Upload,
  Search,
  ChevronRight,
  ChevronDown,
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
import { track } from "@/lib/metricas";
import { otimizarAudio, suportaOtimizacao } from "@/lib/audioLeve";
import { LIMITE_UPLOAD_MB } from "@/lib/podcastService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/podcasts")({
  component: PodcastsPage,
  head: () => ({
    meta: [{ title: "Podcasts | Rota da Formatura" }],
  }),
});

const MAX_AUDIO_MB = 500; // validação de sanidade no aparelho (o servidor aceita ~50MB)

const OBJETIVOS = [
  { v: "", l: "Selecione o objetivo..." },
  { v: "AP1", l: "AP1 — Prova Presencial 1" },
  { v: "AP2", l: "AP2 — Prova Presencial 2" },
  { v: "AP3", l: "AP3 — Recuperacao" },
  { v: "AD1", l: "AD1 — Atividade a Distancia 1" },
  { v: "AD2", l: "AD2 — Atividade a Distancia 2" },
  { v: "revisao", l: "Revisao Geral" },
  { v: "conteudo", l: "Conteudo de Aula" },
  { v: "dica", l: "Dica / Resumo Rapido" },
];

interface ArquivoLote {
  key: string;
  file: File;
  titulo: string;
  objetivo: string;
  descricao: string;
  blob?: Blob; // versão leve pronta (quando otimizada)
  economia?: number; // % economizada vs original
  status?: string; // texto de fase ("otimizando…", "tentativa 2…")
  erro?: string; // motivo da falha (para exibir)
}

function arquivoValido(file: File): string | null {
  if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
    return `${file.name}: muito grande (max ${MAX_AUDIO_MB}MB).`;
  }
  const extOk = /\.(mp3|m4a|wav|ogg|oga|opus|aac|wma|mp4|3gp|amr)$/i.test(file.name);
  const mimeOk = file.type === "" || file.type.startsWith("audio/");
  if (!mimeOk && !extOk) return `${file.name}: formato nao suportado.`;
  return null;
}

function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroDisciplina, setFiltroDisciplina] = useState<string | null>(null);
  const [subindo, setSubindo] = useState(false);
  const [busca, setBusca] = useState("");

  // Lote de upload: vários áudios de uma vez, mesma disciplina
  const [lote, setLote] = useState<ArquivoLote[]>([]);
  const [disciplinaForm, setDisciplinaForm] = useState(disciplinas[0]?.id ?? "");
  const [progressoLote, setProgressoLote] = useState<{ atual: number; total: number; pct: number } | null>(null);
  const [abertas, setAbertas] = useState<Record<string, boolean>>({});
  // Versão leve: comprime antes de enviar (desliga se o aparelho não suportar)
  const [otimizar, setOtimizar] = useState(true);
  const [otimSuportado, setOtimSuportado] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recarregar = useCallback(async () => {
    const lista = await listPodcasts();
    setPodcasts(lista);
    setCarregando(false);
  }, []);

  useEffect(() => {
    recarregar();
    suportaOtimizacao()
      .then(setOtimSuportado)
      .catch(() => setOtimSuportado(false));
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

  // Seções por matéria (acordeão): todas as disciplinas, mesmo sem áudio
  const secoes = useMemo(() => {
    const lista = filtroDisciplina ? disciplinas.filter((d) => d.id === filtroDisciplina) : disciplinas;
    return lista.map((d) => ({
      d,
      itens: podcastsFiltrados.filter((p) => p.disciplina_id === d.id),
    }));
  }, [podcastsFiltrados, filtroDisciplina]);

  const disciplinaInfo = (id: string) => disciplinas.find((d) => d.id === id);

  const adicionarArquivos = (files: FileList | File[]) => {
    const novos: ArquivoLote[] = [];
    let rejeitados = 0;
    for (const file of Array.from(files)) {
      const erro = arquivoValido(file);
      if (erro) {
        rejeitados++;
        continue;
      }
      // evita duplicado (mesmo nome + tamanho)
      if ([...lote, ...novos].some((a) => a.file.name === file.name && a.file.size === file.size)) {
        continue;
      }
      novos.push({
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        titulo: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        objetivo: "",
        descricao: "",
      });
    }
    if (rejeitados > 0) toast.error(`${rejeitados} arquivo(s) rejeitado(s) (formato ou tamanho).`);
    if (novos.length > 0) {
      setLote((l) => [...l, ...novos]);
      toast.success(`${novos.length} audio(s) na fila.`);
    }
    // permite selecionar o mesmo arquivo de novo
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const atualizarItem = (key: string, patch: Partial<ArquivoLote>) =>
    setLote((l) => l.map((a) => (a.key === key ? { ...a, ...patch } : a)));

  const removerItem = (key: string) => setLote((l) => l.filter((a) => a.key !== key));

  const publicarLote = async () => {
    if (lote.length === 0) return;
    if (!disciplinaForm) {
      toast.error("Selecione a disciplina.");
      return;
    }
    const semTitulo = lote.filter((a) => !a.titulo.trim());
    if (semTitulo.length > 0) {
      toast.error("Dê um título para todos os áudios.");
      return;
    }
    setSubindo(true);
    const fila = [...lote];
    const total = fila.length;
    let ok = 0;
    const chavesOk = new Set<string>();
    const marca = (key: string, patch: Partial<ArquivoLote>) =>
      setLote((l) => l.map((a) => (a.key === key ? { ...a, ...patch } : a)));

    for (let i = 0; i < fila.length; i++) {
      const item = fila[i]!;
      marca(item.key, { erro: undefined, status: "preparando..." });
      setProgressoLote({ atual: i + 1, total, pct: Math.round((i / total) * 100) });

      // 1) Versão leve (se ligada e ainda não otimizado; otimizarAudio detecta suporte sozinho)
      let arquivo: File = item.file;
      let nomeEnvio = item.file.name;
      let economia: number | undefined = item.economia;
      let blobPronto = item.blob;
      if (otimizar && otimSuportado !== false && !blobPronto && item.file.size >= 3 * 1024 * 1024) {
        marca(item.key, { status: "otimizando (deixando mais leve)..." });
        try {
          const leve = await otimizarAudio(item.file, (_fase, pct) => {
            marca(item.key, { status: `otimizando... ${pct}%` });
            setProgressoLote({
              atual: i + 1,
              total,
              pct: Math.round(((i + pct / 200) / total) * 100),
            });
          });
          if (leve) {
            blobPronto = new File([leve.blob], leve.nome, { type: leve.mime });
            economia = leve.economiaPct;
            marca(item.key, { blob: blobPronto, economia, status: `leve (${leve.economiaPct}% menor)` });
          } else {
            marca(item.key, { status: "enviando original..." });
          }
        } catch {
          marca(item.key, { status: "enviando original..." });
        }
      }
      if (blobPronto) {
        arquivo = blobPronto as File;
        nomeEnvio = (blobPronto as File).name || nomeEnvio;
      } else if (arquivo.size > LIMITE_UPLOAD_MB * 1024 * 1024) {
        // grande demais para o servidor e sem versão leve: nem tenta
        marca(item.key, {
          erro: `Arquivo de ${(arquivo.size / 1048576).toFixed(0)}MB: o servidor aceita até ${LIMITE_UPLOAD_MB}MB. Liga a "Versão leve" para comprimir antes de enviar.`,
          status: undefined,
        });
        continue;
      }

      // 2) Upload com até 3 tentativas
      let r: Awaited<ReturnType<typeof uploadPodcast>> | null = null;
      for (let tent = 1; tent <= 3; tent++) {
        marca(item.key, {
          status: tent === 1 ? "enviando..." : `tentativa ${tent} de 3...`,
        });
        try {
          r = await uploadPodcast(
            arquivo,
            {
              disciplinaId: disciplinaForm,
              titulo: item.titulo.trim(),
              descricao: item.descricao.trim(),
              objetivo: item.objetivo,
            },
            (pct) =>
              setProgressoLote({
                atual: i + 1,
                total,
                pct: Math.round(((i + pct / 100) / total) * 100),
              }),
          );
        } catch {
          r = { ok: false, error: "Erro de rede." };
        }
        if (r.ok) break;
        if (tent < 3) await new Promise((res) => setTimeout(res, 2000));
      }

      if (r?.ok) {
        ok++;
        chavesOk.add(item.key);
        track("podcast_publicado", {
          podcastId: r.podcast?.id ?? null,
          disciplinaId: disciplinaForm,
          objetivo: item.objetivo || null,
          lote: total > 1,
          leve: Boolean(blobPronto),
          economiaPct: economia ?? null,
          arquivo: nomeEnvio,
        });
      } else {
        marca(item.key, { erro: r?.error || "Falha no envio.", status: undefined });
      }
    }
    setSubindo(false);
    setProgressoLote(null);
    if (ok > 0) {
      if (!isSupabaseConfigured) toast.info("Salvos localmente (sem banco configurado).");
      else toast.success(`${ok} áudio(s) publicado(s)!`);
      // remove os que subiram, mantém os que falharam (com o motivo visível)
      setLote((l) => l.filter((a) => !chavesOk.has(a.key)));
      recarregar();
    } else if (fila.length > 0) {
      toast.error("Nenhum áudio subiu. Veja o motivo em cada item.");
    }
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
              <h4 className="font-black text-sm uppercase">Publicar estudo em áudio</h4>
              <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                Envie um audio para a turma
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#0A3D52]/20 group-open:rotate-90 transition-transform" />
          </summary>

          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 border-t-0 rounded-t-none p-5 shadow-sm space-y-3 -mt-2 pt-6">
            {/* Disciplina do lote */}
            <div>
              <label className="text-[10px] font-black uppercase text-[#0A3D52]/50 tracking-widest block mb-1">
                Matéria dos áudios
              </label>
              <select
                value={disciplinaForm}
                onChange={(e) => setDisciplinaForm(e.target.value)}
                className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#7C3AED] outline-none cursor-pointer"
              >
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.codigo} — {d.nome}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-[#7C3AED]/20 rounded-2xl p-6 text-center hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/5 transition-all cursor-pointer"
            >
              <Headphones className="w-8 h-8 mx-auto mb-2 text-[#7C3AED]/30" />
              <p className="text-sm font-bold text-[#0A3D52]/60">
                {lote.length === 0
                  ? "Toque para selecionar os áudios (pode escolher vários)"
                  : "Adicionar mais áudios"}
              </p>
              <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase tracking-widest mt-1">
                MP3, M4A, WAV, OGG, AAC — servidor aceita ~{LIMITE_UPLOAD_MB}MB (a Versão leve comprime)
              </p>
            </button>

            {/* Versão leve */}
            <label className="flex items-center gap-3 bg-[#7C3AED]/5 border border-[#7C3AED]/15 rounded-xl px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={otimizar}
                onChange={(e) => setOtimizar(e.target.checked)}
                disabled={subindo || otimSuportado === false}
                className="w-5 h-5 accent-[#7C3AED] cursor-pointer shrink-0"
              />
              <span className="flex-1">
                <span className="block text-xs font-black uppercase">Versão leve (economiza espaço)</span>
                <span className="block text-[10px] font-medium text-[#0A3D52]/50">
                  {otimSuportado === false
                    ? "Neste aparelho, envia o arquivo original."
                    : "Comprimo o áudio no teu aparelho antes de enviar (voz fica ~4x menor)."}
                </span>
              </span>
            </label>

            {/* Fila do lote */}
            {lote.map((item, idx) => (
              <div key={item.key} className="bg-[#F5F7FA] rounded-xl p-3 space-y-2 border border-[#0A3D52]/5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#7C3AED]/15 text-[#7C3AED] text-[10px] font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{item.file.name}</p>
                    <p className="text-[9px] font-bold text-[#0A3D52]/40 uppercase">
                      {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                      {item.economia !== undefined && (
                        <span className="text-[#27AE60]"> → leve ({item.economia}% menor)</span>
                      )}
                    </p>
                  </div>
                  {!subindo && (
                    <button
                      onClick={() => removerItem(item.key)}
                      className="text-[10px] font-black uppercase text-[#E74C3C] cursor-pointer shrink-0"
                    >
                      Tirar
                    </button>
                  )}
                </div>
                {item.status && (
                  <p className="text-[10px] font-bold text-[#7C3AED]">{item.status}</p>
                )}
                {item.erro && (
                  <p className="text-[10px] font-bold text-[#E74C3C] bg-[#E74C3C]/5 rounded-lg px-2 py-1.5">
                    Não subiu: {item.erro}
                  </p>
                )}
                <input
                  value={item.titulo}
                  onChange={(e) => atualizarItem(item.key, { titulo: e.target.value })}
                  placeholder="Título do episódio"
                  disabled={subindo}
                  className="w-full bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED] outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={item.objetivo}
                    onChange={(e) => atualizarItem(item.key, { objetivo: e.target.value })}
                    disabled={subindo}
                    className="w-full bg-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#7C3AED] outline-none cursor-pointer"
                  >
                    {OBJETIVOS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.l}
                      </option>
                    ))}
                  </select>
                  <input
                    value={item.descricao}
                    onChange={(e) => atualizarItem(item.key, { descricao: e.target.value })}
                    placeholder="Descrição (opcional)"
                    disabled={subindo}
                    className="w-full bg-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#7C3AED] outline-none"
                  />
                </div>
              </div>
            ))}

            {/* Progresso do lote */}
            {subindo && progressoLote && (
              <div className="space-y-1.5">
                <div className="w-full h-2.5 bg-[#F5F7FA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C3AED] to-[#7C3AED]/70 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressoLote.pct}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-[#0A3D52]/40 text-center">
                  Enviando {progressoLote.atual} de {progressoLote.total}... {progressoLote.pct}%
                </p>
              </div>
            )}

            {lote.length > 0 && (
              <button
                onClick={publicarLote}
                disabled={subindo}
                className={cn(
                  "w-full py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all",
                  subindo
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
                  `Publicar ${lote.length} áudio${lote.length !== 1 ? "s" : ""}`
                )}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/aac,audio/*,.mp3,.m4a,.wav,.ogg,.opus,.aac"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) adicionarArquivos(e.target.files);
              }}
            />
          </div>
        </details>

        {/* Lista por matéria (expansível) */}
        {carregando ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#F5F7FA]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#F5F7FA] rounded w-1/3" />
                    <div className="h-3 bg-[#F5F7FA] rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : secoes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#0A3D52]/10">
            <Headphones className="w-14 h-14 text-[#0A3D52]/8 mx-auto mb-4" />
            <p className="font-black text-xs uppercase tracking-widest text-[#0A3D52]/30 mb-2">
              {busca.trim() || filtroDisciplina
                ? "Nada encontrado"
                : "Nenhum podcast publicado ainda"}
            </p>
            <p className="text-[11px] text-[#0A3D52]/30 max-w-xs mx-auto">
              Use o formulário acima para publicar os primeiros áudios.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {secoes.map(({ d, itens }) => {
              const aberta = abertas[d.id] ?? itens.length > 0;
              return (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl border border-[#0A3D52]/10 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setAbertas((a) => ({ ...a, [d.id]: !aberta }))}
                    className="w-full flex items-center gap-3 p-4 cursor-pointer hover:bg-[#F5F7FA]/60 transition-colors text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: `${d.cor}15` }}
                    >
                      {d.icone}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm leading-tight truncate">{d.nome}</h4>
                      <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                        {d.codigo} • {itens.length} áudio{itens.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {itens.length > 0 && (
                      <span
                        className="text-[10px] font-black px-2 py-1 rounded-full shrink-0"
                        style={{ color: d.cor, background: `${d.cor}15` }}
                      >
                        {itens.length}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-[#0A3D52]/30 shrink-0 transition-transform",
                        aberta && "rotate-180",
                      )}
                    />
                  </button>
                  {aberta && (
                    <div className="px-4 pb-4 space-y-3 border-t border-[#0A3D52]/5 pt-4">
                      {itens.length === 0 ? (
                        <p className="text-[11px] text-[#0A3D52]/40 font-medium text-center py-3">
                          Nenhum áudio aqui ainda. Seja o primeiro a enviar!
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {itens.map((p) => (
                            <PodcastCard
                              key={p.id}
                              podcast={p}
                              disciplinaCor={d.cor}
                              disciplinaNome={d.codigo}
                              podeRemover
                              onRemover={handleRemover}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
