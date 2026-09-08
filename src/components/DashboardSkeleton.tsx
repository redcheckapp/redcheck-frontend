// Loading placeholder shaped like the real dashboard layout — sidebar,
// mobile top/bottom bars, agenda, and task list — instead of a generic
// centered spinner, so nothing visually jumps once data arrives (this
// mirrors the *default* state: Focus Mode off, so the Agenda panel is
// shown and the Performance panel is not — showing all four columns at
// once doesn't match what actually renders after loading). `animate-pulse`
// on the outer wrapper is enough to pulse every descendant together,
// since CSS opacity composites a whole subtree as one unit — no need to
// repeat the class on each block.
export const DashboardSkeleton = () => (
    <div className="flex flex-col sm:flex-row h-dvh bg-[#e3e7e2] dark:bg-gray-950 p-2 sm:p-4 overflow-hidden animate-pulse">
        {/* Sidebar skeleton — desktop only; the real Sidebar is an
            off-screen fixed drawer on mobile until opened, so it has no
            footprint there either. */}
        <div className="hidden sm:flex flex-col w-[280px] shrink-0 bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-md p-5 gap-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-gray-200 dark:bg-gray-800 shrink-0" />
                <div className="h-5 w-28 rounded-md bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 mx-auto" />
            <div className="h-16 rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800 mt-2" />
        </div>

        {/* Mobile top bar skeleton (hamburger / title / plan-shortcut spot) */}
        <div className="sm:hidden flex items-center justify-between shrink-0 mb-2 px-1 py-1">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 shadow-md" />
            <div className="h-5 w-28 rounded-md bg-gray-300 dark:bg-gray-700" />
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 shadow-md" />
        </div>

        <div className="flex-1 flex h-full min-h-0">
            {/* Agenda skeleton — desktop only (mobile defaults to the Tasks
                tab); sized like the real panel (55% once Focus Mode is off,
                which is the default it loads into). */}
            <div className="hidden sm:flex w-[55%] h-auto flex-col overflow-hidden shrink-0 rounded-2xl bg-white dark:bg-gray-900 shadow-md p-6">
                <div className="h-7 w-40 rounded-md bg-gray-200 dark:bg-gray-800 mb-6" />
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 28 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800" />
                    ))}
                </div>
            </div>

            {/* Tasks skeleton — always visible, this is the mobile default view */}
            <div className="flex-1 rounded-2xl bg-white dark:bg-gray-900 shadow-md p-4 sm:p-6 flex flex-col gap-3 min-w-0 sm:ml-4">
                <div className="h-8 w-48 rounded-md bg-gray-200 dark:bg-gray-800" />
                <div className="h-4 w-32 rounded-md bg-gray-200 dark:bg-gray-800 mb-2" />
                <div className="h-10 rounded-xl bg-gray-100 dark:bg-gray-800 mt-1" />
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2 mt-3">
                        <div className="h-5 w-32 rounded-md bg-gray-200 dark:bg-gray-800 mb-1" />
                        <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800" />
                        <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800" />
                    </div>
                ))}
            </div>
        </div>

        {/* Mobile bottom tab bar skeleton (Tasks / Agenda / Progress) */}
        <div className="sm:hidden shrink-0 mt-2 grid grid-cols-3 gap-1 p-1.5 rounded-2xl bg-white dark:bg-gray-900 shadow-md">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center justify-center gap-1 py-2">
                    <div className="w-5 h-5 rounded-md bg-gray-200 dark:bg-gray-800" />
                    <div className="h-2 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                </div>
            ))}
        </div>
    </div>
);
