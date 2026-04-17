import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      <div
        className={cn(
          "mt-3 h-0.5 w-16 bg-accent",
          align === "center" ? "mx-auto" : ""
        )}
        aria-hidden="true"
      />
      {subtitle && (
        <p className="mt-4 max-w-2xl text-base text-foreground/60 sm:text-lg mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
