import { Doodle, type DoodleProps } from './Doodle';

export type SatelliteProps = Omit<DoodleProps, 'children'>;

export function Satellite(props: SatelliteProps) {
  return (
    <Doodle {...props}>
      <rect x="26" y="26" width="12" height="12" rx="2" />
      <path d="M14 26 L26 30 L14 34 Z" />
      <path d="M50 26 L38 30 L50 34 Z" />
      <path d="M32 26 L32 14" />
      <circle cx="32" cy="12" r="2" />
      <path d="M38 38 L46 46" />
      <circle cx="48" cy="48" r="2" />
    </Doodle>
  );
}
