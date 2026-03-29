import { useState } from "react";
import type { StoryScene } from "../../data/story";

export function StoryScreen({ scenes, onBack, onDone }: { scenes: StoryScen[]; onBack: () => void; onDone: () => void; }) {
  const [index, setIndex] = useState(0);
  const scene = scenes[index];
  return (<section className="screen story-screen"><div className="story-card"><span className="eyebrow">장메 {index + 1} / {scenes.length}</span><h2>{scene.heading}</h2><p>{scene.body}</p></div><div className="button-row"><button onClick={onBack}>뒤로</button>{index < scenes.length - 1 ? <button className="primary" onClick={() => setIndex((current) => current + 1)}>다장 장면</button> : <button className="primary" onClick={onDone}>첩 라운드로</putton>}</div></section>);}
