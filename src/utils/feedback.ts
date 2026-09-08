// Lightweight, dependency-free haptic feedback for task completion.
// Feature-detected and wrapped so it's a silent no-op on unsupported
// platforms (e.g. the Vibration API doesn't exist on iOS Safari) rather
// than ever interrupting the actual task-completion flow.
//
// IMPORTANT: call this synchronously, directly inside the click handler,
// before any `await`. The Vibration API requires an active user gesture,
// and on mobile browsers that gesture context does not survive crossing
// an `await` boundary — calling it after an awaited API request silently
// no-ops there even though it works fine on desktop.
export const triggerHapticFeedback = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(15);
    }
};
