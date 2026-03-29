# 희빈 장씨: 궁중 연타전

웹캠 앞에서 손을 준비 자세로 모았다가 타이밍 레일이 빛나는 순간 휘둘러 공격하는, 조선 숙종 대 궁중 암투 모티프의 레트로 2D 브라우저 게임입니다.

## 기술 스택

- React + TypeScript + Vite
- MediaPipe Tasks Vision Pose Landmarker
- Web Audio API
- CSS/SVG 기반 레트로 궁중 아케이드 연출

## 실행 방법

```powershell
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:4173` 을 열고 웹캠 권한을 허용하면 됩니다.

빌드 검증:

```powershell
npm run build
```

## 웹캠 인식 방식

- `MediaPipe Pose Landmarker` 기반 상체 포즈 인식
- 손목과 어깨의 상대 위치로 준비 상태 판정
- 준비 상태가 유지된 뒤 가로 스와이프 거리와 속도가 기준 이상이면 공격 이벤트 발동
- 판정 요소:
  - 준비 상태 유지
  - 타이밍 윈도우
  - 이동 거리
  - 속도
  - 방향 일치

## 튜닝 포인트

- `src/lib/motion/types.ts`
  - `DEFAULT_MOTION_SETTINGS`
- `src/data/rounds.ts`
  - 라운드별 체력
  - 제한 시간
  - Perfect / Good 윈도우
  - 페이크 / 가드 / 반격 패턴
- `src/data/difficulties.ts`
  - 난이도별 타이밍 창 보정
  - 체뤥 배수
  - 칩 데미지 배수

## placeholder asset 정리

- 외부 이미지 스프라이트 없이 SVG와 CSS 레이어로 캐릭터/배경 생성
- 사운드는 별도 음원 파일 없이 Web Audio API 톤으로 생성
- 포즈 모델은 MediaPipe 공식 호스팅 모델 사용

## 직접 확인 체크리스트

- [x] 개발 서버 기동
- [x] 프로덕션 빌드
- [x] 화면 전환 구조
- [x] 6개 라운드 데이터 연결
- [x] 웹캠 권한 요청 코드 경로
- [x] 디버그 모드와 모의 타격 입력

## 향후 개선 아이디어

- 손 랜드마크 보조 모드 추가
- 라운드별 고유 BGM 패턴 분리
- 실제 컷아웃 스프라이트와 파티클 캔버스 이펙트 추가
- 보스전 전용 가드 브레이크 연출 강화
- 저장 / 진행௃叄 시스템 추가
