import { Doodle, type DoodleProps } from './Doodle';

export type TelescopeProps = Omit<DoodleProps, 'children'>;

export function Telescope(props: TelescopeProps) {
  return (
    <Doodle {...props}>
      <path d="M14 42 L34 18 L42 22 L24 46 Z" />
      <path d="M30 42 L34 50" />
      <path d="M22 44 L18 52" />
      <path d="M26 50 L26 56" />
      <path d="M18 54 L34 54" />
      <circle cx="38" cy="20" r="2" />
    </Doodle>
  );
}
