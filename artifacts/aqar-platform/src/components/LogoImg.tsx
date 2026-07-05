import { useState, type CSSProperties, type ReactNode } from "react";

/**
 * Renders an image that gracefully falls back to `fallback` (e.g. a building
 * icon) when the source is missing OR fails to load (broken/expired URL).
 */
export function LogoImg({
  src,
  alt,
  className,
  style,
  fallback,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
