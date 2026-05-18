import { Doodle, type DoodleProps } from './Doodle';

export type CometProps = Omit<DoodleProps, 'children'>;

export function Comet(props: CometProps) {
  return (
    <Doodle {...props}>
      <circle cx="44" cy="20" r="4" />
      <path d="M42 23 L20 44" />
      <path d="M46 24 L30 50" />
      <path d="M40 26 L14 38" />
    </Doodle>
  );
}
