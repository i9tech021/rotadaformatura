// src/routes/metricas.tsx
// Painel de métricas (admin): o que acontece por baixo dos panos —
// volume por evento, por dia, rotas mais usadas, funil do simulado.
// Acesso com a senha de admin (mesma das exclusões). Sem Supabase, lê o log local.
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Lock, Menu, Database, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useEffect, useMemo, useState } from "react";
import { lerMetricas, type Metrica } from "@/lib/metricas";
import { SENHA_DEV } from "@/lib/auth";
import {
  kindDaPublicacao,
  listPublicacoes,
  type Publicacao,
} from "@/lib/publicacoesService";
import { getOnlineFake } from "@/lib/presenca";
import { getUsoStorage, formatarBytes, COTA_BYTES, type UsoStorage } from "@/lib/armazenamento";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/metricas")({
  component: MetricasPage,
  head: () => ({
    meta: [{ title: "Métricas | Rota da Formatura" }],
  }),
});

const LS_ADMIN = "rdf:metricas-admin";

const ROTULOS: Record<string, string> = {
  pageview: "Páginas vistas (acessos)",
  simulado_gerado: "Simulados gerados",
  simulado_corrigido: "Simulados corrigidos",
  nota_publicada: "Notas publicadas",
  publicacao_criada: "Materiais publicados",
  prova_enviada: "Provas enviadas",
  checkpoint_concluido: "Aulas concluídas",
  audio_tocado: "Áudios tocados",
  podcast_publicado: "Podcasts publicados",
};

function diaISO(iso: string): string {
  return iso.slice(0, 10);
}

function MetricasPage() {
  const [autorizado, setAutorizado] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(LS_ADMIN) === "1",
  );
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const [dados, setDados] = useState<Metrica[]>([]);
  const [carregando, setCarregando] = useState(false);
  // Número aparente de online (fake dinâmico por horário — ver presenca.ts)
  const [onlineFake, setOnlineFake] = useState(() => getOnlineFake());
  const [storage, setStorage] = useState<UsoStorage | null>(null);
  // Quem contribui: autores das publicações (nome + polo + contagem por tipo)
  const [pubs, setPubs] = useState<Publicacao[]>([]);

  useEffect(() => {
    if (!autorizado) return;
    setCarregando(true);
    const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    lerMetricas(desde)
      .then(setDados)
      .catch(() => {})
      .finally(() => setCarregando(false));
    getUsoStorage()
      .then(setStorage)
      .catch(() => {});
    listPublicacoes()
      .then(setPubs)
      .catch(() => {});
    setOnlineFake(getOnlineFake());
    const tick = setInterval(() => setOnlineFake(getOnlineFake()), 60 * 1000);
    return () => clearInterval(tick);
  }, [autorizado]);

  const resumo = useMemo(() => {
    const porEvento: Record<string, number> = {};
    const porDia: Record<string, number> = {};
    const porRota: Record<string, number> = {};
    const autoresPorDia: Record<string, Set<string>> = {};
    for (const m of dados) {
      porEvento[m.evento] = (porEvento[m.evento] ?? 0) + 1;
      const dia = diaISO(m.created_at);
      porDia[dia] = (porDia[dia] ?? 0) + 1;
      if (m.rota) porRota[m.rota] = (porRota[m.rota] ?? 0) + 1;
      if (m.autor_local_id) {
        if (!autoresPorDia[dia]) autoresPorDia[dia] = new Set();
        autoresPorDia[dia].add(m.autor_local_id);
      }
    }
    const dias = Object.keys(porDia).sort().slice(-14);
    const maxDia = Math.max(1, ...dias.map((d) => porDia[d] ?? 0));
    const rotas = Object.entries(porRota)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const maxRota = Math.max(1, ...rotas.map(([, v]) => v));
    const gerados = porEvento["simulado_gerado"] ?? 0;
    const corrigidos = porEvento["simulado_corrigido"] ?? 0;
    const taxaCorrecao = gerados > 0 ? Math.round((corrigidos / gerados) * 100) : 0;
    const usuariosUnicos = new Set(dados.map((m) => m.autor_local_id).filter(Boolean)).size;
    const hojeKey = new Date().toISOString().slice(0, 10);
    const acessosHoje = dados.filter(
      (m) => m.evento === "pageview" && diaISO(m.created_at) === hojeKey,
    ).length;
    const usuariosHoje = new Set(
      dados
        .filter((m) => diaISO(m.created_at) === hojeKey && m.autor_local_id)
        .map((m) => m.autor_local_id as string),
    ).size;
    const audiosTocados = porEvento["audio_tocado"] ?? 0;
    const podcastsPublicados = porEvento["podcast_publicado"] ?? 0;
    return {
      porEvento,
      porDia,
      dias,
      maxDia,
      rotas,
      maxRota,
      gerados,
      corrigidos,
      taxaCorrecao,
      usuariosUnicos,
      acessosHoje,
      usuariosHoje,
      audiosTocados,
      podcastsPublicados,
    };
  }, [dados]);

  // Quem contribui: agrupa publicações por autor (nome + polo)
  const contribuidores = useMemo(() => {
    const map = new Map<
      string,
      {
        nome: string;
        polo: string;
        total: number;
        audio: number;
        video: number;
        pdf: number;
        imagem: number;
        arquivo: number;
        nota: number;
        ultima: string;
      }
    >();
    for (const p of pubs) {
      const chave = p.autor_local_id || `${p.autor_nome}|${p.autor_polo}`;
      const atual = map.get(chave) ?? {
        nome: p.autor_nome || "Anônimo",
        polo: p.autor_polo || "—",
        total: 0,
        audio: 0,
        video: 0,
        pdf: 0,
        imagem: 0,
        arquivo: 0,
        nota: 0,
        ultima: "",
      };
      atual.total++;
      const kind = kindDaPublicacao(p);
      if (kind === "audio") atual.audio++;
      else if (kind === "video") atual.video++;
      else if (kind === "pdf") atual.pdf++;
      else if (kind === "imagem") atual.imagem++;
      else if (kind === "arquivo") atual.arquivo++;
      else atual.nota++;
      if (!atual.ultima || p.criado_em > atual.ultima) atual.ultima = p.criado_em;
      map.set(chave, atual);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [pubs]);

  const entrar = (e: React.FormEvent) => {    e.preventDefault();
    if (senha === SENHA_DEV) {
      sessionStorage.setItem(LS_ADMIN, "1");
      setAutorizado(true);
      setErro(false);
    } else {
      setErro(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-20">
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
            <div className="flex items-center gap-3">
              <Link to="/" className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-bold text-lg uppercase tracking-tight hidden min-[420px]:inline">
                Métricas
              </h1>
            </div>
          </div>
          <AppDesktopNav />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!autorizado ? (
          <form
            onSubmit={entrar}
            className="max-w-sm mx-auto bg-white rounded-3xl border border-[#0A3D52]/10 p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#D4941E]/15 flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#D4941E]" />
              </div>
              <div>
                <h2 className="font-black text-[#0A3D52]">Área restrita</h2>
                <p className="text-[10px] uppercase tracking-widest text-[#0A3D52]/40 font-bold">
                  Métricas de uso do app
                </p>
              </div>
            </div>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha de administrador"
              className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] placeholder:text-[#0A3D52]/30 focus:ring-2 focus:ring-[#D4941E] outline-none"
            />
            {erro && <p className="text-[10px] text-red-500 font-bold">Senha incorreta.</p>}
            <button
              type="submit"
              className="w-full bg-[#0A3D52] text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] cursor-pointer"
            >
              Entrar
            </button>
          </form>
        ) : carregando ? (
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/30 py-10">
            Carregando métricas...
          </p>
        ) : (
          <div className="space-y-6">
            {/* Online agora — discretinho */}
            <div className="bg-white rounded-xl border border-[#0A3D52]/10 px-4 py-2.5 shadow-sm flex items-center gap-2.5">
              <span className="relative flex w-2 h-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#27AE60] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#27AE60]" />
              </span>
              <p className="text-[11px] font-bold text-[#0A3D52]/60">
                <span className="font-black text-[#0A3D52]">{onlineFake}</span> online agora
              </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { l: "Acessos hoje", v: String(resumo.acessosHoje) },
                { l: "Usuários hoje", v: String(resumo.usuariosHoje) },
                { l: "Áudios tocados", v: String(resumo.audiosTocados) },
                { l: "Podcasts publicados", v: String(resumo.podcastsPublicados) },
                { l: "Eventos (30d)", v: String(dados.length) },
                { l: "Usuários únicos", v: String(resumo.usuariosUnicos) },
                { l: "Simulados gerados", v: String(resumo.gerados) },
                { l: "Taxa de correção", v: `${resumo.taxaCorrecao}%` },
              ].map((k) => (
                <div key={k.l} className="bg-[#0A3D52] text-white rounded-2xl p-4 shadow-sm">
                  <p className="text-2xl font-black font-mono">{k.v}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mt-1">
                    {k.l}
                  </p>
                </div>
              ))}
            </div>

            {/* Quem contribui (nomes de quem deu as informações) */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#D4941E]" /> Quem contribui
                {contribuidores.length > 0 && (
                  <span className="ml-auto text-[#D4941E]">
                    {contribuidores.length} pessoa{contribuidores.length !== 1 ? "s" : ""} •{" "}
                    {pubs.length} material{pubs.length !== 1 ? "is" : ""}
                  </span>
                )}
              </h3>
              {contribuidores.length === 0 ? (
                <p className="text-[10px] font-bold uppercase text-[#0A3D52]/30">
                  Ninguém publicou ainda — os nomes aparecem aqui quando a turma compartilhar.
                </p>
              ) : (
                <div className="space-y-2">
                  {contribuidores.map((c) => (
                    <div
                      key={`${c.nome}|${c.polo}`}
                      className="flex items-center gap-3 bg-[#F5F7FA] rounded-xl px-3 py-2.5"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#0A3D52] text-white flex items-center justify-center font-black text-xs shrink-0">
                        {(c.nome.trim()[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{c.nome}</p>
                        <p className="text-[10px] text-[#0A3D52]/40 font-bold uppercase truncate">
                          {c.polo}
                          {[
                            c.audio > 0 ? `🎧 ${c.audio}` : "",
                            c.video > 0 ? `🎬 ${c.video}` : "",
                            c.pdf > 0 ? `📄 ${c.pdf}` : "",
                            c.imagem > 0 ? `🖼️ ${c.imagem}` : "",
                            c.arquivo > 0 ? `📎 ${c.arquivo}` : "",
                            c.nota > 0 ? `📝 ${c.nota}` : "",
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-sm font-mono">{c.total}</p>
                        <p className="text-[9px] font-bold uppercase text-[#0A3D52]/40">
                          {c.total === 1 ? "material" : "materiais"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Armazenamento (Supabase Storage) */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4 flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#D4941E]" /> Armazenamento
              </h3>
              {!storage ? (
                <p className="text-[10px] font-bold uppercase text-[#0A3D52]/30">
                  Medindo arquivos...
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-black font-mono">
                      {formatarBytes(storage.totalBytes)}
                    </p>
                    <p className="text-[10px] font-bold uppercase text-[#0A3D52]/40">
                      de {formatarBytes(COTA_BYTES)} • {storage.totalArquivos} arquivo
                      {storage.totalArquivos !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="w-full h-3 bg-[#F5F7FA] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        storage.totalBytes / COTA_BYTES >= 0.9
                          ? "bg-[#E74C3C]"
                          : storage.totalBytes / COTA_BYTES >= 0.7
                            ? "bg-[#D4941E]"
                            : "bg-[#27AE60]",
                      )}
                      style={{
                        width: `${Math.min(100, Math.round((storage.totalBytes / COTA_BYTES) * 100))}%`,
                      }}
                    />
                  </div>
                  {storage.buckets.map((b) => (
                    <div key={b.bucket} className="pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase text-[#0A3D52]/60">
                          {b.bucket}
                        </span>
                        <span className="text-[10px] font-bold text-[#0A3D52]/40 font-mono">
                          {formatarBytes(b.bytes)} • {b.arquivos} arq.
                        </span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(b.porPasta)
                          .sort((a, b2) => b2[1].bytes - a[1].bytes)
                          .map(([pasta, u]) => (
                            <div key={pasta} className="flex items-center gap-2">
                              <span className="flex-1 text-[10px] font-medium text-[#0A3D52]/50 truncate">
                                {pasta}
                              </span>
                              <div className="w-24 h-1.5 bg-[#F5F7FA] rounded-full overflow-hidden shrink-0">
                                <div
                                  className="h-full bg-[#0A3D52] rounded-full"
                                  style={{
                                    width: `${b.bytes ? Math.round((u.bytes / b.bytes) * 100) : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="w-16 text-right text-[9px] font-bold text-[#0A3D52]/40 font-mono shrink-0">
                                {formatarBytes(u.bytes)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Por evento */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-[#D4941E]" /> Por evento
              </h3>
              <div className="space-y-2">
                {Object.entries(resumo.porEvento)
                  .sort((a, b) => b[1] - a[1])
                  .map(([ev, n]) => {
                    const max = Math.max(1, ...Object.values(resumo.porEvento));
                    return (
                      <div key={ev} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 text-[10px] font-bold uppercase text-[#0A3D52]/60 truncate">
                          {ROTULOS[ev] ?? ev}
                        </span>
                        <div className="flex-1 h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#D4941E] rounded-full"
                            style={{ width: `${Math.round((n / max) * 100)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs font-black font-mono">{n}</span>
                      </div>
                    );
                  })}
                {dados.length === 0 && (
                  <p className="text-[10px] font-bold uppercase text-[#0A3D52]/30">
                    Sem eventos ainda — use o app para gerar dados.
                  </p>
                )}
              </div>
            </div>

            {/* Por dia */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4">
                Últimos 14 dias
              </h3>
              <div className="flex items-end gap-1.5 h-28">
                {resumo.dias.map((d) => (
                  <DiaBar key={d} dia={d} valor={resumo.porDia[d] ?? 0} max={resumo.maxDia} />
                ))}
              </div>
            </div>

            {/* Rotas */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4">
                Rotas mais usadas
              </h3>
              <div className="space-y-2">
                {resumo.rotas.map(([rota, n]) => (
                  <div key={rota} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-[10px] font-bold text-[#0A3D52]/60 truncate font-mono">
                      {rota}
                    </span>
                    <div className="flex-1 h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0A3D52] rounded-full"
                        style={{ width: `${Math.round((n / resumo.maxRota) * 100)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-black font-mono">{n}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Funil */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4">
                Funil do simulado
              </h3>
              <p className="text-sm font-bold">
                {resumo.corrigidos} corrigidos de {resumo.gerados} gerados ({resumo.taxaCorrecao}%)
              </p>
              <p className="text-[10px] text-[#0A3D52]/50 mt-1 font-medium">
                Quem corrige o simulado engaja mais — funil alto aqui indica conteúdo que prende.
              </p>
            </div>
          </div>
        )}
      </main>

      <AppBottomNav />
    </div>
  );
}

function DiaBar({ dia, valor, max }: { dia: string; valor: number; max: number }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div className="w-full bg-[#F5F7FA] rounded-lg flex items-end h-24 overflow-hidden">
        <div
          className={cn("w-full rounded-lg", valor > 0 ? "bg-[#27AE60]" : "bg-transparent")}
          style={{ height: `${Math.max(valor > 0 ? 8 : 0, Math.round((valor / max) * 100))}%` }}
          title={`${dia}: ${valor}`}
        />
      </div>
      <span className="text-[8px] font-bold text-[#0A3D52]/40">{dia.slice(5)}</span>
    </div>
  );
}
