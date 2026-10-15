import confetti from 'canvas-confetti';
import { useSettingsStore } from '../stores/useSettingsStore';

function areAnimationsAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const enabledInSettings = useSettingsStore.getState().settings.animationsEnabled ?? true;
  return enabledInSettings && !isReducedMotion;
}

export function triggerCompletionConfetti(originX = 0.5, originY = 0.5): void {
  if (!areAnimationsAllowed()) {
    return;
  }

  confetti({
    particleCount: 50,
    spread: 60,
    origin: { x: originX, y: originY },
    colors: ['#818cf8', '#34d399', '#f472b6', '#fbbf24', '#60a5fa'],
    ticks: 200,
    gravity: 1.2,
    decay: 0.94,
    startVelocity: 30,
    shapes: ['circle', 'square'],
    scalar: 0.9,
  });
}

export function triggerLevelUpConfetti(): void {
  if (!areAnimationsAllowed()) {
    return;
  }

  const end = Date.now() + 1500;
  const colors = ['#818cf8', '#c084fc', '#34d399', '#fbbf24'];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

export function resetConfetti(): void {
  try {
    confetti.reset();
  } catch {
    // Ignore if canvas already disposed
  }
}
