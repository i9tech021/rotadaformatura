// src/lib/armazenamento.ts
// Uso do Storage do Supabase: soma o tamanho real dos arquivos por bucket.
// Sem tabela extra — lê direto do Storage (listagem respeita as policies).
import { getSupabase } from "./supabase";

/** Cota do plano gratuito (ajuste se o plano mudar). */
export const COTA_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB

const BUCKETS = ["podcasts", "publicacoes", "provas"];

export interface UsoBucket {
  bucket: string;
  bytes: number;
  arquivos: number;
  porPasta: Record<string, { bytes: number; arquivos: number }>;
}

export interface UsoStorage {
  totalBytes: number;
  totalArquivos: number;
  buckets: UsoBucket[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClienteStorage = any;

async function listarTudo(
  sb: ClienteStorage,
  bucket: string,
  pasta: string,
  acc: { bytes: number; arquivos: number; porPasta: Record<string, { bytes: number; arquivos: number }> },
  raiz: string,
): Promise<void> {
  const { data, error } = await sb.storage.from(bucket).list(pasta || undefined, { limit: 1000 });
  if (error || !data) return;
  for (const item of data) {
    const nome = item?.name;
    if (!nome || nome === ".emptyFolderPlaceholder") continue;
    // pasta = entrada sem id e sem metadados
    if (!item?.id && !item?.metadata) {
      const sub = pasta ? `${pasta}/${nome}` : nome;
      await listarTudo(sb, bucket, sub, acc, raiz);
      continue;
    }
    const tamanho = Number(item?.metadata?.size ?? 0);
    acc.bytes += tamanho;
    acc.arquivos += 1;
    const chave = pasta || "raiz";
    if (!acc.porPasta[chave]) acc.porPasta[chave] = { bytes: 0, arquivos: 0 };
    acc.porPasta[chave].bytes += tamanho;
    acc.porPasta[chave].arquivos += 1;
  }
}

/** Soma o uso dos buckets conhecidos. Nunca lança exceção. */
export async function getUsoStorage(): Promise<UsoStorage> {
  const vazio: UsoStorage = { totalBytes: 0, totalArquivos: 0, buckets: [] };
  try {
    const sb = getSupabase();
    if (!sb) return vazio;
    const buckets: UsoBucket[] = [];
    for (const bucket of BUCKETS) {
      const acc = { bytes: 0, arquivos: 0, porPasta: {} as Record<string, { bytes: number; arquivos: number }> };
      try {
        await listarTudo(sb, bucket, "", acc, bucket);
      } catch {
        continue; // bucket inexistente ou sem acesso: pula
      }
      if (acc.arquivos > 0) {
        buckets.push({ bucket, bytes: acc.bytes, arquivos: acc.arquivos, porPasta: acc.porPasta });
      }
    }
    return {
      totalBytes: buckets.reduce((s, b) => s + b.bytes, 0),
      totalArquivos: buckets.reduce((s, b) => s + b.arquivos, 0),
      buckets,
    };
  } catch {
    return vazio;
  }
}

/** 1.5 GB, 800 MB, 950 KB... */
export function formatarBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const unidades = ["B", "KB", "MB", "GB"];
  const i = Math.min(unidades.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const valor = bytes / Math.pow(1024, i);
  return `${valor >= 100 ? Math.round(valor) : valor.toFixed(valor >= 10 ? 0 : 1)} ${unidades[i]}`;
}
