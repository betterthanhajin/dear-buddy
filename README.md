# Dear Buddy

Dear Buddy는 사용자가 아끼는 인형이나 반려 대상 사진을 올리면, 사진 속 특징을 바탕으로 작은 도트 버디를 만들고 다마고치처럼 돌볼 수 있는 모바일 우선 브라우저 앱입니다.

## 현재 MVP

- 사진 업로드와 브라우저 미리보기
- 사진의 대표 색 추출
- OpenAI Vision으로 사진 속 대상 분석
- 강아지, 고양이, 물개, 펭귄, 새, 여우 등 감지된 종류에 맞춘 버디 프로필 생성
- 감지된 종류를 사용자가 직접 보정하는 선택지
- 이미지 생성 모델로 PNG 버디 생성
- 이미지 생성 실패 또는 API 키가 없을 때 SVG 버디로 대체 생성
- idle, 쓰다듬기, 밥주기, 놀아주기, 재우기 액션 이미지 생성
- 생성 직후 idle 이미지를 먼저 보여주고, 나머지 돌봄 표정은 백그라운드에서 준비
- 버디 이름 지정
- 행복도, 포만감, 기운, 경험치, 레벨 관리
- 하루 단위 돌봄 보너스와 방치 시간에 따른 상태 감소
- 상점 구매, 아이템 사용, 방 꾸미기, 놀이 보상, 컬렉션 화면
- localStorage 저장과 새로고침 복원
- 큰 생성 이미지는 IndexedDB에 저장하고, localStorage에는 작은 상태만 저장
- 저장된 버디 초기화

## 저장과 API 사용

사진은 서버 파일 시스템에 저장하지 않습니다. 브라우저에서 읽은 이미지 데이터 URL을 Next.js Route Handler로 보내 분석과 이미지 생성을 요청합니다.

`OPENAI_API_KEY`가 있으면 서버에서만 OpenAI API를 호출합니다. 키가 없거나 API 호출에 실패하면 앱은 로컬 SVG 버디로 계속 진행합니다. 브라우저에는 API 키를 노출하지 않습니다.

생성된 PNG는 용량이 커질 수 있어 IndexedDB에 저장합니다. IndexedDB 저장에 실패하면 PNG를 제외하고 버디 프로필과 상태만 저장합니다.

## 실행

```bash
npm install
npm run dev
```

기본 개발 서버는 `http://localhost:3000`에서 실행됩니다.

## 환경 변수

`.env`에 다음 값을 둘 수 있습니다.

```bash
OPENAI_API_KEY=...
OPENAI_VISION_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
```

`OPENAI_VISION_MODEL`과 `OPENAI_IMAGE_MODEL`은 생략하면 기본값을 사용합니다.

## 검증

```bash
npm test
npm run lint
npm run build
```

테스트는 Node.js 기본 test runner와 `--experimental-strip-types`로 실행합니다.

## 다음 후보

- 여러 버디 저장
- 성장 단계별 외형 변화
- 실제 사진 샘플로 생성 품질 검수
- 더 다양한 방 꾸미기 아이템
- 모바일 홈 화면 설치 경험 개선
