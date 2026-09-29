import type { ReactNode } from "react";
import { artworkUrl, ARTWORK, type ArtworkId } from "../../lib/artwork";
import { useResolvedTheme } from "../../store/useTheme";
import { cn } from "../../lib/cn";

/** An illustration slot: the dropped-in artwork for the current theme when it exists, the
 * designed fallback until then. Decorative by default - pass `alt` only when the image
 * carries meaning the surrounding text does not. */
export function Artwork({
  id,
  fallback = null,
  alt = "",
  className,
}: {
  id: ArtworkId;
  fallback?: ReactNode;
  alt?: string;
  className?: string;
}) {
  const theme = useResolvedTheme();
  const url = artworkUrl(id, theme);
  if (!url) return <>{fallback}</>;
  return (
    <img
      src={url}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      title={alt || undefined}
      data-artwork={id}
      data-artwork-description={ARTWORK[id]}
      loading="lazy"
      decoding="async"
      className={cn("pointer-events-none select-none", className)}
    />
  );
}
