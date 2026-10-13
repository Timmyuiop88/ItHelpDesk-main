import { useEffect, useState } from "react";

const DEFAULT_IMAGES = [
  "/authpics/1.JPG",
  "/authpics/2.JPG",
  "/authpics/3.JPG",
  "/authpics/4.JPG",
  "/authpics/5.JPG",
];

const SLIDE_INTERVAL_MS = 3000;
const FADE_MS = 1000;
const ZOOM_SCALE = 1.12;

interface AuthBackgroundProps {
  children: React.ReactNode;
  images?: string[];
}

/**
 * Full-screen wrapper with a cross-fading, slowly zooming image slideshow and
 * a brand-colored overlay. Colors come from the `--primary` theme token in
 * `index.css`.
 */
export function AuthBackground({ children, images = DEFAULT_IMAGES }: AuthBackgroundProps) {
  const [active, setActive] = useState(0);
  const [reduceMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const previous = (active - 1 + images.length) % images.length;

  useEffect(() => {
    if (images.length < 2) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [images.length]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {images.length > 0 ? (
        images.map((src, i) => {
          const isActive = i === active;
          // The outgoing slide holds its zoom while it fades out; every other
          // hidden slide snaps back to 1 so it can zoom in again next time.
          const zoomed = !reduceMotion && (isActive || i === previous);
          return (
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden
              className="absolute inset-0 z-0 h-full w-full object-cover will-change-transform"
              style={{
                opacity: isActive ? 1 : 0,
                transform: `scale(${zoomed ? ZOOM_SCALE : 1})`,
                transition: reduceMotion
                  ? "none"
                  : `opacity ${FADE_MS}ms ease-in-out, transform ${
                      isActive ? SLIDE_INTERVAL_MS + FADE_MS : 0
                    }ms linear`,
              }}
            />
          );
        })
      ) : (
        <div className="absolute inset-0 z-0 bg-linear-160 from-[color-mix(in_oklab,var(--primary),black_28%)] via-primary to-[color-mix(in_oklab,var(--primary),black_24%)]" />
      )}

      <div className="absolute inset-0 z-1 bg-primary/60" />

      <div className="relative z-2 flex min-h-screen items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
