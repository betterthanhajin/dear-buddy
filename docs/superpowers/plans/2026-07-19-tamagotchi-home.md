# Tamagotchi Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 Dear Buddy 앱을 `/backup`으로 보존하고, `/`에 한 가지 돌봄 반응을 제공하는 모바일 우선 다마고치 기기를 표시합니다.

**Architecture:** 새 화면은 `TamagotchiDevice` 클라이언트 컴포넌트 하나로 구성합니다. 애정 수치와 반응 순번 계산은 `lib/tamagotchi.ts`의 순수 함수로 분리하고, 기존 `DearBuddyApp`과 저장 데이터, API 라우트는 `/backup`에서 그대로 유지합니다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Node test runner, Next Image

## Global Constraints

- `tv-frame.png`는 원본 2:3 비율을 유지합니다.
- `game-scenes.png`는 화면 구성과 픽셀 표현의 참고 자료로만 사용하고 잘라 쓰지 않습니다.
- 새 `/`와 `/backup`은 상태를 공유하지 않습니다.
- 기존 미커밋 파일 `app/globals.css`, `components/BuddyCarePanel.tsx`, `lib/room-presentation.ts`, `tests/room-presentation.test.mts`는 수정하지 않습니다.
- 앱 실행 중 이미지 생성 API나 Vision API를 호출하지 않습니다.
- 애정 수치는 99를 넘지 않습니다.

---

### Task 1: 다마고치 상태 규칙

**Files:**
- Create: `lib/tamagotchi.ts`
- Test: `tests/tamagotchi.test.mts`

**Interfaces:**
- Consumes: 없음
- Produces: `TamagotchiState`, `INITIAL_TAMAGOTCHI_STATE`, `petBuddy(state)`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  INITIAL_TAMAGOTCHI_STATE,
  petBuddy,
} from "../lib/tamagotchi.ts";

test("petBuddy increases affection and advances the reaction sequence", () => {
  assert.deepEqual(petBuddy(INITIAL_TAMAGOTCHI_STATE), {
    affection: 88,
    reactionId: 1,
  });
});

test("petBuddy caps affection at 99", () => {
  assert.deepEqual(petBuddy({ affection: 99, reactionId: 4 }), {
    affection: 99,
    reactionId: 5,
  });
});
```

- [ ] **Step 2: 테스트가 올바르게 실패하는지 확인**

Run: `node --test --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/tamagotchi.test.mts`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lib/tamagotchi.ts`.

- [ ] **Step 3: 최소 구현 작성**

```ts
export type TamagotchiState = {
  affection: number;
  reactionId: number;
};

export const INITIAL_TAMAGOTCHI_STATE: TamagotchiState = {
  affection: 87,
  reactionId: 0,
};

export function petBuddy(state: TamagotchiState): TamagotchiState {
  return {
    affection: Math.min(99, state.affection + 1),
    reactionId: state.reactionId + 1,
  };
}
```

- [ ] **Step 4: 단위 테스트 통과 확인**

Run: `node --test --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/tamagotchi.test.mts`

Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: 상태 규칙 커밋**

```bash
git add lib/tamagotchi.ts tests/tamagotchi.test.mts
git commit -m "feat: add tamagotchi affection state"
```

### Task 2: 백업 라우트 준비

**Files:**
- Create: `app/backup/page.tsx`
- Test: `tests/tamagotchi-routes.test.mts`

**Interfaces:**
- Consumes: `DearBuddyApp`
- Produces: `/backup` 기존 앱 라우트

- [ ] **Step 1: 실패 테스트 작성**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("the backup route preserves the previous Dear Buddy app", () => {
  const source = readFileSync(resolve(repoRoot, "app/backup/page.tsx"), "utf8");

  assert.match(source, /DearBuddyApp/);
});
```

- [ ] **Step 2: 테스트가 올바르게 실패하는지 확인**

Run: `node --test --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/tamagotchi-routes.test.mts`

Expected: FAIL because `app/backup/page.tsx` does not exist.

- [ ] **Step 3: 백업 라우트 파일 작성**

```tsx
import DearBuddyApp from "@/components/DearBuddyApp";

export default function BackupPage() {
  return <DearBuddyApp />;
}
```

- [ ] **Step 4: 라우트 테스트 통과 확인**

Run: `node --test --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/tamagotchi-routes.test.mts`

Expected: 1 test passes, 0 fail.

- [ ] **Step 5: 백업 라우트 커밋**

```bash
git add app/backup/page.tsx tests/tamagotchi-routes.test.mts
git commit -m "feat: preserve previous app at backup route"
```

### Task 3: 픽셀 펫 자산과 다마고치 컴포넌트

**Files:**
- Create: `public/tamagotchi/tv-frame.png`
- Create: `public/tamagotchi/idle-pet.png`
- Create: `components/TamagotchiDevice.tsx`
- Create: `components/TamagotchiDevice.module.css`
- Modify: `app/page.tsx`
- Modify: `tests/tamagotchi-routes.test.mts`
- Test: `tests/tamagotchi-view.test.mts`

**Interfaces:**
- Consumes: `INITIAL_TAMAGOTCHI_STATE`, `petBuddy(state)`, `/tamagotchi/tv-frame.png`, `/tamagotchi/idle-pet.png`
- Produces: 기본 상태와 중앙 버튼 반응을 포함한 `TamagotchiDevice`, 신규 `/` 라우트

- [ ] **Step 1: 제공된 프레임 자산 복사**

Run: `mkdir -p public/tamagotchi && cp /Users/hajin/Documents/agents/dear-buddy-reference/tv-frame.png public/tamagotchi/tv-frame.png`

Expected: `public/tamagotchi/tv-frame.png` exists and remains 1024 x 1536.

- [ ] **Step 2: 픽셀 펫 자산 생성**

Use Image Gen with the exact prompt:

```text
Create one isolated idle pet sprite for a cozy Korean tamagotchi game. Match the supplied game-scenes.png reference: a tiny round white seal-like plush pet, soft pink leaf-shaped tuft on top, black pixel outline, black dot eyes, tiny smiling mouth, pale pink cheeks, short flippers, subtle gray ground shadow. Faithful late-1990s handheld-game pixel art, crisp square pixels, front-facing seated idle pose. No text, no UI, no border, no props. Center the full body with generous empty space on a solid #fffaf3 background. Square 1024 x 1024 composition.
```

Save the selected output as `public/tamagotchi/idle-pet.png`. Remove only the solid `#fffaf3` background when a local image tool can preserve the pixel edges; otherwise retain the matching solid background.

- [ ] **Step 3: 컴포넌트 구조 실패 테스트 작성**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("the tamagotchi device exposes the three physical controls", () => {
  const source = readFileSync(
    resolve(repoRoot, "components/TamagotchiDevice.tsx"),
    "utf8",
  );

  assert.match(source, /aria-label="메뉴 버튼 준비 중"/);
  assert.match(source, /aria-label="버디 쓰다듬기"/);
  assert.match(source, /aria-label="더보기 버튼 준비 중"/);
});

test("the tamagotchi device uses the supplied frame and generated pet assets", () => {
  const source = readFileSync(
    resolve(repoRoot, "components/TamagotchiDevice.tsx"),
    "utf8",
  );

  assert.match(source, /\/tamagotchi\/tv-frame\.png/);
  assert.match(source, /\/tamagotchi\/idle-pet\.png/);
});
```

- [ ] **Step 4: 홈 라우트 실패 테스트 추가**

Append to `tests/tamagotchi-routes.test.mts`:

```ts
test("the home route renders only the new tamagotchi device", () => {
  const source = readFileSync(resolve(repoRoot, "app/page.tsx"), "utf8");

  assert.match(source, /TamagotchiDevice/);
  assert.doesNotMatch(source, /DearBuddyApp/);
});
```

- [ ] **Step 5: 테스트가 올바르게 실패하는지 확인**

Run: `node --test --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/tamagotchi-view.test.mts tests/tamagotchi-routes.test.mts`

Expected: FAIL because `components/TamagotchiDevice.tsx` does not exist and `app/page.tsx` still renders `DearBuddyApp`.

- [ ] **Step 6: 컴포넌트와 홈 라우트 구현**

`app/page.tsx`:

```tsx
import TamagotchiDevice from "@/components/TamagotchiDevice";

export default function Home() {
  return <TamagotchiDevice />;
}
```

`components/TamagotchiDevice.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";

import {
  INITIAL_TAMAGOTCHI_STATE,
  petBuddy,
} from "@/lib/tamagotchi";

import styles from "./TamagotchiDevice.module.css";

const stats = [
  { label: "FOOD", value: 72, tone: "food" },
  { label: "LOVE", value: 87, tone: "love" },
  { label: "REST", value: 64, tone: "rest" },
] as const;

export default function TamagotchiDevice() {
  const [state, setState] = useState(INITIAL_TAMAGOTCHI_STATE);

  return (
    <main className={styles.page}>
      <section aria-label="디어 버디 다마고치" className={styles.device}>
        <Image
          alt="핑크색 다마고치 TV 프레임"
          className={styles.frame}
          fill
          priority
          sizes="(max-width: 480px) calc(100vw - 32px), 420px"
          src="/tamagotchi/tv-frame.png"
        />

        <div className={styles.screen}>
          <header className={styles.hud}>
            <span>Lv.01</span>
            <span>LOVE {state.affection}</span>
          </header>

          <div className={styles.stage}>
            <Image
              alt="분홍 잎사귀를 머리에 얹은 하얀 버디"
              className={state.reactionId > 0 ? `${styles.pet} ${styles.petReacting}` : styles.pet}
              height={1024}
              key={state.reactionId}
              priority
              src="/tamagotchi/idle-pet.png"
              width={1024}
            />
            {state.reactionId > 0 ? (
              <span className={styles.reaction} key={state.reactionId}>
                LOVE +1
              </span>
            ) : null}
          </div>

          <div aria-label="버디 상태" className={styles.stats}>
            {stats.map((stat) => (
              <div className={styles.stat} key={stat.label}>
                <span>{stat.label}</span>
                <i aria-hidden="true">
                  <b
                    className={styles[stat.tone]}
                    style={{ width: `${stat.label === "LOVE" ? state.affection : stat.value}%` }}
                  />
                </i>
              </div>
            ))}
          </div>
        </div>

        <button
          aria-label="메뉴 버튼 준비 중"
          className={`${styles.control} ${styles.menuControl}`}
          disabled
          type="button"
        />
        <button
          aria-label="버디 쓰다듬기"
          className={`${styles.control} ${styles.loveControl}`}
          onClick={() => setState(petBuddy)}
          type="button"
        />
        <button
          aria-label="더보기 버튼 준비 중"
          className={`${styles.control} ${styles.moreControl}`}
          disabled
          type="button"
        />
      </section>
    </main>
  );
}
```

- [ ] **Step 7: 컴포넌트 스타일 작성**

```css
.page {
  display: flex;
  min-height: 100svh;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 16px;
  background: #f7f0e8;
  font-family: var(--font-geist-mono), "Courier New", monospace;
}

.device {
  position: relative;
  width: min(100%, 420px);
  aspect-ratio: 2 / 3;
  flex: none;
}

.frame {
  z-index: 1;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.screen {
  position: absolute;
  z-index: 2;
  top: 11.9%;
  left: 13.4%;
  display: grid;
  width: 73.2%;
  height: 55.2%;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  border: 2px solid #302824;
  border-radius: 15% / 12%;
  background: #fffaf3;
  box-shadow: inset 0 0 18px rgb(74 55 48 / 18%);
  color: #2f2824;
  image-rendering: pixelated;
  padding: 5.5% 6% 6%;
}

.hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #544941;
  padding-bottom: 4%;
  font-size: clamp(11px, 3.2vw, 16px);
  font-weight: 800;
}

.stage {
  position: relative;
  display: flex;
  min-height: 0;
  align-items: center;
  justify-content: center;
}

.pet {
  width: 88%;
  height: auto;
  object-fit: contain;
  image-rendering: pixelated;
}

.petReacting {
  animation: pet-bounce 480ms ease-out both;
}

.reaction {
  position: absolute;
  top: 12%;
  right: 5%;
  border: 1px solid #5f4d45;
  border-radius: 999px;
  background: #fff0ef;
  padding: 4px 7px;
  color: #b64e5b;
  font-size: clamp(9px, 2.5vw, 12px);
  font-weight: 900;
  animation: reaction-pop 650ms ease-out both;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5%;
  border-top: 1px solid #544941;
  padding-top: 5%;
}

.stat {
  display: grid;
  gap: 4px;
  min-width: 0;
  font-size: clamp(8px, 2.4vw, 11px);
  font-weight: 800;
}

.stat i {
  display: block;
  height: 7px;
  overflow: hidden;
  border: 1px solid #3c342f;
  background: #fff;
}

.stat b {
  display: block;
  height: 100%;
}

.food {
  background: #e7b674;
}

.love {
  background: #ed7f8e;
}

.rest {
  background: #8ea6df;
}

.control {
  position: absolute;
  z-index: 3;
  top: 76%;
  width: 19%;
  aspect-ratio: 1;
  border: 0;
  border-radius: 50%;
  background: transparent;
}

.control:focus-visible {
  outline: 3px solid #7f3946;
  outline-offset: 4px;
}

.control:not(:disabled) {
  cursor: pointer;
}

.menuControl {
  left: 12.3%;
}

.loveControl {
  left: 40.5%;
}

.moreControl {
  right: 12.3%;
}

@keyframes reaction-pop {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.85);
  }

  35% {
    opacity: 1;
    transform: translateY(0) scale(1.08);
  }

  100% {
    opacity: 0;
    transform: translateY(-12px) scale(1);
  }
}

@keyframes pet-bounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  45% {
    transform: translateY(-7%) scale(1.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reaction,
  .petReacting {
    animation: none;
  }
}

@media (max-height: 700px) {
  .device {
    width: min(100%, 360px, calc((100svh - 24px) * 2 / 3));
  }
}
```

- [ ] **Step 8: 라우트와 컴포넌트 구조 테스트 통과 확인**

Run: `node --test --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/tamagotchi-view.test.mts tests/tamagotchi-routes.test.mts`

Expected: 4 tests pass, 0 fail.

- [ ] **Step 9: 홈 라우트와 컴포넌트 커밋**

```bash
git add app/page.tsx components/TamagotchiDevice.tsx components/TamagotchiDevice.module.css public/tamagotchi tests/tamagotchi-routes.test.mts tests/tamagotchi-view.test.mts
git commit -m "feat: add tamagotchi home screen"
```

### Task 4: 자동 검증

**Files:**
- Modify: 없음
- Test: 전체 테스트와 정적 검사

**Interfaces:**
- Consumes: Tasks 1-3의 모든 변경
- Produces: 회귀 검증 결과

- [ ] **Step 1: 전체 단위 테스트 실행**

Run: `npm test`

Expected: 기존 47개와 신규 6개 테스트가 모두 통과합니다.

- [ ] **Step 2: 린트 실행**

Run: `npm run lint`

Expected: ESLint exits with code 0 and no warnings.

- [ ] **Step 3: 프로덕션 빌드 실행**

Run: `npm run build`

Expected: Next.js build exits with code 0 and lists `/`, `/backup`, `/api/analyze-buddy`, `/api/generate-buddy-image`.

### Task 5: 브라우저 디자인 검수

**Files:**
- Create: `design-qa.md`
- Modify: `components/TamagotchiDevice.module.css` only when visual differences require correction

**Interfaces:**
- Consumes: `tv-frame.png`, `game-scenes.png`, rendered `/`
- Produces: `design-qa.md` with `final result: passed`

- [ ] **Step 1: 개발 서버 실행**

Run: `npm run dev -- --hostname 0.0.0.0 --port 3000`

Expected: Next.js reports a ready local server on port 3000.

- [ ] **Step 2: 390 x 844 모바일 화면 확인**

Open `/` in the configured browser at 390 x 844. Verify that the full device fits without horizontal scroll, the screen remains inside the black bezel, the pet is not clipped, and the three physical controls align with the frame image.

- [ ] **Step 3: 중앙 버튼 동작 확인**

Click the center physical button. Verify that `LOVE 87` changes to `LOVE 88` and the `LOVE +1` reaction appears.

- [ ] **Step 4: `/backup` 확인**

Open `/backup`. Verify that the previous Dear Buddy creator or saved buddy screen renders without a console error.

- [ ] **Step 5: 데스크톱 화면 확인**

Open `/` at 1280 x 900. Verify that the device remains centered, does not exceed 420 px width, and preserves the 2:3 ratio.

- [ ] **Step 6: 디자인 QA 문서 작성**

Compare the rendered mobile screenshot with both reference images. Record viewport, interaction state, mismatches, fixes, and the final line `final result: passed` in `design-qa.md`. Fix all P0, P1, and P2 findings before marking it passed.

- [ ] **Step 7: 최종 검수 커밋**

```bash
git add components/TamagotchiDevice.module.css design-qa.md
git commit -m "test: verify tamagotchi home design"
```
