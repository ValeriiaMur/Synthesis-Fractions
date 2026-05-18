import { Doodle, type DoodleProps } from './Doodle';

export type AtomProps = Omit<DoodleProps, 'children'>;

export function Atom(props: AtomProps) {
  return (
    <Doodle {...props}>
      <circle cx="32" cy="32" r="3" />
      <ellipse cx="32" cy="32" rx="18" ry="7" />
      <ellipse cx="32" cy="32" rx="18" ry="7" transform="rotate(60 32 32)" />
      <ellipse cx="32" cy="32" rx="18" ry="7" transform="rotate(-60 32 32)" />
    </Doodle>
  );
}
