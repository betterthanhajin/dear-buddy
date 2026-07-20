"use client";

import Image from "next/image";
import { useState } from "react";

import { INITIAL_TAMAGOTCHI_STATE, petBuddy } from "@/lib/tamagotchi";

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
              className={
                state.reactionId > 0
                  ? `${styles.pet} ${styles.petReacting}`
                  : styles.pet
              }
              height={1024}
              key={`pet-${state.reactionId}`}
              priority
              src="/tamagotchi/idle-pet.png"
              width={1024}
            />
            {state.reactionId > 0 ? (
              <span
                className={styles.reaction}
                key={`reaction-${state.reactionId}`}
              >
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
                    style={{
                      width: `${
                        stat.label === "LOVE" ? state.affection : stat.value
                      }%`,
                    }}
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
