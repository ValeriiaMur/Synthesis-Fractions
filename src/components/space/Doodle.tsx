import type { CSSProperties, ReactNode } from 'react';

export type DoodleProps = {
  readonly x: string | number;
  readonly y: string | number;
  readonly rotate?: number;
  readonly size?: number;
  readonly color?: string;
  readonly opacity?: number;
  readonly children: ReactNode;
};

/**
 * Common SVG shell for the hand-drawn space icons.
 * 1.6px stroke, 64×64 viewBox, absolute-positioned.
 */
export function Doodle({
  x,
  y,
  rotate = 0,
  size = 64,
  color = '#ffd86b',
  opacity = 0.9,
  children,
}: DoodleProps) {
  const style: CSSProperties = {
    left: x,
    top: y,
    transform: `rotate(${rotate}deg)`,
    opacity,
  };
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      style={style}
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}
