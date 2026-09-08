export const getSharedCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const raw = parts.pop()?.split(';').shift();
        if (!raw) return null;
        // Mirrors setSharedCookie's encodeURIComponent — without this, a
        // value containing reserved characters (;, =, spaces...) comes
        // back still encoded. Harmless today (every value stored is a
        // plain word like "dark"/"es") but wrong for anything else.
        try {
            return decodeURIComponent(raw);
        } catch {
            return raw;
        }
    }
    return null;
};

export const setSharedCookie = (name: string, value: string, days: number = 365): void => {
    const expires = new Date(Date.now() + days * 86400 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};