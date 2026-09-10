// src/components/PublicacaoCard.tsx
// Card unificado de publicação — renderiza conforme tipo (podcast | pdf | nota).
import { FileText, Flag, Headphones, MapPin, Trash2, User, Clapperboard, Image } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import type { Publicacao } from "@/lib/publicacoesService";
import { kindDaPublicacao } from "@/lib/publicacoesService";
import { SENHA_DEV as ADMIN_SENHA } from "@/lib/auth";
import { cn } from "@/lib/utils";

const WHATSAPP_DENUNCIA = "5521996235681";

interface Props {
  publicacao: Publicacao;
  disciplinaCor: string;
  disciplinaNome: string;
  ehAutor: boolean;
  aoExcluir: (p: Publicacao) => void;
  aoDenunciar: (p: Publicacao) => void;
}

export function PublicacaoCard({
  publicacao,
  disciplinaCor,
  disciplinaNome,
  ehAutor,
  aoExcluir,
  aoDenunciar,
}: Props) {
  const assunto = publicacao.titulo || publicacao.descricao || "Sem título";
  const kind = kindDaPublicacao(publicacao);
  const rotuloTipo =
    publicacao.tipo === "podcast"
      ? "Podcast"
      : publicacao.tipo === "pdf"
        ? "PDF"
        : kind === "video"
          ? "Vídeo"
          : kind === "imagem"
            ? "Imagem"
            : kind === "arquivo"
              ? "Arquivo"
              : "Nota";

  const handleDenunciar = () => {
    const msg = encodeURIComponent(
      `Denúncia no Rota da Formatura:\n` +
        `Publicação: ${assunto}\n` +
        `Tipo: ${publicacao.tipo}\n` +
        `Autor: ${publicacao.autor_nome} (${publicacao.autor_polo})\n` +
        `Motivo: [descreva o problema]`,
    );
    window.open(`https://wa.me/${WHATSAPP_DENUNCIA}?text=${msg}`, "_blank");
    aoDenunciar(publicacao);
  };

  const handleExcluir = () => {
    if (ehAutor) {
      if (window.confirm("Tem certeza que deseja excluir esta publicação?")) {
        aoExcluir(publicacao);
      }
    } else {
      const senha = window.prompt("Digite a senha de administrador para excluir:");
      if (senha === ADMIN_SENHA) {
        aoExcluir(publicacao);
      } else if (senha !== null) {
        window.alert("Senha incorreta.");
      }
    }
  };

  const cabecalho = (
    <div className="flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
        style={{ background: disciplinaCor }}
      >
        {publicacao.tipo === "podcast" ? (
          <Headphones className="w-5 h-5" />
        ) : publicacao.tipo === "pdf" ? (
          <FileText className="w-5 h-5" />
        ) : kind === "video" ? (
          <Clapperboard className="w-5 h-5" />
        ) : kind === "imagem" ? (
          <Image className="w-5 h-5" />
        ) : (
          <FileText className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ color: disciplinaCor, background: `${disciplinaCor}15` }}
          >
            {disciplinaNome}
          </span>
          <span
            className={cn(
              "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
              publicacao.tipo === "podcast" && "bg-[#2563EB]/10 text-[#2563EB]",
              publicacao.tipo === "pdf" && "bg-[#E74C3C]/10 text-[#E74C3C]",
              publicacao.tipo === "nota" && "bg-[#27AE60]/10 text-[#27AE60]",
            )}
          >
            {rotuloTipo}
          </span>
          {publicacao.etapa && publicacao.etapa !== "Geral" && (
            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#D4941E]/15 text-[#D4941E]">
              {publicacao.etapa}
            </span>
          )}
        </div>
        <h4 className="font-bold text-sm leading-tight mt-1">{assunto}</h4>
        {publicacao.descricao && publicacao.tipo !== "podcast" && (
          <p className="text-[10px] text-[#0A3D52]/50 font-medium line-clamp-2 mt-0.5">
            {publicacao.descricao}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleExcluir}
          className={cn(
            "transition-colors p-1 cursor-pointer",
            ehAutor
              ? "text-[#0A3D52]/25 hover:text-[#E74C3C]"
              : "text-[#0A3D52]/25 hover:text-[#E74C3C]",
          )}
          aria-label={ehAutor ? "Excluir publicação" : "Excluir (requer senha)"}
          title={ehAutor ? "Excluir" : "Excluir (requer senha admin)"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {!ehAutor && (
          <button
            onClick={handleDenunciar}
            className="text-[#0A3D52]/20 hover:text-[#E74C3C] transition-colors p-1 cursor-pointer"
            aria-label="Denunciar publicação"
            title="Denunciar via WhatsApp"
          >
            <Flag className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  const autor = (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#0A3D52]/5">
      <div className="w-6 h-6 rounded-full bg-[#0A3D52]/10 flex items-center justify-center">
        <User className="w-3 h-3 text-[#0A3D52]/50" />
      </div>
      <span className="text-[10px] font-bold text-[#0A3D52]/60">{publicacao.autor_nome}</span>
      <span className="text-[9px] font-bold text-[#0A3D52]/30 flex items-center gap-0.5">
        <MapPin className="w-2.5 h-2.5" /> {publicacao.autor_polo}
      </span>
      <span className="text-[9px] text-[#0A3D52]/30 ml-auto">
        {new Date(publicacao.criado_em).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 shadow-sm hover:border-[#D4941E]/30 transition-all">
      {cabecalho}

      {/* Conteúdo por tipo */}
      {publicacao.tipo === "podcast" && publicacao.url && (
        <div className="mt-3">
          <AudioPlayer url={publicacao.url} cor={disciplinaCor} />
        </div>
      )}

      {publicacao.tipo === "pdf" && publicacao.url && (
        <div className="mt-3">
          <a
            href={publicacao.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#F5F7FA] rounded-xl p-3 border border-[#0A3D52]/5 hover:border-[#E74C3C]/40 transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-[#E74C3C]/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[#E74C3C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{publicacao.titulo}</p>
              <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Abrir PDF</p>
            </div>
          </a>
        </div>
      )}

      {publicacao.tipo === "nota" && publicacao.conteudo && (
        <div className="mt-3 bg-[#F5F7FA] rounded-xl p-3 border border-[#0A3D52]/5 whitespace-pre-wrap">
          <p className="text-sm text-[#0A3D52]/80 leading-relaxed">{publicacao.conteudo}</p>
        </div>
      )}

      {/* Anexo de nota (vídeo, imagem ou arquivo enviado pela central de materiais) */}
      {publicacao.tipo === "nota" && publicacao.url && (
        <NotaAnexo url={publicacao.url} titulo={publicacao.titulo} />
      )}

      {autor}
    </div>
  );
}

function NotaAnexo({ url, titulo }: { url: string; titulo: string }) {
  const kind = kindDaPublicacao({
    tipo: "nota",
    url,
    tags: [],
  } as unknown as Publicacao);
  if (kind === "video") {
    return (
      <div className="mt-3">
        <video src={url} controls playsInline preload="metadata" className="w-full rounded-xl bg-black aspect-video" />
      </div>
    );
  }
  if (kind === "imagem") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-3">
        <img
          src={url}
          alt={titulo}
          loading="lazy"
          className="w-full rounded-xl max-h-72 object-cover bg-[#F5F7FA]"
        />
      </a>
    );
  }
  const Icon = kind === "audio" ? Headphones : kind === "video" ? Clapperboard : FileText;
  return (
    <div className="mt-3">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-[#F5F7FA] rounded-xl p-3 border border-[#0A3D52]/5 hover:border-[#D4941E]/40 transition-all"
      >
        <div className="w-9 h-9 rounded-lg bg-[#D4941E]/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#D4941E]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{titulo || "Anexo"}</p>
          <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Abrir anexo</p>
        </div>
      </a>
    </div>
  );
}
