interface AuthBackgroundProps {
  children: React.ReactNode;
  videoSrc?: string;
}

/**
 * Full-screen wrapper with a looping video background and a brand-colored
 * overlay. Colors come from the `--primary` theme token in `index.css`.
 *
 * To add the video: pass a `videoSrc` prop pointing to a bundled asset, e.g.
 *   import bgVideo from "../../assets/auth-bg.mp4";
 *   <AuthBackground videoSrc={bgVideo}>…</AuthBackground>
 */
export function AuthBackground({ children, videoSrc }: AuthBackgroundProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {videoSrc ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          src={videoSrc}
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />
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
