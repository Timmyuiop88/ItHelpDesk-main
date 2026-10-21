import fincraLogo from "../assets/fincra-logo.jpg";

interface BrandMarkProps {
  subtitle?: string;
  size?: "sm" | "lg";
  className?: string;
  collapsed?: boolean;
}

export function BrandMark({
  subtitle = "IT Support",
  size = "sm",
  className = "",
  collapsed = false,
}: BrandMarkProps) {
  const logoClass = size === "lg" ? "h-20 w-20" : "h-8 w-8";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={fincraLogo}
        alt="Fincra logo"
        className={`${logoClass} shrink-0 object-contain`}
      />
      {!collapsed && (
        <div className="min-w-0">
          <p
            className={
              size === "lg"
                ? "text-2xl font-bold tracking-tight text-primary"
                : "text-sm font-bold tracking-tight text-primary"
            }
          >
            Fincra
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
      )}
    </div>
  );
}
