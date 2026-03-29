import type { PropsWithChildren } from "react";

export function ArcadeFrame({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <div className="arcade-shell">
      <div className="arcade-crt" />
      <div className="arcade-header">
        <span className="arcade-chip">JOSEON RETRO ARCADE</span>
        <h1>{title}</h1>
        <span className="arcade-chip">CAMERA REACTION BATTLE</span>
      </div>
      <div className="arcade-body">{children}</div>
    </div>
  );
}
