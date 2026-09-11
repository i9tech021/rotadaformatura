// src/lib/videoLeve.ts
// Compressão de vídeo 100% no aparelho antes do upload.
// Re-codifica para WebM (VP9/VP8 + Opus) em 480p com bitrate moderado —
// um vídeo de 50MB+ vira poucos MB sem sair do navegador.
// Espelha a API de audioLeve.ts (otimizarAudio) para o fluxo de envio.
export interface VideoOtimizado {
  blob: Blob;
  nome: string;
  mime: string;
  segundos: number;
  economiaPct: number;
}

/** Limite a partir do qual vale a pena comprimir (abaixo disso envia original). */
export const LIMITE_VIDEO_COMPRESSAO = 8 * 1024 * 1024;

const LARGURA_MAX = 640;
const FPS = 24;
const VIDEO_BITRATE = 650_000;
const AUDIO_BITRATE = 48_000;

/** Checagem síncrona rápida de suporte (MediaRecorder + captura de canvas). */
export function videoSuportado(): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (typeof MediaRecorder === "undefined") return false;
    const canvas = document.createElement("canvas");
    const stream = (canvas as HTMLCanvasElement & { captureStream?: (fps: number) => MediaStream })
      .captureStream;
    if (typeof stream !== "function") return false;
    const el = document.createElement("video");
    return typeof el.play === "function";
  } catch {
    return false;
  }
}

function escolherMime(): string {
  const candidatos = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
  ];
  for (const mime of candidatos) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    } catch {
      // ignora
    }
  }
  return "";
}

function carregarVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    (video as HTMLVideoElement & { playsInline?: boolean }).playsInline = true;
    video.preload = "auto";
    video.style.cssText =
      "position:fixed;left:-9999px;top:0;width:160px;height:90px;opacity:0;pointer-events:none;";
    const limparErro = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => {
      limparErro();
      video.remove();
      reject(new Error("nao-abriu"));
    };
    video.src = url;
    document.body.appendChild(video);
  });
}

export async function otimizarVideo(
  file: File,
  aoProgredir?: (fase: string, pct: number) => void,
): Promise<VideoOtimizado | null> {
  const mime = escolherMime();
  if (!mime) return null;
  if (file.size < LIMITE_VIDEO_COMPRESSAO) return null;

  let video: HTMLVideoElement | null = null;
  let audioCtx: AudioContext | null = null;
  let rec: MediaRecorder | null = null;
  let raf = 0;
  try {
    aoProgredir?.("lendo", 5);
    video = await carregarVideo(file);
    const duracao = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    if (!video.videoWidth) return null;

    const escala = Math.min(1, LARGURA_MAX / video.videoWidth);
    const larg = Math.max(2, Math.round((video.videoWidth * escala) / 2) * 2);
    const alt = Math.max(2, Math.round((video.videoHeight * escala) / 2) * 2);

    const canvas = document.createElement("canvas");
    canvas.width = larg;
    canvas.height = alt;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return null;
    const canvasStream = (
      canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }
    ).captureStream(FPS);

    // Áudio do vídeo via WebAudio (mantém narração da aula)
    try {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        audioCtx = new AC();
        const fonte = audioCtx.createMediaElementSource(video);
        const destino = audioCtx.createMediaStreamDestination();
        fonte.connect(destino);
        fonte.connect(audioCtx.destination);
        for (const trilha of destino.stream.getAudioTracks()) canvasStream.addTrack(trilha);
      }
    } catch {
      // sem áudio — segue só com o vídeo
    }

    const partes: Blob[] = [];
    rec = new MediaRecorder(canvasStream, {
      mimeType: mime,
      videoBitsPerSecond: VIDEO_BITRATE,
      audioBitsPerSecond: AUDIO_BITRATE,
    });
    const gravacaoOk = new Promise<void>((resolve, reject) => {
      rec!.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) partes.push(ev.data);
      };
      rec!.onerror = () => reject(new Error("gravacao"));
      rec!.onstop = () => resolve();
    });

    // Desenha cada quadro no canvas reduzido
    const desenhar = () => {
      try {
        ctx2d.drawImage(video!, 0, 0, larg, alt);
      } catch {
        // quadro ainda não pronto
      }
      if (duracao > 0) {
        const pct = Math.min(95, 10 + Math.round((video!.currentTime / duracao) * 80));
        aoProgredir?.("comprimindo", pct);
      }
      raf = requestAnimationFrame(desenhar);
    };

    // Watchdog: duração do vídeo + folga (nunca trava a tela)
    const watchdog = new Promise<never>((_, reject) => {
      const limite = (duracao > 0 ? duracao * 1000 : 5 * 60 * 1000) + 90_000;
      setTimeout(() => reject(new Error("tempo-esgotado")), limite);
    });

    const executar = (async () => {
      rec!.start(1000);
      raf = requestAnimationFrame(desenhar);
      await video!.play();
      await new Promise<void>((resolve) => {
        const fim = () => resolve();
        video!.onended = fim;
        if (duracao > 0) {
          const checar = () => {
            if (video!.currentTime >= duracao - 0.15) fim();
            else setTimeout(checar, 300);
          };
          checar();
        } else {
          setTimeout(fim, 30_000);
        }
      });
      cancelAnimationFrame(raf);
      rec!.stop();
      await gravacaoOk;
    })();

    await Promise.race([executar, watchdog]);
    aoProgredir?.("finalizando", 96);

    const tipoBlob = mime.split(";")[0] ?? "video/webm";
    const blob = new Blob(partes, { type: tipoBlob });
    if (!blob.size) return null;
    const nomeBase = file.name.replace(/\.[^.]+$/, "") || "video";
    const economiaPct = Math.max(0, Math.round((1 - blob.size / file.size) * 100));
    aoProgredir?.("pronto", 100);
    return {
      blob,
      nome: `${nomeBase}-leve.webm`,
      mime: tipoBlob,
      segundos: Math.round(duracao),
      economiaPct,
    };
  } catch {
    return null;
  } finally {
    try {
      cancelAnimationFrame(raf);
    } catch {
      // ignora
    }
    try {
      if (rec && rec.state !== "inactive") rec.stop();
    } catch {
      // ignora
    }
    try {
      await audioCtx?.close();
    } catch {
      // ignora
    }
    try {
      if (video) {
        video.pause();
        if (video.src) URL.revokeObjectURL(video.src);
        video.remove();
      }
    } catch {
      // ignora
    }
  }
}
