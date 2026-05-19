import { Quad } from './Quad';
import { QuadLabels } from './QuadLabels';

export type PaperProps = {
  readonly folds: 0 | 1 | 2;
  readonly dragProgress: number;
  readonly dragDirection: 'h' | 'v' | null;
};

/**
 * The folding paper. Four quadrants whose 3D transforms interpolate
 * between the discrete fold states. `dragDirection` + `dragProgress`
 * drive any in-flight fold; `folds` is the committed count.
 *
 * The +2 / +4 translateZ offsets prevent z-fighting between stacked
 * quadrants once a fold completes — without them the surfaces interleave
 * and flicker.
 */
export function Paper({ folds, dragProgress, dragDirection }: PaperProps) {
  const f1 = folds >= 1 ? 1 : dragDirection === 'h' ? dragProgress : 0;
  const f2 = folds >= 2 ? 1 : dragDirection === 'v' ? dragProgress : 0;

  const rotX = f1 * 180;
  const rotY = -f2 * 180;
  const lift1 = Math.sin(f1 * Math.PI) * 24;
  const lift2 = Math.sin(f2 * Math.PI) * 18;

  const transforms = {
    tl: 'translateZ(0)',
    tr: `rotateY(${rotY}deg) translateZ(${lift2 + 2}px)`,
    bl: `rotateX(${rotX}deg) translateZ(${lift1 + 2}px)`,
    br: `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${lift1 + lift2 + 4}px)`,
  } as const;

  const dragging = dragDirection !== null;

  return (
    <div
      className="paper-3d"
      data-folds={folds}
      role="img"
      aria-label="Paper square"
    >
      <div className="paper-crease-guides" aria-hidden>
        <div className={`paper-crease h${folds >= 1 ? ' is-solid' : ''}`} />
        <div className={`paper-crease v${folds >= 2 ? ' is-solid' : ''}`} />
      </div>

      <Quad pos="tl" transform={transforms.tl} dragging={dragging} />
      <Quad pos="tr" transform={transforms.tr} dragging={dragging} />
      <Quad pos="bl" transform={transforms.bl} dragging={dragging} />
      <Quad pos="br" transform={transforms.br} dragging={dragging} />

      <QuadLabels folds={folds} />
    </div>
  );
}
