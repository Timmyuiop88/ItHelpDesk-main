import ecowasLogo from "../assets/ecowas-logo.png";

interface BrandMarkProps {
  subtitle?: string;
  size?: "sm" | "lg";
  className?: string;
}

export function BrandMark({
  subtitle = "IT Support",
  size = "sm",
  className = "",
}: BrandMarkProps) {
  const logoClass = size === "lg" ? "h-20 w-20" : "h-8 w-8";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={ecowasLogo}
        alt="ECOWAS seal"
        className={`${logoClass} shrink-0 object-contain`}
      />
      <div className="min-w-0">
        <p
          className={
            size === "lg"
              ? "text-2xl font-bold tracking-tight text-primary"
              : "text-sm font-bold tracking-tight text-primary"
          }
        >
          ECOWAS
        </p>
        <p
          className={
            size === "lg"
              ? "text-sm text-muted-foreground"
              : "text-xs text-muted-foreground"
          }
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
