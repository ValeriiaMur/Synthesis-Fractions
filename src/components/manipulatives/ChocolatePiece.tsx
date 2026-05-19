'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';

export type ChocolatePieceProps = {
  /** Square edge length in CSS pixels. Acts as the height; width falls
   *  back to this when `width` isn't supplied. */
  readonly size: number;
  /** Optional width override — lets a ½-piece render as a wider rectangle
   *  by cropping the square chocolate.png with object-fit: cover. */
  readonly width?: number;
  /** Renders a soft green ring around the piece. Used by ChocolateBar's
   *  half-space placements and the HeroPreview's "placed" location so the
   *  visitor can see which pieces have been moved. */
  readonly placed?: boolean;
  /** Pass an empty string to mark decorative; alt is auto-hidden then. */
  readonly alt?: string;
  /** Extra style overrides (e.g. animation on appear). Merged last. */
  readonly style?: CSSProperties;
};

/**
 * Shared chocolate-piece visual. Renders `/images/chocolate.png` at the
 * requested size and replaces the bespoke SVG/CSS-gradient blocks the
 * lesson, hero preview, tray demo, and control-of-error demo used to draw
 * by hand. Centralizing the artwork in one component keeps every chocolate
 * across both pages visually consistent.
 *
 * The PNG is a square (1:1) chocolate bar. For non-square sizes (the
 * tray's ½-piece is 96×44) we use `object-fit: cover` so the image fills
 * the rectangle by cropping top/bottom rather than stretching.
 */
export function ChocolatePiece({
  size,
  width,
  placed = false,
  alt = '',
  style,
}: ChocolatePieceProps) {
  const w = width ?? size;
  const isDecorative = alt === '';
  return (
    <span
      aria-hidden={isDecorative || undefined}
      style={{
        display: 'inline-block',
        width: w,
        height: size,
        position: 'relative',
        borderRadius: Math.max(6, Math.round(size * 0.14)),
        overflow: 'hidden',
        boxShadow: placed
          ? '0 0 0 2px rgba(95,216,151,0.55), 0 10px 20px -8px rgba(0,0,0,0.55)'
          : '0 10px 20px -8px rgba(0,0,0,0.5)',
        transition: 'box-shadow .2s ease, transform .2s ease',
        ...style,
      }}
    >
      <Image
        src="/images/chocolate.png"
        alt={alt}
        fill
        sizes={`${Math.max(w, size)}px`}
        style={{
          objectFit: 'cover',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
    </span>
  );
}
