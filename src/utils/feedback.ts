// Lightweight, dependency-free feedback helpers for task completion.
// Both are feature-detected and wrapped so they silently no-op on
// unsupported platforms (e.g. the Vibration API doesn't exist on iOS
// Safari) rather than ever interrupting the actual task-completion flow.

export const triggerHapticFeedback = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(15);
    }
};

let audioContext: AudioContext | null = null;

// A short rising "ding" synthesized with the Web Audio API — no audio
// asset to ship, just an oscillator + a quick gain envelope so it doesn't
// click at the start/end.
export const playTaskCompleteSound = () => {
    try {
        if (typeof window === "undefined") return;
        const AudioContextClass =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        audioContext ??= new AudioContextClass();
        const ctx = audioContext;
        const now = ctx.currentTime;

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.1);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.25);
    } catch {
        // Audio is a nice-to-have; never let it break task completion.
    }
};
