// src/lib/audioLeve.ts
// "Modo leve": converte áudios longos para Opus 24kbps mono (.webm) antes de
// enviar — voz com ótima qualidade e ~4x menos tamanho (40MB vira ~11MB).
// REGRA DE OURO: qualquer falha retorna null e o app envia o ORIGINAL.
// Nada aqui pode quebrar upload.
import { createFile as mp4boxCreateFile } from "mp4box";
import { Muxer, ArrayBufferTarget } from "webm-muxer";

export interface AudioOtimizado {
  blob: Blob;
  nome: string;
  mime: string;
  segundos: number;
  economiaPct: number;
}

type CodecLeve = "opus" | "mp4a";

let probeCache: CodecLeve | null | undefined = undefined;

/** Codec disponível neste aparelho (opus = Chrome/Android; mp4a = Safari). */
async function codecSuportado(): Promise<CodecLeve | null> {
  if (probeCache !== undefined) return probeCache;
  try {
    const w = window as unknown as Record<string, unknown>;
    if (typeof w["AudioEncoder"] === "undefined" || typeof w["AudioDecoder"] === "undefined") {
      probeCache = null;
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AE = w["AudioEncoder"] as any;
    const audio = document.createElement("audio");
    // 1) Opus (melhor custo-benefício)
    try {
      const sup = await AE.isConfigSupported({
        codec: "opus",
        sampleRate: 24000,
        numberOfChannels: 1,
        bitrate: 24000,
      });
      if (sup?.supported && audio.canPlayType('audio/webm;codecs="opus"') !== "") {
        probeCache = "opus";
        return "opus";
      }
    } catch {
      // tenta o próximo
    }
    // 2) AAC (Safari/iPhone) — empacota em ADTS, toca em tudo
    try {
      const sup = await AE.isConfigSupported({
        codec: "mp4a.40.2",
        sampleRate: 24000,
        numberOfChannels: 1,
        bitrate: 32000,
      });
      const toca =
        audio.canPlayType("audio/aac") !== "" ||
        audio.canPlayType('audio/mp4; codecs="mp4a.40.2"') !== "";
      if (sup?.supported && toca) {
        probeCache = "mp4a";
        return "mp4a";
      }
    } catch {
      // sem suporte
    }
    probeCache = null;
    return null;
  } catch {
    probeCache = null;
    return null;
  }
}

/** Este aparelho consegue otimizar? (WebCodecs + reprodução do formato) */
export async function suportaOtimizacao(): Promise<boolean> {
  return (await codecSuportado()) !== null;
}

// ---------- utilidades ----------

function paraMono(planos: Float32Array[]): Float32Array {
  if (planos.length === 1) return planos[0]!;
  const n = planos[0]!.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (const p of planos) s += p[i] ?? 0;
    out[i] = s / planos.length;
  }
  return out;
}

/** Reamostrador linear com estado (funciona por pedaços). */
class Reamostrador {
  private ultimo = 0;
  private temUltimo = false;
  private pos = 0; // posição fracionária no fluxo de entrada
  constructor(
    private de: number,
    private para = 24000,
  ) {}

  push(mono: Float32Array): Float32Array {
    const razao = this.de / this.para;
    const buf: number[] = [];
    let i = Math.floor(this.pos);
    let frac = this.pos - i;
    const amostra = (k: number): number => {
      if (k < 0) return this.temUltimo ? this.ultimo : (mono[0] ?? 0);
      if (k >= mono.length) return mono[mono.length - 1] ?? 0;
      return mono[k] ?? 0;
    };
    while (true) {
      const k = Math.floor(this.pos);
      const f = this.pos - k;
      if (k >= mono.length) break;
      buf.push(amostra(k) * (1 - f) + amostra(k + 1) * f);
      this.pos += razao;
      void i;
      void frac;
    }
    if (mono.length > 0) {
      this.ultimo = mono[mono.length - 1] ?? 0;
      this.temUltimo = true;
    }
    this.pos -= mono.length;
    return Float32Array.from(buf);
  }
}

function audioDataParaMono(ad: AudioData): { mono: Float32Array; taxa: number } {
  const canais = ad.numberOfChannels;
  const quadros = ad.numberOfFrames;
  const planos: Float32Array[] = [];
  for (let c = 0; c < canais; c++) {
    const buf = new Float32Array(ad.allocationSize({ planeIndex: c, format: "f32-planar" }));
    ad.copyTo(buf, { planeIndex: c, format: "f32-planar" });
    planos.push(buf.subarray(0, quadros));
  }
  return { mono: paraMono(planos), taxa: ad.sampleRate };
}

// ---------- entrada: WAV ----------

interface PacotePCM {
  mono: Float32Array;
  taxa: number;
}

function parseWav(buf: ArrayBuffer): PacotePCM | null {
  try {
    const v = new DataView(buf);
    const txt = (o: number, n: number) => String.fromCharCode(...new Uint8Array(buf, o, n));
    if (txt(0, 4) !== "RIFF" || txt(8, 4) !== "WAVE") return null;
    let fmtAudio = 0,
      canais = 0,
      taxa = 0,
      bits = 0;
    let dadosIni = 0,
      dadosFim = 0;
    let off = 12;
    while (off + 8 <= v.byteLength) {
      const id = txt(off, 4);
      const tam = v.getUint32(off + 4, true);
      if (id === "fmt ") {
        fmtAudio = v.getUint16(off + 8, true);
        canais = v.getUint16(off + 10, true);
        taxa = v.getUint32(off + 12, true);
        bits = v.getUint16(off + 22, true);
      } else if (id === "data") {
        dadosIni = off + 8;
        dadosFim = Math.min(v.byteLength, off + 8 + tam);
      }
      off += 8 + tam + (tam % 2);
    }
    if (!dadosIni || !taxa || !canais) return null;
    const bytesAmostra = bits / 8;
    const n = Math.floor((dadosFim - dadosIni) / bytesAmostra / canais);
    if (n <= 0 || n > 200_000_000) return null;
    const planos: Float32Array[] = [];
    for (let c = 0; c < canais; c++) planos.push(new Float32Array(n));
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < canais; c++) {
        const p = dadosIni + (i * canais + c) * bytesAmostra;
        let s = 0;
        if (fmtAudio === 1 && bits === 16) s = v.getInt16(p, true) / 32768;
        else if (fmtAudio === 1 && bits === 8) s = (v.getUint8(p) - 128) / 128;
        else if (fmtAudio === 3 && bits === 32) s = v.getFloat32(p, true);
        else if (fmtAudio === 1 && bits === 24) {
          const b = v.getUint8(p) | (v.getUint8(p + 1) << 8) | (v.getUint8(p + 2) << 16);
          s = (b & 0x800000 ? b - 0x1000000 : b) / 8388608;
        } else return null;
        planos[c]![i] = s;
      }
    }
    return { mono: paraMono(planos), taxa };
  } catch {
    return null;
  }
}

// ---------- entrada: MP3 (fatia por frames) ----------

const MP3_TAXAS = [44100, 48000, 32000, 22050, 24000, 16000, 11025, 12000, 8000];
const MP3_BITS = [
  [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
];

interface QuadroMP3 {
  dados: Uint8Array;
  taxa: number;
  amostras: number;
}

function fatiarMP3(bytes: Uint8Array): QuadroMP3[] | null {
  const quadros: QuadroMP3[] = [];
  let i = 0;
  // pula ID3v2
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const t =
      ((bytes[6] ?? 0) << 21) | ((bytes[7] ?? 0) << 14) | ((bytes[8] ?? 0) << 7) | (bytes[9] ?? 0);
    i = 10 + t;
  }
  let taxaRef = 0;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff || ((bytes[i + 1] ?? 0) & 0xe0) !== 0xe0) {
      i++;
      continue;
    }
    const ver = (bytes[i + 1]! >> 3) & 3;
    const camada = (bytes[i + 1]! >> 1) & 3;
    const idxB = (bytes[i + 2]! >> 4) & 15;
    const idxT = (bytes[i + 2]! >> 2) & 3;
    const pad = (bytes[i + 2]! >> 1) & 1;
    if (camada !== 1 || idxB === 0 || idxB === 15 || ver === 1) {
      i++;
      continue;
    }
    const mpeg1 = ver === 3;
    const taxa = MP3_TAXAS[(mpeg1 ? 0 : ver === 2 ? 3 : 6) + idxT] ?? 0;
    const bitrate = (MP3_BITS[mpeg1 ? 0 : 1] ?? [])[idxB] ?? 0;
    if (!taxa || !bitrate) {
      i++;
      continue;
    }
    const comp = mpeg1 ? 144 : 72;
    const tam = Math.floor((comp * bitrate * 1000) / taxa) + pad;
    if (tam <= 4 || i + tam > bytes.length) {
      i++;
      continue;
    }
    // valida o próximo sync antes de aceitar
    const j = i + tam;
    if (j + 1 < bytes.length && !(bytes[j] === 0xff && ((bytes[j + 1] ?? 0) & 0xe0) === 0xe0)) {
      // tolera 1 falha (pode ser tag no meio)
      if (quadros.length > 0) break;
      i++;
      continue;
    }
    taxaRef = taxa;
    quadros.push({
      dados: bytes.slice(i, i + tam),
      taxa,
      amostras: mpeg1 ? 1152 : 576,
    });
    i += tam;
    if (quadros.length > 200_000) break;
  }
  if (quadros.length < 10 || !taxaRef) return null;
  return quadros;
}

// ---------- entrada: M4A/MP4 (mp4box) ----------

interface AmostraAAC {
  dados: Uint8Array;
  ts: number;
  dur: number;
  chave: boolean;
}

async function extrairAAC(
  file: File,
): Promise<{ amostras: AmostraAAC[]; codec: string; taxa: number; canais: number; asc: Uint8Array } | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const box: any = mp4boxCreateFile();
    const pronto = new Promise<unknown>((res, rej) => {
      box.onReady = res;
      box.onError = rej;
    });
    const ab = await file.arrayBuffer();
    (ab as unknown as Record<string, number>).fileStart = 0;
    box.appendBuffer(ab);
    const info = (await pronto) as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      audioTracks?: any[];
    };
    const track = info.audioTracks?.[0];
    if (!track || !String(track.codec ?? "").startsWith("mp4a")) return null;
    // AudioSpecificConfig (descrição p/ o decodificador)
    let asc: Uint8Array | null = null;
    try {
      const trak = box.getTrackById(track.id);
      const entry = trak?.mdia?.minf?.stbl?.stsd?.entries?.[0];
      const candidatos: unknown[] = [entry?.esds?.esd, ...(entry?.esds?.esd?.descs ?? [])];
      for (const c of candidatos) {
        const rec = c as { data?: unknown; descs?: unknown[] };
        if (rec?.data instanceof Uint8Array && rec.data.length > 0 && rec.data.length < 100) {
          asc = rec.data;
          break;
        }
        for (const sub of rec?.descs ?? []) {
          const s = sub as { data?: unknown };
          if (s?.data instanceof Uint8Array && s.data.length > 0 && s.data.length < 100) {
            asc = s.data;
            break;
          }
        }
        if (asc) break;
      }
    } catch {
      asc = null;
    }
    if (!asc) return null;
    const taxa: number = track.audio?.sample_rate ?? 44100;
    const canais: number = track.audio?.channel_count ?? 2;
    const escala: number = track.timescale ?? taxa;
    const total: number = track.nb_samples ?? 0;
    const amostras: AmostraAAC[] = [];
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => resolve(), 20000);
      box.onSamples = (_id: unknown, _u: unknown, samps: Array<Record<string, unknown>>) => {
        for (const s of samps) {
          const dados = s["data"] as Uint8Array | undefined;
          if (!dados) continue;
          amostras.push({
            dados,
            ts: (Number(s["dts"] ?? 0) / escala) * 1e6,
            dur: (Number(s["duration"] ?? 0) / escala) * 1e6,
            chave: Boolean(s["is_sync"]),
          });
        }
        if (total > 0 && amostras.length >= total) {
          clearTimeout(timer);
          resolve();
        }
      };
      box.setExtractionOptions(track.id, null, { nbSamples: 1000 });
      box.start();
      box.flush();
      if (!total) setTimeout(() => resolve(), 3000);
    });
    try {
      box.stop();
    } catch {
      // ignora
    }
    if (amostras.length === 0) return null;
    return { amostras, codec: String(track.codec), taxa, canais, asc };
  } catch {
    return null;
  }
}

// ---------- saída: ADTS (AAC puro, sem dependência; toca em tudo) ----------

// sampling_frequency_index para 24000 Hz = 6
function quadroADTS(aac: Uint8Array, canais = 1): Uint8Array {
  const len = aac.length + 7;
  const out = new Uint8Array(len);
  out[0] = 0xff;
  out[1] = 0xf1; // MPEG-4, sem CRC
  out[2] = (1 << 6) | (6 << 2) | ((canais >> 2) & 1); // AAC-LC, 24kHz
  out[3] = ((canais & 3) << 6) | ((len >> 11) & 3);
  out[4] = (len >> 3) & 0xff;
  out[5] = ((len & 7) << 5) | 0x1f;
  out[6] = 0xfc;
  out.set(aac, 7);
  return out;
}

// ---------- pipeline principal ----------

export async function otimizarAudio(
  file: File,
  aoProgredir?: (fase: string, pct: number) => void,
): Promise<AudioOtimizado | null> {
  try {
    const codec = await codecSuportado();
    if (!codec) return null;
    if (file.size < 3 * 1024 * 1024) return null; // pequeno: não vale a pena
    const nomeBase = file.name.replace(/\.[^.]+$/, "");
    const ext = (file.name.split(".").pop() || "").toLowerCase();

    aoProgredir?.("lendo", 5);
    type Entrada =
      | { kind: "pcm"; mono: Float32Array; taxa: number }
      | { kind: "mp3"; quadros: QuadroMP3[] }
      | { kind: "aac"; pac: NonNullable<Awaited<ReturnType<typeof extrairAAC>>> };
    let entrada: Entrada | null = null;

    if (ext === "wav") {
      const pcm = parseWav(await file.arrayBuffer());
      if (!pcm) return null;
      entrada = { kind: "pcm", mono: pcm.mono, taxa: pcm.taxa };
    } else if (ext === "mp3") {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const quadros = fatiarMP3(bytes);
      if (!quadros) return null;
      entrada = { kind: "mp3", quadros };
    } else if (["m4a", "mp4", "aac"].includes(ext)) {
      const pac = await extrairAAC(file);
      if (!pac) return null;
      entrada = { kind: "aac", pac };
    } else {
      return null; // ogg/opus/webm já são leves
    }

    // ---- decodifica (ou usa PCM direto) ----
    aoProgredir?.("decodificando", 20);
    const ream = new Reamostrador(entrada.kind === "pcm" ? entrada.taxa : 0);
    const blocos24k: Float32Array[] = [];
    let quadros24k = 0;

    const empurrarMono = (mono: Float32Array, taxa: number) => {
      if (ream.de !== taxa) {
        // (re)cria reamostrador preservando estado simples
        (ream as { de: number }).de = taxa;
        ream.pos = 0;
        ream.temUltimo = false;
      }
      const out = ream.push(mono);
      if (out.length > 0) {
        blocos24k.push(out);
        quadros24k += out.length;
      }
    };

    if (entrada.kind === "pcm") {
      // fatia para não travar a UI
      const CH = 44100 * 30;
      for (let o = 0; o < entrada.mono.length; o += CH) {
        empurrarMono(entrada.mono.subarray(o, o + CH), entrada.taxa);
        aoProgredir?.("decodificando", 20 + Math.round((o / entrada.mono.length) * 30));
        await new Promise((r) => setTimeout(r, 0));
      }
    } else {
      const cfg =
        entrada.kind === "mp3"
          ? { codec: "mp3" }
          : {
              codec: entrada.pac.codec,
              sampleRate: entrada.pac.taxa,
              numberOfChannels: entrada.pac.canais,
              description: entrada.pac.asc,
            };
      const dec = new AudioDecoder({
        output: (ad: AudioData) => {
          try {
            const { mono, taxa } = audioDataParaMono(ad);
            empurrarMono(mono, taxa);
          } finally {
            ad.close();
          }
        },
        error: () => {
          throw new Error("decode");
        },
      });
      dec.configure(cfg);
      if (entrada.kind === "mp3") {
        let ts = 0;
        const total = entrada.quadros.length;
        for (let i = 0; i < total; i++) {
          const q = entrada.quadros[i]!;
          const dur = (q.amostras / q.taxa) * 1e6;
          dec.decode(new EncodedAudioChunk({ type: "key", timestamp: ts, duration: dur, data: q.dados }));
          ts += dur;
          if (i % 500 === 0) {
            aoProgredir?.("decodificando", 20 + Math.round((i / total) * 30));
            await new Promise((r) => setTimeout(r, 0));
          }
        }
      } else {
        const total = entrada.pac.amostras.length;
        for (let i = 0; i < total; i++) {
          const s = entrada.pac.amostras[i]!;
          dec.decode(
            new EncodedAudioChunk({ type: s.chave ? "key" : "delta", timestamp: s.ts, duration: s.dur, data: s.dados }),
          );
          if (i % 500 === 0) {
            aoProgredir?.("decodificando", 20 + Math.round((i / total) * 30));
            await new Promise((r) => setTimeout(r, 0));
          }
        }
      }
      await dec.flush();
      dec.close();
    }

    if (quadros24k < 24000) return null; // menos de 1s: não vale

    // ---- codifica (Opus 24kbps ou AAC 32kbps, mono 24kHz) ----
    aoProgredir?.("comprimindo", 55);
    const ehOpus = codec === "opus";
    const muxer = ehOpus
      ? new Muxer({
          target: new ArrayBufferTarget(),
          audio: { codec: "O", sampleRate: 24000, numberOfChannels: 1 },
        })
      : null;
    const quadrosAAC: Uint8Array[] = [];
    const enc = new AudioEncoder({
      output: (chunk, meta) => {
        if (muxer) {
          muxer.addAudioChunk(chunk, meta);
        } else {
          // AAC cru -> empacota em ADTS
          const buf = new Uint8Array(chunk.byteLength);
          chunk.copyTo(buf);
          quadrosAAC.push(quadroADTS(buf, 1));
        }
      },
      error: () => {
        throw new Error("encode");
      },
    });
    enc.configure(
      ehOpus
        ? { codec: "opus", sampleRate: 24000, numberOfChannels: 1, bitrate: 24000 }
        : { codec: "mp4a.40.2", sampleRate: 24000, numberOfChannels: 1, bitrate: 32000 },
    );
    const TAM = ehOpus ? 5760 : 1024; // AAC exige múltiplos de 1024
    let tsOut = 0;
    // concatena blocos
    let resto = new Float32Array(0);
    const fonte = [...blocos24k];
    let processados = 0;
    const totalBlocos = fonte.length;
    const enviaFatia = (fatia: Float32Array) => {
      const ad = new AudioData({
        format: "f32-planar",
        sampleRate: 24000,
        numberOfFrames: fatia.length,
        timestamp: tsOut,
        data: fatia,
      });
      tsOut += (fatia.length / 24000) * 1e6;
      enc.encode(ad);
      ad.close();
    };
    while (fonte.length > 0 || resto.length >= TAM) {
      while (resto.length < TAM && fonte.length > 0) {
        const b = fonte.shift()!;
        const jun = new Float32Array(resto.length + b.length);
        jun.set(resto);
        jun.set(b, resto.length);
        resto = jun;
      }
      if (resto.length < TAM) break;
      enviaFatia(resto.slice(0, TAM));
      resto = resto.slice(TAM);
      processados++;
      if (processados % 20 === 0) {
        aoProgredir?.("comprimindo", 55 + Math.round((processados / Math.max(1, totalBlocos)) * 30));
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    if (resto.length > 0) {
      if (ehOpus) {
        enviaFatia(resto);
      } else {
        // completa o último quadro AAC com silêncio
        const cheio = new Float32Array(TAM);
        cheio.set(resto);
        enviaFatia(cheio);
      }
    }
    await enc.flush();
    enc.close();
    let blob: Blob;
    let extensao: string;
    let mime: string;
    if (muxer) {
      muxer.finalize();
      const buf = (muxer.target as ArrayBufferTarget).buffer;
      if (!buf || buf.byteLength < 1024) return null;
      blob = new Blob([buf], { type: "audio/webm" });
      extensao = "webm";
      mime = "audio/webm";
    } else {
      if (quadrosAAC.length === 0) return null;
      const total = quadrosAAC.reduce((s, q) => s + q.length, 0);
      if (total < 1024) return null;
      const junto = new Uint8Array(total);
      let off = 0;
      for (const q of quadrosAAC) {
        junto.set(q, off);
        off += q.length;
      }
      blob = new Blob([junto], { type: "audio/aac" });
      extensao = "aac";
      mime = "audio/aac";
    }

    aoProgredir?.("pronto", 95);
    if (blob.size >= file.size * 0.85) return null; // ganho pequeno: mantém original
    return {
      blob,
      nome: `${nomeBase}.${extensao}`,
      mime,
      segundos: Math.round(quadros24k / 24000),
      economiaPct: Math.round((1 - blob.size / file.size) * 100),
    };
  } catch {
    return null;
  }
}
