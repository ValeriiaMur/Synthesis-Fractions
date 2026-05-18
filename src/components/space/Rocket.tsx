import { Doodle, type DoodleProps } from './Doodle';

export type RocketProps = Omit<DoodleProps, 'children'>;

export function Rocket(props: RocketProps) {
  return (
    <Doodle {...props}>
      <path d="M32 10 q8 6 8 22 q0 8 -3 14 L27 46 q-3 -6 -3 -14 q0 -16 8 -22 Z" />
      <circle cx="32" cy="26" r="3" />
      <path d="M24 36 L18 42 L22 44" />
      <path d="M40 36 L46 42 L42 44" />
      <path d="M30 50 q1 4 2 6" />
      <path d="M34 50 q-1 4 -2 6" />
    </Doodle>
  );
}
