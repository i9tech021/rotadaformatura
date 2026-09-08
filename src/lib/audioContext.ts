// src/lib/audioContext.ts
// Global audio singleton — keeps playing across page navigations.
// No React context needed; just a plain module-level Audio element.

let audioEl: HTMLAudioElement | null = null;
let listeners: Set<() => void> = new Set();

export interface AudioState {
  playing: boolean;
  currentUrl: string;
  currentTime: number;
  duration: number;
  playbackRate: number;
}

let state: AudioState = {
  playing: false,
  currentUrl: "",
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
};

function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = typeof Audio !== "undefined" ? new Audio() : (null as any);
    if (audioEl) {
      audioEl.addEventListener("play", () => {
        state.playing = true;
        notify();
      });
      audioEl.addEventListener("pause", () => {
        state.playing = false;
        notify();
      });
      audioEl.addEventListener("ended", () => {
        state.playing = false;
        state.currentTime = 0;
        notify();
      });
      audioEl.addEventListener("timeupdate", () => {
        state.currentTime = audioEl?.currentTime ?? 0;
        // Don't notify on every timeupdate to avoid excessive re-renders
      });
      audioEl.addEventListener("loadedmetadata", () => {
        state.duration = audioEl?.duration ?? 0;
        notify();
      });
      audioEl.addEventListener("durationchange", () => {
        state.duration = audioEl?.duration ?? 0;
      });
    }
  }
  return audioEl!;
}

function notify() {
  for (const cb of listeners) cb();
}

export function subscribeAudio(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getAudioState(): AudioState {
  // Sync time from actual element
  if (audioEl) {
    state.currentTime = audioEl.currentTime;
    state.duration = audioEl.duration || 0;
    state.playing = !audioEl.paused;
  }
  return { ...state };
}

export function playAudio(url: string) {
  const el = getAudio();
  if (!el) return;

  // If same URL, just toggle play
  if (state.currentUrl === url) {
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
    return;
  }

  // New URL: load and play
  state.currentUrl = url;
  state.currentTime = 0;
  el.src = url;
  el.load();
  el.playbackRate = state.playbackRate;
  el.play().catch(() => {});
  notify();
}

export function pauseAudio() {
  audioEl?.pause();
}

export function seekAudio(time: number) {
  if (audioEl) {
    audioEl.currentTime = time;
    state.currentTime = time;
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
  }
}

export function skipBackward(seconds = 15) {
  if (audioEl) {
    audioEl.currentTime = Math.max(0, audioEl.currentTime - seconds);
  }
}
