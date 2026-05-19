import type { ReactNode } from 'react';
import { PaperFrac } from './PaperFrac';

export type QuadLabelsProps = {
  readonly folds: 0 | 1 | 2;
};

/**
 * 2×2 grid overlay that stamps the appropriate fraction on each
 * quadrant once the paper has been folded. At 0 folds nothing renders
 * (the big "1" overlay is drawn elsewhere). At 1 fold the top row reads
 * ½ confidently and the bottom row mirrors faintly. At 2 folds the
 * top-left reads ¼ confidently and the other three mirror faintly.
 */
export function QuadLabels({ folds }: QuadLabelsProps) {
  const cells = labelsFor(folds);
  const keys = ['tl', 'tr', 'bl', 'br'] as const;

  return (
    <div className="paper-quad-labels" aria-hidden>
      {keys.map((k, i) => (
        <div
          key={k}
          className="paper-quad-label"
          style={{
            opacity: cells[i] ? (i === 0 && folds >= 1 ? 0.92 : 0.55) : 0,
          }}
        >
          {cells[i]}
        </div>
      ))}
    </div>
  );
}

function labelsFor(folds: 0 | 1 | 2): readonly (ReactNode | null)[] {
  if (folds === 0) return [null, null, null, null];
  if (folds === 1) {
    return [
      <PaperFrac key="tl" n={1} d={2} big />,
      <PaperFrac key="tr" n={1} d={2} big />,
      <PaperFrac key="bl" n={1} d={2} />,
      <PaperFrac key="br" n={1} d={2} />,
    ];
  }
  return [
    <PaperFrac key="tl" n={1} d={4} big />,
    <PaperFrac key="tr" n={1} d={4} />,
    <PaperFrac key="bl" n={1} d={4} />,
    <PaperFrac key="br" n={1} d={4} />,
  ];
}
