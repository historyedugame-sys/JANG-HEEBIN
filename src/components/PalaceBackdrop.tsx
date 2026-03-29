export function PalaceBackdrop({ theme }: { theme: string }) {
  return (
    <div className={`palace-backdrop theme-${theme}`}>
      <div className="palace-layer palace-sky" />
      <div className="palace-layer palace-columns" />
      <div className="palace-layer palace-lanterns" />
      <div className="palace-layer palace-petals" />
    </div>
  );
}
