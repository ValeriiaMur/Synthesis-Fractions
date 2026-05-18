import { Doodle, type DoodleProps } from './Doodle';

export type MoonProps = Omit<DoodleProps, 'children'>;

export function Moon(props: MoonProps) {
  return (
    <Doodle {...props}>
      <path d="M40 16 q-18 4 -18 16 q0 12 18 16 q-14 -2 -14 -16 q0 -14 14 -16 Z" />
      <circle cx="30" cy="26" r="1.5" />
      <circle cx="34" cy="34" r="1.2" />
      <circle cx="28" cy="38" r="1" />
    </Doodle>
  );
}
