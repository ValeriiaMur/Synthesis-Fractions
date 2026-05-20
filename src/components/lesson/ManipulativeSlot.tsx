import type { ManipulativeConfig, ManipulativeState } from '@/lib/lesson/types';
import { WholeMaterial } from './WholeMaterial';
import { NamingMaterial } from './NamingMaterial';
import { EquivalenceMaterial } from './EquivalenceMaterial';
import { PaperFold } from '@/components/manipulatives/PaperFold';

export type ManipulativeSlotProps = {
  readonly manip: ManipulativeConfig;
  readonly value: ManipulativeState | undefined;
  readonly onChange: (s: ManipulativeState) => void;
  readonly disabled: boolean;
};

export function ManipulativeSlot({
  manip,
  value,
  onChange,
  disabled,
}: ManipulativeSlotProps): React.ReactElement {
  if (manip.kind === 'whole') {
    return (
      <WholeMaterial
        value={value?.kind === 'whole' ? value : undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  if (manip.kind === 'naming') {
    return (
      <NamingMaterial
        config={manip}
        value={value?.kind === 'naming' ? value : undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  if (manip.kind === 'paper') {
    return (
      <PaperFold
        value={value?.kind === 'paper' ? value : undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  return (
    <EquivalenceMaterial
      config={manip}
      value={value?.kind === 'equivalence' ? value : undefined}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
