/**
 * Lightweight browser notifications helper.
 * - playChime(): Web Audio API generated sound (no assets needed)
 * - showNotification(): browser Notification API
 * - requestPermission(): asks the browser for permission
 */

let audioCtx = null;

export function playChime() {
  try {
    if (typeof window === "undefined") return;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();

    const now = audioCtx.currentTime;
    const notes = [880, 1108.73]; // A5, C#6 — cheerful ‘ding’
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.0001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
  } catch (e) {
    // Best-effort: browsers may throw on strict autoplay policies.
    if (typeof console !== "undefined") console.warn("[notifications] chime blocked:", e?.message || e);
  }
}

export function notificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  try {
    const p = await Notification.requestPermission();
    return p;
  } catch {
    return "denied";
  }
}

export function showNativeNotification(title, options = {}) {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const n = new Notification(title, {
      body: options.body,
      icon:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%23FF5A00'/%3E%3Cpath d='M46 20.2 A18 18 0 1 0 46 43.8 L46 36.2 A11 11 0 1 1 46 27.8 Z' fill='white'/%3E%3C/svg%3E",
      badge:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%23FF5A00'/%3E%3C/svg%3E",
      tag: options.tag || "cons-notification",
      renotify: true,
    });
    n.onclick = () => {
      try {
        window.focus();
      } catch (focusErr) {
        if (typeof console !== "undefined") console.warn("[notifications] window.focus() failed:", focusErr?.message || focusErr);
      }
      if (options.url) window.location.href = options.url;
      n.close();
    };
    return n;
  } catch (e) {
    if (typeof console !== "undefined") console.warn("[notifications] showNativeNotification failed:", e?.message || e);
  }
}
