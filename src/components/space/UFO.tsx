import { Doodle, type DoodleProps } from './Doodle';

export type UFOProps = Omit<DoodleProps, 'children'>;

export function UFO(props: UFOProps) {
  return (
    <Doodle {...props}>
      <ellipse cx="32" cy="34" rx="18" ry="5" />
      <path d="M22 34 q4 -10 10 -10 q6 0 10 10" />
      <path d="M26 26 q3 -4 6 -4 q3 0 6 4" />
      <path d="M22 40 L18 48" />
      <path d="M32 40 L32 50" />
      <path d="M42 40 L46 48" />
    </Doodle>
  );
}
