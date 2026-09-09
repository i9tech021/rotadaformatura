// src/lib/audioContext.ts
// Player de áudio GLOBAL (singleton): um único <audio> no módulo, então a
// reprodução continua ao navegar entre páginas (nada desmonta o elemento).
// Áudios longos/pesados: streaming nativo por HTTP range (Supabase Storage
// suporta), preload de metadados, estado de buffering e erro visível,
// e Media Session API (controles na tela de bloqueio / fone Bluetooth).

export interface AudioMeta {
  titulo?: string;
  disciplina?: string;
}

export interface AudioState {
  playing: boolean;
  buffering: boolean;
  error: string | null;
  currentUrl: string;
  titulo: string;
  disciplina: string;
  currentTime: number;
  duration: number;
  playbackRate: number;
}

let audioEl: HTMLAudioElement | null = null;
const listeners: Set<() => void> = new Set();

let state: AudioState = {
  playing: false,
  buffering: false,
  error: null,
  currentUrl: "",
  titulo: "",
  disciplina: "",
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
};

let lastTimeNotify = 0;

function notify() {
  for (const cb of listeners) cb();
}

function setupMediaSession() {
  try {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", () => audioEl?.play().catch(() => {}));
    ms.setActionHandler("pause", () => audioEl?.pause());
    ms.setActionHandler("seekbackward", (d) => skipBackward(d.seekOffset ?? 15));
    ms.setActionHandler("seekforward", (d) => skipForward(d.seekOffset ?? 15));
    ms.setActionHandler("previoustrack", () => skipBackward(15));
    ms.setActionHandler("nexttrack", () => skipForward(30));
  } catch {
    // navegadores sem suporte: ignora
  }
}

function updateMediaMetadata() {
  try {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.titulo || "Podcast",
      artist: state.disciplina || "Rota da Formatura",
      album: "Rota da Formatura",
    });
  } catch {
    // ignora
  }
}

function getAudio(): HTMLAudioElement | null {
  if (audioEl) return audioEl;
  if (typeof Audio === "undefined") return null;
  audioEl = new Audio();
  audioEl.preload = "metadata";
  audioEl.addEventListener("play", () => {
    state.playing = true;
    state.buffering = false;
    notify();
  });
  audioEl.addEventListener("playing", () => {
    state.playing = true;
    state.buffering = false;
    notify();
  });
  audioEl.addEventListener("pause", () => {
    state.playing = false;
    state.buffering = false;
    notify();
  });
  audioEl.addEventListener("ended", () => {
    state.playing = false;
    state.buffering = false;
    state.currentTime = 0;
    notify();
  });
  audioEl.addEventListener("waiting", () => {
    state.buffering = true;
    notify();
  });
  audioEl.addEventListener("stalled", () => {
    state.buffering = true;
    notify();
  });
  audioEl.addEventListener("canplay", () => {
    state.buffering = false;
    state.error = null;
    notify();
  });
  audioEl.addEventListener("timeupdate", () => {
    state.currentTime = audioEl?.currentTime ?? 0;
    // avisa no máximo 1x/segundo para a barra de progresso andar sem travar a UI
    const agora = Date.now();
    if (agora - lastTimeNotify > 1000) {
      lastTimeNotify = agora;
      notify();
    }
  });
  audioEl.addEventListener("loadedmetadata", () => {
    state.duration = audioEl?.duration ?? 0;
    state.error = null;
    notify();
  });
  audioEl.addEventListener("durationchange", () => {
    state.duration = audioEl?.duration ?? 0;
  });
  audioEl.addEventListener("error", () => {
    state.playing = false;
    state.buffering = false;
    state.error = "Não foi possível carregar o áudio. Verifique a conexão e tente de novo.";
    notify();
  });
  setupMediaSession();
  return audioEl;
}

export function subscribeAudio(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getAudioState(): AudioState {
  if (audioEl) {
    state.currentTime = audioEl.currentTime;
    if (Number.isFinite(audioEl.duration)) state.duration = audioEl.duration;
    state.playing = !audioEl.paused;
  }
  return { ...state };
}

/** Toca um áudio. Retorna true se começou a tocar (ou alternou pause). */
export function playAudio(url: string, meta?: AudioMeta): boolean {
  const el = getAudio();
  if (!el) return false;

  if (state.currentUrl === url) {
    if (el.paused) {
      el.play().catch(() => {
        state.error = "Toque novamente para iniciar o áudio.";
        notify();
      });
    } else {
      el.pause();
    }
    return true;
  }

  state.currentUrl = url;
  state.currentTime = 0;
  state.duration = 0;
  state.error = null;
  state.buffering = true;
  if (meta?.titulo !== undefined) state.titulo = meta.titulo;
  if (meta?.disciplina !== undefined) state.disciplina = meta.disciplina;
  updateMediaMetadata();
  el.src = url;
  el.load();
  el.playbackRate = state.playbackRate;
  el.play().catch(() => {
    state.buffering = false;
    state.error = "Toque novamente para iniciar o áudio.";
    notify();
  });
  notify();
  return true;
}

export function pauseAudio() {
  audioEl?.pause();
}

export function stopAudio() {
  if (audioEl) {
    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load();
  }
  state.playing = false;
  state.buffering = false;
  state.currentUrl = "";
  state.currentTime = 0;
  notify();
}

export function seekAudio(time: number) {
  if (audioEl && Number.isFinite(time)) {
    audioEl.currentTime = Math.max(0, time);
    state.currentTime = audioEl.currentTime;
    notify();
  }
}

export function setPlaybackRate(rate: number) {
  state.playbackRate = rate;
  if (audioEl) audioEl.playbackRate = rate;
  notify();
}

export function skipForward(seconds = 15) {
  if (audioEl) {
    audioEl.currentTime = Math.min(audioEl.duration || 0, audioEl.currentTime + seconds);
    state.currentTime = audioEl.currentTime;
    notify();
  }
}

export function skipBackward(seconds = 15) {
  if (audioEl) {
    audioEl.currentTime = Math.max(0, audioEl.currentTime - seconds);
    state.currentTime = audioEl.currentTime;
    notify();
  }
}
