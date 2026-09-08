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
//
// Returns whether the browser actually accepted the request — false (or
// the call throwing, caught here) means it was rejected outright (missing
// gesture, disabled by the browser/OS, unsupported), which is different
// from "accepted but the motor's spin-up time made a very short pulse
// imperceptible." `duration` defaults to 40ms rather than something like
// 15ms for that reason — many phone vibration motors have a minimum
// effective spin-up time below which a pulse is technically executed but
// not actually felt.
export const triggerHapticFeedback = (duration = 40): boolean => {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return false;
    try {
        return navigator.vibrate(duration);
    } catch {
        return false;
    }
};
