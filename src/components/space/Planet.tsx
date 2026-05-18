import { Doodle, type DoodleProps } from './Doodle';

export type PlanetProps = Omit<DoodleProps, 'children'>;

export function Planet(props: PlanetProps) {
  return (
    <Doodle {...props}>
      <circle cx="28" cy="30" r="11" />
      <ellipse cx="28" cy="30" rx="22" ry="6" transform="rotate(-18 28 30)" />
      <path d="M21 26 q3 2 7 0" />
      <path d="M22 32 q4 2 9 0 q2 -1 4 0" />
    </Doodle>
  );
}
