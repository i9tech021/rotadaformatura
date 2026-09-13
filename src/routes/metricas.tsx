// src/routes/metricas.tsx
// Painel de métricas (admin): gráficos de acesso, picos, usuários ativos.
// Acesso com a senha de admin (rota123).
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Lock,
  Menu,
  Database,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Eye,
  Zap,
} from "lucide-react";
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
import { getOnlineCount } from "@/lib/presenca";
import { getUsoStorage, formatarBytes, COTA_BYTES, type UsoStorage } from "@/lib/armazenamento";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/metricas")({
  component: MetricasPage,
  head: () => ({
    meta: [{ title: "Metricas | Rota da Formatura" }],
  }),
});

const LS_ADMIN = "rdf:metricas-admin";

const ROTULOS: Record<string, string> = {
  pageview: "Paginas vistas",
  simulado_gerado: "Simulados gerados",
  simulado_corrigido: "Simulados corrigidos",
  nota_publicada: "Notas publicadas",
  publicacao_criada: "Materiais publicados",
  prova_enviada: "Provas enviadas",
  checkpoint_concluido: "Aulas concluidas",
  audio_tocado: "Audios tocados",
  podcast_publicado: "Podcasts publicados",
  gabarito_publicado: "Gabaritos publicados",
  gabarito_corrigido: "Gabaritos corrigidos",
};

const ROTULOS_CURTOS: Record<string, string> = {
  pageview: "Pageviews",
  simulado_gerado: "Sim gerados",
  simulado_corrigido: "Sim corrigidos",
  nota_publicada: "Notas pub",
  publicacao_criada: "Materiais",
  prova_enviada: "Provas",
  checkpoint_concluido: "Aulas OK",
  audio_tocado: "Audios",
  podcast_publicado: "Podcasts",
  gabarito_publicado: "Gab pub",
  gabarito_corrigido: "Gab corrig",
};

function diaISO(iso: string): string {
  return iso.slice(0, 10);
}

function horaISO(iso: string): number {
  return new Date(iso).getHours();
}

function MetricasPage() {
  const [autorizado, setAutorizado] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(LS_ADMIN) === "1",
  );
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const [dados, setDados] = useState<Metrica[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [onlineCount, setOnlineCount] = useState(() => getOnlineCount());
  const [storage, setStorage] = useState<UsoStorage | null>(null);
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
    setOnlineCount(getOnlineCount());
    const tick = setInterval(() => setOnlineCount(getOnlineCount()), 10 * 1000);
    return () => clearInterval(tick);
  }, [autorizado]);

  const resumo = useMemo(() => {
    const porEvento: Record<string, number> = {};
    const porDia: Record<string, number> = {};
    const porRota: Record<string, number> = {};
    const porHora: Record<number, number> = {};
    const usuariosPorDia: Record<string, Set<string>> = {};
    const pageviewsPorDia: Record<string, number> = {};

    for (const m of dados) {
      porEvento[m.evento] = (porEvento[m.evento] ?? 0) + 1;
      const dia = diaISO(m.created_at);
      porDia[dia] = (porDia[dia] ?? 0) + 1;
      if (m.rota) porRota[m.rota] = (porRota[m.rota] ?? 0) + 1;
      const hora = horaISO(m.created_at);
      porHora[hora] = (porHora[hora] ?? 0) + 1;
      if (m.autor_local_id) {
        if (!usuariosPorDia[dia]) usuariosPorDia[dia] = new Set();
        usuariosPorDia[dia].add(m.autor_local_id);
      }
      if (m.evento === "pageview") {
        pageviewsPorDia[dia] = (pageviewsPorDia[dia] ?? 0) + 1;
      }
    }

    const dias = Object.keys(porDia).sort().slice(-14);
    const maxDia = Math.max(1, ...dias.map((d) => porDia[d] ?? 0));
    const rotas = Object.entries(porRota)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const maxRota = Math.max(1, ...rotas.map(([, v]) => v));

    const gerados = porEvento["simulado_gerado"] ?? 0;
    const corrigidos = porEvento["simulado_corrigido"] ?? 0;
    const taxaCorrecao = gerados > 0 ? Math.round((corrigidos / gerados) * 100) : 0;

    const usuariosUnicos = new Set(dados.map((m) => m.autor_local_id).filter(Boolean)).size;
    const hojeKey = new Date().toISOString().slice(0, 10);
    const acessosHoje = pageviewsPorDia[hojeKey] ?? 0;
    const usuariosHoje = usuariosPorDia[hojeKey]?.size ?? 0;

    // Pico: hora com mais atividade
    let horaPico = 0;
    let maxHora = 0;
    for (let h = 0; h < 24; h++) {
      if ((porHora[h] ?? 0) > maxHora) {
        maxHora = porHora[h] ?? 0;
        horaPico = h;
      }
    }

    // Média de acessos por dia (últimos 7 dias)
    const dias7 = dias.slice(-7);
    const total7 = dias7.reduce((acc, d) => acc + (pageviewsPorDia[d] ?? 0), 0);
    const mediaAcessosDia = dias7.length > 0 ? Math.round(total7 / dias7.length) : 0;

    // Usuários únicos por dia (últimos 7)
    const usuarios7d = dias7.map((d) => usuariosPorDia[d]?.size ?? 0);
    const mediaUsuariosDia = dias7.length > 0 ? Math.round(usuarios7d.reduce((a, b) => a + b, 0) / dias7.length) : 0;

    // Dias com atividade
    const diasComAtividade = Object.values(porDia).filter((v) => v > 0).length;

    return {
      porEvento,
      porDia,
      porHora,
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
      horaPico,
      maxHora,
      mediaAcessosDia,
      mediaUsuariosDia,
      diasComAtividade,
      pageviewsPorDia,
      usuariosPorDia,
    };
  }, [dados]);

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
        nome: p.autor_nome || "Anonimo",
        polo: p.autor_polo || "-",
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

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
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
                Metricas
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
                <h2 className="font-black text-[#0A3D52]">Area restrita</h2>
                <p className="text-[10px] uppercase tracking-widest text-[#0A3D52]/40 font-bold">
                  Metricas de uso do app
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
            Carregando metricas...
          </p>
        ) : (
          <div className="space-y-6">
            {/* Online agora */}
            <div className="bg-white rounded-xl border border-[#0A3D52]/10 px-4 py-2.5 shadow-sm flex items-center gap-2.5">
              <span className="relative flex w-2 h-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#27AE60] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#27AE60]" />
              </span>
              <p className="text-[11px] font-bold text-[#0A3D52]/60">
                <span className="font-black text-[#0A3D52]">{onlineCount}</span> online agora
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard
                icon={<Eye className="w-4 h-4" />}
                label="Acessos hoje"
                value={String(resumo.acessosHoje)}
                sub={`${resumo.mediaAcessosDia}/dia (7d)`}
              />
              <KPICard
                icon={<Users className="w-4 h-4" />}
                label="Usuarios hoje"
                value={String(resumo.usuariosHoje)}
                sub={`${resumo.mediaUsuariosDia}/dia (7d)`}
              />
              <KPICard
                icon={<Clock className="w-4 h-4" />}
                label="Pico de atividade"
                value={`${String(resumo.horaPico).padStart(2, "0")}h`}
                sub={`${resumo.maxHora} eventos`}
                accent
              />
              <KPICard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Usuarios unicos (30d)"
                value={String(resumo.usuariosUnicos)}
                sub={`${resumo.diasComAtividade} dias ativos`}
              />
            </div>

            {/* Segunda linha de KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard
                icon={<Activity className="w-4 h-4" />}
                label="Eventos (30d)"
                value={String(dados.length)}
                sub={`${Math.round(dados.length / Math.max(1, resumo.diasComAtividade))}/dia`}
              />
              <KPICard
                icon={<Zap className="w-4 h-4" />}
                label="Audios tocados"
                value={String(resumo.porEvento["audio_tocado"] ?? 0)}
                sub={`${resumo.porEvento["podcast_publicado"] ?? 0} podcasts`}
              />
              <KPICard
                icon={<BarChart3 className="w-4 h-4" />}
                label="Simulados"
                value={`${resumo.gerados}`}
                sub={`${resumo.taxaCorrecao}% corrigidos`}
              />
              <KPICard
                icon={<Database className="w-4 h-4" />}
                label="Materiais"
                value={String(pubs.length)}
                sub={storage ? `${formatarBytes(storage.totalBytes)} usado` : "..."}
              />
            </div>

            <p className="text-[9px] text-[#0A3D52]/30 font-medium text-center">
              Dados reais do Supabase. "Usuarios" = navegadores distintos. "Acessos" = pageviews.
            </p>

            {/* Grafico: Acessos por hora (24 barras) */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#D4941E]" /> Pico de atividade por hora
              </h3>
              <div className="flex items-end gap-1 h-32">
                {Array.from({ length: 24 }, (_, h) => {
                  const n = resumo.porHora[h] ?? 0;
                  const max = resumo.maxHora || 1;
                  const isPico = h === resumo.horaPico;
                  return (
                    <div key={h} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-[#F5F7FA] rounded-md flex items-end h-28 overflow-hidden">
                        <div
                          className={cn(
                            "w-full rounded-md transition-all",
                            isPico ? "bg-[#D4941E]" : n > 0 ? "bg-[#0A3D52]/20" : "bg-transparent",
                          )}
                          style={{
                            height: `${Math.max(n > 0 ? 4 : 0, Math.round((n / max) * 100))}%`,
                          }}
                          title={`${String(h).padStart(2, "0")}h: ${n} eventos`}
                        />
                      </div>
                      {h % 3 === 0 && (
                        <span className="text-[7px] font-bold text-[#0A3D52]/30">
                          {String(h).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-[#0A3D52]/30 mt-2 text-center">
                Barra laranja = pico. Mostra a hora com mais atividade nos ultimos 30 dias.
              </p>
            </div>

            {/* Grafico: Acessos por dia (ultimos 14 dias) */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-[#D4941E]" /> Acessos por dia (14 dias)
              </h3>
              <div className="flex items-end gap-1.5 h-32">
                {resumo.dias.map((d) => (
                  <DiaBar key={d} dia={d} valor={resumo.porDia[d] ?? 0} max={resumo.maxDia} />
                ))}
              </div>
            </div>

            {/* Grafico: Usuarios unicos por dia */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#D4941E]" /> Usuarios ativos por dia
              </h3>
              <div className="flex items-end gap-1.5 h-32">
                {resumo.dias.map((d) => {
                  const n = resumo.usuariosPorDia[d]?.size ?? 0;
                  const maxU = Math.max(1, ...resumo.dias.map((dd) => resumo.usuariosPorDia[dd]?.size ?? 0));
                  return (
                    <div key={d} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-[#F5F7FA] rounded-lg flex items-end h-28 overflow-hidden">
                        <div
                          className={cn("w-full rounded-lg", n > 0 ? "bg-[#2563EB]" : "bg-transparent")}
                          style={{
                            height: `${Math.max(n > 0 ? 6 : 0, Math.round((n / maxU) * 100))}%`,
                          }}
                          title={`${d}: ${n} usuarios`}
                        />
                      </div>
                      <span className="text-[8px] font-bold text-[#0A3D52]/40">{d.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-[#0A3D52]/30 mt-2 text-center">
                Usuarios distintos por navegador (sem login).
              </p>
            </div>

            {/* Por evento */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#D4941E]" /> Eventos por tipo (30d)
              </h3>
              <div className="space-y-2">
                {Object.entries(resumo.porEvento)
                  .sort((a, b) => b[1] - a[1])
                  .map(([ev, n]) => {
                    const max = Math.max(1, ...Object.values(resumo.porEvento));
                    return (
                      <div key={ev} className="flex items-center gap-3">
                        <span className="w-36 shrink-0 text-[10px] font-bold uppercase text-[#0A3D52]/60 truncate">
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
                    Sem eventos ainda - use o app para gerar dados.
                  </p>
                )}
              </div>
            </div>

            {/* Rotas mais usadas */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#D4941E]" /> Rotas mais acessadas
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
                {resumo.rotas.length === 0 && (
                  <p className="text-[10px] font-bold uppercase text-[#0A3D52]/30">
                    Sem dados de rotas.
                  </p>
                )}
              </div>
            </div>

            {/* Funil do simulado */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4">
                Funil do simulado
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-end gap-1 h-16">
                    <div
                      className="bg-[#0A3D52] rounded-t-md flex-1"
                      style={{ height: "100%" }}
                      title={`${resumo.gerados} gerados`}
                    />
                    <div
                      className="bg-[#D4941E] rounded-t-md flex-1"
                      style={{ height: `${resumo.gerados > 0 ? Math.round((resumo.corrigidos / resumo.gerados) * 100) : 0}%` }}
                      title={`${resumo.corrigidos} corrigidos`}
                    />
                  </div>
                  <div className="flex gap-1 mt-1">
                    <span className="flex-1 text-center text-[9px] font-bold text-[#0A3D52]/40">
                      {resumo.gerados} gerados
                    </span>
                    <span className="flex-1 text-center text-[9px] font-bold text-[#D4941E]">
                      {resumo.corrigidos} corrigidos
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-[#0A3D52]">{resumo.taxaCorrecao}%</p>
                  <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">taxa correcao</p>
                </div>
              </div>
            </div>

            {/* Quem contribui */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#D4941E]" /> Quem contribui
                {contribuidores.length > 0 && (
                  <span className="ml-auto text-[#D4941E]">
                    {contribuidores.length} pessoa{contribuidores.length !== 1 ? "s" : ""} -{" "}
                    {pubs.length} material{pubs.length !== 1 ? "is" : ""}
                  </span>
                )}
              </h3>
              {contribuidores.length === 0 ? (
                <p className="text-[10px] font-bold uppercase text-[#0A3D52]/30">
                  Ninguem publicou ainda.
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
                            c.audio > 0 ? `${c.audio} audios` : "",
                            c.video > 0 ? `${c.video} videos` : "",
                            c.pdf > 0 ? `${c.pdf} pdfs` : "",
                            c.imagem > 0 ? `${c.imagem} imgs` : "",
                            c.arquivo > 0 ? `${c.arquivo} arq` : "",
                            c.nota > 0 ? `${c.nota} notas` : "",
                          ]
                            .filter(Boolean)
                            .join(" . ") || "-"}
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

            {/* Armazenamento */}
            {storage && (
              <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-4 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-[#D4941E]" /> Armazenamento
                </h3>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-black font-mono">
                      {formatarBytes(storage.totalBytes)}
                    </p>
                    <p className="text-[10px] font-bold uppercase text-[#0A3D52]/40">
                      de {formatarBytes(COTA_BYTES)} - {storage.totalArquivos} arquivo
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
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <AppBottomNav />
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 shadow-sm",
        accent ? "bg-[#D4941E] text-white" : "bg-[#0A3D52] text-white",
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("opacity-60", accent ? "text-white" : "text-white/60")}>{icon}</div>
      </div>
      <p className="text-2xl font-black font-mono">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-50">{label}</p>
      {sub && <p className="text-[8px] font-bold mt-0.5 opacity-40">{sub}</p>}
    </div>
  );
}

function DiaBar({ dia, valor, max }: { dia: string; valor: number; max: number }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div className="w-full bg-[#F5F7FA] rounded-lg flex items-end h-28 overflow-hidden">
        <div
          className={cn("w-full rounded-lg", valor > 0 ? "bg-[#27AE60]" : "bg-transparent")}
          style={{ height: `${Math.max(valor > 0 ? 6 : 0, Math.round((valor / max) * 100))}%` }}
          title={`${dia}: ${valor}`}
        />
      </div>
      <span className="text-[8px] font-bold text-[#0A3D52]/40">{dia.slice(5)}</span>
    </div>
  );
}
