import BuddyCard from "@/components/BuddyCard";

type Buddy = {
  id: string;
  name: string;
  level: number;
  exp: number;
  hunger: number;
  mood: "happy" | "sad" | "sleep";
  image: string;
};

const buddy: Buddy = {
  id: "0",
  name: "깨롱",
  level: 1,
  exp: 20,
  hunger: 80,
  mood: "happy",
  image: "",
};

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <BuddyCard buddy={buddy} />
    </main>
  );
}