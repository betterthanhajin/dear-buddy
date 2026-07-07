"use client";

import { useState } from "react";

type Buddy = {
  id: string;
  name: string;
  level: number;
  exp: number;
  hunger: number;
  mood: "happy" | "sad" | "sleep";
  image: string;
};

type BuddyCardProps = {
  buddy: Buddy;
};

export default function BuddyCard({ buddy }: BuddyCardProps) {
  const [affection, setAffection] = useState(30);
  const [isHappy, setIsHappy] = useState(false);
  const [hearts, setHearts] = useState<number[]>([]);
  const [hunger, setHunger] = useState(buddy.hunger);
  const [totalExp, setTotalExp] = useState(buddy.exp);

  const level = Math.floor(totalExp / 100) + 1;
  const exp = totalExp % 100;


const showReaction = () => {
    setIsHappy(true);

    const id = Date.now();
    setHearts((prev) => [...prev, id]);

    setTimeout(() => {
      setIsHappy(false);
      setHearts((prev) => prev.filter((heartId) => heartId !== id));
    }, 1000);
};

  const handlePet = () => {
  setAffection((prev) => Math.min(prev + 1, 100));
  showReaction();
};

const handleFeed = () => {
  setHunger((prev) => Math.min(prev + 20, 100));
  setAffection((prev) => Math.min(prev + 1, 100));
  showReaction();
};

const handlePlay = () => {
  setHunger((prev) => Math.max(prev - 10, 0));
  setTotalExp((prev) => prev + 20);
  showReaction();
};


  return (
    <section className="w-[320px] rounded-3xl bg-white p-6 shadow-lg">
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={handlePet}
          className="buddy-float relative flex h-32 w-32 items-center justify-center rounded-full bg-amber-100 text-6xl transition-transform active:scale-95"
        >
          {isHappy ? "🥰" : "🧸"}

          {hearts.map((heart) => (
            <span
              key={heart}
              className="absolute -top-2 animate-[heart-pop_1s_ease-out_forwards] text-2xl"
            >
              ❤️
            </span>
          ))}
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900">{buddy.name}</h2>
          <p className="text-sm text-zinc-500">Lv. {level}</p>
        </div>

        <Status label="친밀도" value={affection} />
        <Status label="배고픔" value={hunger} />
        <Status label="경험치" value={exp} />
        <button className="border border-gray-300 rounded-sm p-2" onClick={handleFeed}>밥주기</button>
        <button className="border border-gray-300 rounded-sm p-2" onClick={handlePlay}>놀아주기</button>
      </div>
    </section>
  );
}

function Status({ label, value }: { label: string; value: number }) {
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-sm text-zinc-600">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-200">
        <div
          className="h-2 rounded-full bg-zinc-800"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}