export interface StoryScene {
  id: string;
  heading: string;
  body: string;
}

export const STORY_SCENES: StoryScene[] = [
  {
    id: "scene-1",
    heading: "숙종의 밤",
    body: "궁궐의 등불이 흔들리는 밤, 숙종의 총애를 둘러싼 경쟁은 조용한 미소 속에서 더욱 뜨거워진다.",
  },
  {
    id: "scene-2",
    heading: "비단 뒤의 긴장",
    body: "희빈 장씨는 오늘 밤만큼은 주저하지 않기로 한다. 궁중의 눈빛, 발걸음, 손짓까지 모두 승부의 일부다.",
  },
  {
    id: "scene-3",
    heading: "타이밍의 정치",
    body: "정치도 감정도 한 박자 빠르거나 늦으면 흐름을 빼앗긴다. 이곳에서는 반 박자의 용기가 총애를 가른다.",
  },
  {
    id: "scene-4",
    heading: "궁중 연타전 개막",
    body: "꽃잎, 먹 번짐, 비녀 소리와 함께 오늘 밤의 궁중 아케이드가 시작된다.",
  },
];
