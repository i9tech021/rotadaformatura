// src/components/DisciplinaMateriais.tsx
// Materiais da disciplina: combina materiais curados (materials.ts) com
// publicações da Comunidade (Supabase/localStorage) para a disciplina.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Plus, ExternalLink, BookOpen, Headphones } from "lucide-react";
import { PublicacaoCard } from "./PublicacaoCard";
import {
  denunciarPublicacao,
  ETAPAS,
  excluirPublicacao,
  getIdentidade,
  listPublicacoes,
  subscribePublicacoes,
  type EtapaPublicacao,
  type Publicacao,
  type TipoPublicacao,
} from "@/lib/publicacoesService";
import { MATERIALS, type Material } from "@/data/materials";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  disciplinaId: string;
}

type FiltroTipo = TipoPublicacao | "todos" | "curados";
type FiltroEtapa = EtapaPublicacao | "todas";

export function DisciplinaMateriais({ disciplinaId }: Props) {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroEtapa, setFiltroEtapa] = useState<FiltroEtapa>("todas");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const identidade = useMemo(() => getIdentidade(), []);

  // Materiais curados para esta disciplina
  const materiaisCurados = useMemo(
    () => MATERIALS.filter((m) => m.disciplineId === disciplinaId),
    [disciplinaId],
  );

  const recarregar = useCallback(async () => {
    const lista = await listPublicacoes(disciplinaId);
    setPublicacoes(lista);
    setCarregando(false);
  }, [disciplinaId]);

  useEffect(() => {
    setCarregando(true);
    recarregar();
    return subscribePublicacoes(recarregar);
  }, [recarregar]);

  // Publicações filtradas
  const pubFiltradas = useMemo(() => {
    let lista = publicacoes;
    if (filtroTipo !== "todos" && filtroTipo !== "curados") lista = lista.filter((p) => p.tipo === filtroTipo);
    if (filtroEtapa !== "todas") lista = lista.filter((p) => (p.etapa ?? "Geral") === filtroEtapa);
    return lista;
  }, [publicacoes, filtroTipo, filtroEtapa]);

  // Materiais curados filtrados por tipo
  const curadosFiltrados = useMemo(() => {
    if (filtroTipo !== "todos" && filtroTipo !== "curados") return [];
    return materiaisCurados;
  }, [materiaisCurados, filtroTipo]);

  const etapasComConteudo = useMemo(
    () => ETAPAS.filter((et) => publicacoes.some((p) => (p.etapa ?? "Geral") === et)),
    [publicacoes],
  );

  const totalMateriais = curadosFiltrados.length + (filtroTipo === "curados" ? 0 : pubFiltradas.length);

  const handleExcluir = async (p: Publicacao) => {
    const r = await excluirPublicacao(p);
    if (!r.ok) {
      toast.error(r.error || "Nao foi possivel excluir.");
      return;
    }
    toast.success("Publicacao excluida.");
    recarregar();
  };

  const handleDenunciar = async (p: Publicacao) => {
    const r = await denunciarPublicacao(p.id);
    if (r.ok) toast.success("Denuncia registrada. Obrigado!");
  };

  const getTypeIcon = (type: Material["type"]) => {
    switch (type) {
      case "pdf": return "📄";
      case "doc": return "📝";
      case "link": return "🔗";
      case "image": return "🖼️";
      default: return "📄";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#D4941E]" /> Materiais
          {totalMateriais > 0 && (
            <span className="text-[10px] font-black text-[#D4941E] bg-[#D4941E]/10 px-2 py-0.5 rounded-full">
              {totalMateriais}
            </span>
          )}
        </h3>
        <Link
          to="/publicacoes"
          className="inline-flex items-center gap-1.5 text-[#D4941E] hover:underline text-[10px] font-black uppercase tracking-widest"
        >
          <Plus className="w-3.5 h-3.5" /> Publicar
        </Link>
      </div>

      {/* Filtro por tipo */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(
          [
            { v: "todos", l: "Todos" },
            { v: "curados", l: "📚 Oficiais" },
            { v: "pdf", l: "📄 PDFs" },
            { v: "podcast", l: "🎧 Podcasts" },
            { v: "nota", l: "📝 Notas" },
          ] as const
        ).map((t) => (
          <button
            key={t.v}
            onClick={() => setFiltroTipo(t.v)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shrink-0 border cursor-pointer",
              filtroTipo === t.v
                ? "bg-[#0A3D52] text-white border-[#0A3D52]"
                : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10",
            )}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Abas por etapa (só quando tem publicações) */}
      {etapasComConteudo.length > 0 && filtroTipo !== "curados" && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(["todas", ...ETAPAS] as const).map((et) => (
            <button
              key={et}
              onClick={() => setFiltroEtapa(et)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shrink-0 border cursor-pointer",
                filtroEtapa === et
                  ? "bg-[#D4941E] text-[#0A3D52] border-[#D4941E]"
                  : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10 hover:border-[#D4941E]/30",
              )}
            >
              {et === "todas" ? `Todas (${publicacoes.length})` : et}
            </button>
          ))}
        </div>
      )}

      {carregando ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 animate-pulse"
            >
              <div className="h-3 bg-[#0A3D52]/10 rounded w-1/3 mb-2" />
              <div className="h-3 bg-[#0A3D52]/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : totalMateriais === 0 ? (
        <div className="bg-[#F5F7FA] p-8 rounded-3xl border border-dashed border-[#0A3D52]/10 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-[#0A3D52]/20" />
          <p className="font-bold text-xs uppercase tracking-widest text-[#0A3D52]/40">
            Nenhum material disponivel
          </p>
          <p className="text-sm text-[#0A3D52]/50 mt-1 font-medium">
            Seja a primeira pessoa a compartilhar.
          </p>
          <Link
            to="/publicacoes"
            className="inline-block mt-4 bg-[#D4941E] text-[#0A3D52] px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]"
          >
            Publicar material
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Materiais Curados (oficiais) */}
          {curadosFiltrados.map((material) => (
            <a
              key={material.id}
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-2xl border border-[#0A3D52]/10 p-4 hover:border-[#D4941E]/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4941E]/10 flex items-center justify-center text-lg shrink-0">
                  {getTypeIcon(material.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#0A3D52]/5 text-[#0A3D52]/50">
                      Oficial
                    </span>
                    <span className="text-[9px] font-bold uppercase text-[#0A3D52]/30">
                      {material.type}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#0A3D52] group-hover:text-[#D4941E] transition-colors leading-tight">
                    {material.title}
                  </h4>
                </div>
                <ExternalLink className="w-4 h-4 text-[#0A3D52]/20 group-hover:text-[#D4941E] shrink-0 mt-1 transition-colors" />
              </div>
            </a>
          ))}

          {/* Publicações da Comunidade */}
          {pubFiltradas.map((p) => (
            <PublicacaoCard
              key={p.id}
              publicacao={p}
              disciplinaCor="#0A3D52"
              disciplinaNome={p.etapa && p.etapa !== "Geral" ? p.etapa : "Turma"}
              ehAutor={!!identidade && p.autor_local_id === identidade.autorLocalId}
              aoExcluir={handleExcluir}
              aoDenunciar={handleDenunciar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
