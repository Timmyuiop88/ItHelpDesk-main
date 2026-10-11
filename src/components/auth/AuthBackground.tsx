interface AuthBackgroundProps {
  children: React.ReactNode;
  videoSrc?: string;
}

/**
 * Full-screen wrapper with a looping video background and an ECOWAS green
 * overlay. Drop any auth card inside as children.
 *
 * To add the video: pass a `videoSrc` prop pointing to a bundled asset, e.g.
 *   import bgVideo from "../../assets/auth-bg.mp4";
 *   <AuthBackground videoSrc={bgVideo}>…</AuthBackground>
 */
export function AuthBackground({ children, videoSrc }: AuthBackgroundProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Video layer */}
      {videoSrc && (
        <video
          autoPlay
          muted
          loop
          playsInline
          src={videoSrc}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ zIndex: 0 }}
        />
      )}

      {/* Fallback gradient when no video is provided */}
      {!videoSrc && (
        <div
          className="absolute inset-0 bg-[linear-gradient(160deg,#004d2e_0%,#006b3f_50%,#00512f_100%)]"
          style={{ zIndex: 0 }}
        />
      )}

      {/* ECOWAS green overlay */}
      <div
        className="absolute inset-0 bg-[#006b3f]/60"
        style={{ zIndex: 1 }}
      />

      {/* Content */}
      <div
        className="relative flex min-h-screen items-center justify-center p-6"
        style={{ zIndex: 2 }}
      >
        {children}
      </div>
    </div>
  );
}
