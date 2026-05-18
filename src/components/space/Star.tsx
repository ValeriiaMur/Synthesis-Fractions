import { Doodle, type DoodleProps } from './Doodle';

export type StarProps = Omit<DoodleProps, 'children'>;

export function Star(props: StarProps) {
  return (
    <Doodle {...props}>
      <path d="M32 16 L34 28 L46 30 L34 32 L32 44 L30 32 L18 30 L30 28 Z" />
    </Doodle>
  );
}
