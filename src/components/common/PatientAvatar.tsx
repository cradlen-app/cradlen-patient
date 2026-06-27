import Image from "next/image";

import LogoIcon from "@/public/Logo-icon.png";
import { cn } from "@/common/utils/utils";

/**
 * Patient avatar for the portal chrome. Renders the uploaded profile image when
 * present, otherwise falls back to the Cradlen logo icon. Sizing comes from the
 * caller via `className` (e.g. `size-8`, `size-9`).
 */
export function PatientAvatar({
  imageUrl,
  alt,
  className,
}: {
  imageUrl?: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-secondary/20",
        className,
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL (dynamic host); next/image not practical
        <img
          src={imageUrl}
          alt={alt}
          className="size-full object-cover"
        />
      ) : (
        <Image src={LogoIcon} alt={alt || "Cradlen"} className="size-full object-contain p-0.5" />
      )}
    </span>
  );
}
