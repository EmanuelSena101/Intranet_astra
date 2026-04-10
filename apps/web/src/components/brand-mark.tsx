"use client";

import Image from "next/image";

type BrandMarkProps = {
  subtitle?: string;
  align?: "left" | "center";
  compact?: boolean;
};

export function BrandMark({
  subtitle,
  align = "left",
  compact = false
}: BrandMarkProps) {
  const isCentered = align === "center";

  return (
    <div className={`flex ${isCentered ? "items-center text-center" : "items-start"} gap-4`}>
      <div className="brand-logo-frame shrink-0">
        <Image
          src="/astra-logo.PNG"
          alt="Astra"
          width={361}
          height={139}
          priority
          className={compact ? "h-auto w-[132px]" : "h-auto w-[172px] md:w-[204px]"}
        />
      </div>

      <div className={`flex flex-col ${isCentered ? "items-center" : "items-start"} justify-center`}>
        <span className="brand-chip">Astra Intranet</span>
        {subtitle ? (
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
