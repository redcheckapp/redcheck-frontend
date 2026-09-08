// Loading placeholder shaped like the real dashboard layout (sidebar +
// agenda + task list + performance panel) instead of a generic centered
// spinner, so the page doesn't visually "jump" once data arrives and the
// wait feels faster. `animate-pulse` on the outer wrapper is enough to
// pulse every descendant together, since CSS opacity composites a whole
// subtree as one unit — no need to repeat the class on each block.
export const DashboardSkeleton = () => (
    <div className="flex flex-col sm:flex-row h-dvh bg-[#e3e7e2] dark:bg-gray-950 p-2 sm:p-4 overflow-hidden animate-pulse">
        {/* Sidebar skeleton — desktop only, mobile has no persistent rail */}
        <div className="hidden sm:flex flex-col w-[280px] shrink-0 bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-md p-5 gap-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-gray-200 dark:bg-gray-800 shrink-0" />
                <div className="h-5 w-28 rounded-md bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 mx-auto" />
            <div className="h-16 rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800 mt-2" />
        </div>

        {/* Agenda skeleton — desktop only (mobile defaults to the Tasks tab) */}
        <div className="hidden sm:block flex-1 rounded-2xl bg-white dark:bg-gray-900 shadow-md sm:mr-4 p-6">
            <div className="h-7 w-40 rounded-md bg-gray-200 dark:bg-gray-800 mb-6" />
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 28 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800" />
                ))}
            </div>
        </div>

        {/* Tasks skeleton — always visible, this is the mobile default view */}
        <div className="flex-1 rounded-2xl bg-white dark:bg-gray-900 shadow-md p-4 sm:p-6 flex flex-col gap-3 min-w-0">
            <div className="h-8 w-48 rounded-md bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-32 rounded-md bg-gray-200 dark:bg-gray-800 mb-2" />
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 mt-3">
                    <div className="h-5 w-32 rounded-md bg-gray-200 dark:bg-gray-800 mb-1" />
                    <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800" />
                    <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800" />
                </div>
            ))}
        </div>

        {/* Performance skeleton — desktop only */}
        <div className="hidden sm:flex flex-col w-[350px] shrink-0 rounded-2xl bg-white dark:bg-gray-900 shadow-md ml-4 p-6 gap-4">
            <div className="h-6 w-32 rounded-md bg-gray-200 dark:bg-gray-800" />
            <div className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800" />
        </div>
    </div>
);
