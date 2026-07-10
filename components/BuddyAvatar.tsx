import type { AvatarProfile, BuddyMood } from "@/lib/buddy";

type BuddyAvatarProps = {
  profile: AvatarProfile;
  mood?: BuddyMood;
  size?: "sm" | "md" | "lg";
};

const sizeClassName = {
  sm: "h-24 w-24",
  md: "h-36 w-36",
  lg: "h-48 w-48",
};

export default function BuddyAvatar({
  profile,
  mood = "happy",
  size = "md",
}: BuddyAvatarProps) {
  const face = getFace(mood);

  return (
    <svg
      aria-label="생성된 버디 캐릭터"
      className={sizeClassName[size]}
      role="img"
      viewBox="0 0 220 220"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" floodOpacity="0.18" stdDeviation="10" />
        </filter>
      </defs>
      <Ear profile={profile} side="left" />
      <Ear profile={profile} side="right" />
      <ellipse cx="110" cy="194" fill="#1f2937" opacity="0.12" rx="58" ry="11" />
      <path
        d="M53 104c0-42 26-73 58-73 34 0 57 31 57 73v19c0 43-23 70-57 70-35 0-58-27-58-70v-19Z"
        fill={profile.bodyColor}
        filter="url(#soft-shadow)"
      />
      <path
        d="M74 75c12-18 32-26 54-21 18 4 31 17 37 36-13-14-30-22-49-22-17 0-31 3-42 7Z"
        fill="#fff"
        opacity="0.22"
      />
      <Accessory profile={profile} />
      <circle cx="84" cy="114" fill="#111827" r={face.eyeRadius} />
      <circle cx="136" cy="114" fill="#111827" r={face.eyeRadius} />
      {face.sleepMarks}
      <path
        d={face.mouth}
        fill="none"
        stroke="#111827"
        strokeLinecap="round"
        strokeWidth="6"
      />
      <Cheeks profile={profile} />
    </svg>
  );
}

function Ear({ profile, side }: { profile: AvatarProfile; side: "left" | "right" }) {
  const isLeft = side === "left";
  const transform = isLeft ? "" : "translate(220 0) scale(-1 1)";

  if (profile.earShape === "floppy") {
    return (
      <path
        d="M67 56C48 34 25 33 19 51c-7 22 17 46 42 52l27-29C82 68 76 62 67 56Z"
        fill={profile.accentColor}
        opacity="0.95"
        transform={transform}
      />
    );
  }

  if (profile.earShape === "pointy") {
    return (
      <path
        d="M74 60 47 17 38 73Z"
        fill={profile.accentColor}
        opacity="0.95"
        transform={transform}
      />
    );
  }

  return (
    <circle
      cx="55"
      cy="58"
      fill={profile.accentColor}
      opacity="0.95"
      r="30"
      transform={transform}
    />
  );
}

function Accessory({ profile }: { profile: AvatarProfile }) {
  if (profile.accessory === "patch") {
    return (
      <path
        d="M128 73c13 3 23 12 26 24-12 2-25-2-33-12-4-5-2-11 7-12Z"
        fill="#f8fafc"
        opacity="0.55"
      />
    );
  }

  if (profile.accessory === "star") {
    return (
      <path
        d="m110 52 7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2Z"
        fill={profile.accentColor}
      />
    );
  }

  return (
    <g>
      <path d="M92 66c-18-16-34 4-22 18 7 8 19 5 27-4Z" fill={profile.accentColor} />
      <path d="M128 66c18-16 34 4 22 18-7 8-19 5-27-4Z" fill={profile.accentColor} />
      <circle cx="110" cy="75" fill={profile.accentColor} r="9" />
    </g>
  );
}

function Cheeks({ profile }: { profile: AvatarProfile }) {
  if (profile.cheekStyle === "none") {
    return null;
  }

  const radiusX = profile.cheekStyle === "oval" ? 12 : 7;
  const radiusY = profile.cheekStyle === "oval" ? 7 : 7;

  return (
    <g fill="#fb7185" opacity="0.42">
      <ellipse cx="67" cy="133" rx={radiusX} ry={radiusY} />
      <ellipse cx="153" cy="133" rx={radiusX} ry={radiusY} />
    </g>
  );
}

function getFace(mood: BuddyMood) {
  if (mood === "sleep") {
    return {
      eyeRadius: 0,
      mouth: "M96 139c7 5 21 5 28 0",
      sleepMarks: (
        <g fill="none" stroke="#111827" strokeLinecap="round" strokeWidth="5">
          <path d="M77 113h16" />
          <path d="M128 113h16" />
        </g>
      ),
    };
  }

  if (mood === "sad" || mood === "hungry") {
    return {
      eyeRadius: 7,
      mouth: "M95 145c7-8 23-8 30 0",
      sleepMarks: null,
    };
  }

  return {
    eyeRadius: 7,
    mouth: "M93 139c8 12 27 12 35 0",
    sleepMarks: null,
  };
}
