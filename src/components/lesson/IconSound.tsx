export type IconSoundProps = {
  readonly muted?: boolean;
};

export function IconSound({ muted = false }: IconSoundProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M3 7v4h3l4 3V4L6 7H3z" fill="currentColor" />
      {muted ? (
        <path d="M12 6l5 6M17 6l-5 6" />
      ) : (
        <>
          <path d="M12 6c1.5 1 1.5 5 0 6" />
          <path d="M14 4c2.5 2 2.5 8 0 10" />
        </>
      )}
    </svg>
  );
}
