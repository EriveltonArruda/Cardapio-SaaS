// Beep de notificação gerado via Web Audio API — sem precisar de nenhum
// arquivo de áudio no projeto. Dois tons curtos, estilo "novo pedido".
let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function beep(ctx: AudioContext, freq: number, startTime: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Toca o beep de "novo pedido". Falha em silêncio se o navegador bloquear
 * áudio sem interação prévia do usuário (política de autoplay). */
export function playOrderSound() {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    beep(ctx, 880, now, 0.15);
    beep(ctx, 1175, now + 0.18, 0.18);
  } catch {
    // silencioso: som é um extra, nunca deve quebrar a tela de pedidos
  }
}

const STORAGE_KEY = "cardapio-saas:order-sound-enabled";

export function isOrderSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function setOrderSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // ignora ambientes sem localStorage
  }
}
