import { memo, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

// Mounted once at the app shell level (see App.tsx) so the animation keeps
// running — and never resets — as the user navigates between the public
// pages (login, register, terms, privacy). Pages with their own opaque
// background (e.g. the dashboard) simply paint over it.
export const BackgroundParticles = memo(() => {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    if (!init) return null;

    return (
        <Particles
            id="tsparticles-app"
            className="fixed inset-0 -z-10"
            options={{
                background: { color: { value: "transparent" } },
                fpsLimit: 120,
                particles: {
                    color: { value: "#9ca3af" },
                    links: { color: "#9ca3af", distance: 150, enable: true, opacity: 0.2, width: 1 },
                    move: { direction: "none", enable: true, outModes: { default: "bounce" }, random: false, speed: 1.0, straight: false },
                    number: { density: { enable: true, width: 800, height: 800 }, value: 60 },
                    opacity: { value: 0.3 },
                    shape: { type: "circle" },
                    size: { value: { min: 1, max: 2 } },
                },
                detectRetina: true,
            }}
        />
    );
});
