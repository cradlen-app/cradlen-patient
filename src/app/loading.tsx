import Image from "next/image";
import logoIcon from "@/public/Logo-icon.png";

export default function Loading() {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-6 text-foreground">
      <div
        className="flex flex-col items-center gap-5"
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <div className="relative grid size-24 place-items-center rounded-full bg-brand-secondary/10">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-primary/20" />
          <Image
            src={logoIcon}
            alt=""
            priority
            className="relative size-16 animate-pulse object-contain"
          />
        </div>
        <p className="text-sm font-medium tracking-normal text-brand-black/70">
          Loading...
        </p>
      </div>
    </main>
  );
}
