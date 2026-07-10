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
  const bodyPath = getBodyPath(profile.bodyShape);
  const secondaryColor = profile.secondaryColor ?? "#fff";

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
        d={bodyPath}
        fill={profile.bodyColor}
        filter="url(#soft-shadow)"
      />
      <path
        d={getBellyPath(profile.bodyShape)}
        fill={secondaryColor}
        opacity="0.42"
      />
      <SpeciesMarks profile={profile} />
      <Limbs profile={profile} />
      <Accessory profile={profile} />
      <circle cx="84" cy="114" fill="#111827" r={face.eyeRadius} />
      <circle cx="136" cy="114" fill="#111827" r={face.eyeRadius} />
      {face.sleepMarks}
      <Muzzle profile={profile} />
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

  if (profile.species === "seal" || profile.species === "penguin" || profile.species === "bird" || profile.species === "frog") {
    return null;
  }

  if (profile.species === "rabbit") {
    return (
      <g transform={transform}>
        <path
          d="M70 65C58 27 39 10 28 18c-12 9-2 48 27 69Z"
          fill={profile.accentColor}
        />
        <path d="M59 64C51 38 40 27 35 30c-6 5 2 29 21 44Z" fill="#fff" opacity="0.45" />
      </g>
    );
  }

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

function Limbs({ profile }: { profile: AvatarProfile }) {
  if (profile.species === "seal") {
    return (
      <g fill={profile.accentColor} opacity="0.92">
        <path d="M63 150c-24 8-37 23-31 34 7 12 37 3 52-20Z" />
        <path d="M157 150c24 8 37 23 31 34-7 12-37 3-52-20Z" />
      </g>
    );
  }

  if (profile.species === "penguin" || profile.species === "bird") {
    return (
      <g fill={profile.accentColor} opacity="0.9">
        <path d="M58 129c-24 9-35 27-24 37 12 11 31-5 42-26Z" />
        <path d="M162 129c24 9 35 27 24 37-12 11-31-5-42-26Z" />
      </g>
    );
  }

  if (profile.species === "frog") {
    return (
      <g fill={profile.accentColor} opacity="0.9">
        <circle cx="58" cy="162" r="17" />
        <circle cx="162" cy="162" r="17" />
      </g>
    );
  }

  return (
    <g fill={profile.accentColor} opacity="0.5">
      <ellipse cx="67" cy="166" rx="15" ry="19" />
      <ellipse cx="153" cy="166" rx="15" ry="19" />
    </g>
  );
}

function Muzzle({ profile }: { profile: AvatarProfile }) {
  if (profile.muzzleStyle === "beak") {
    return <path d="M102 127 110 141 118 127Z" fill="#f59e0b" />;
  }

  if (profile.species === "frog") {
    return (
      <path
        d="M88 133c11 9 33 9 44 0"
        fill="none"
        stroke="#111827"
        strokeLinecap="round"
        strokeWidth="4"
      />
    );
  }

  if (profile.muzzleStyle === "none") {
    return null;
  }

  return (
    <g>
      <ellipse cx="110" cy="129" fill="#fff" opacity="0.5" rx="25" ry="17" />
      <path d="M104 123c4-4 9-4 13 0-2 6-10 6-13 0Z" fill="#111827" />
    </g>
  );
}

function SpeciesMarks({ profile }: { profile: AvatarProfile }) {
  if (profile.species === "panda") {
    return (
      <g fill="#111827" opacity="0.72">
        <ellipse cx="82" cy="113" rx="16" ry="20" transform="rotate(-16 82 113)" />
        <ellipse cx="138" cy="113" rx="16" ry="20" transform="rotate(16 138 113)" />
      </g>
    );
  }

  if (profile.species === "penguin") {
    return <path d="M75 84c20 19 50 19 70 0 7 23 2 67-35 83-37-16-42-60-35-83Z" fill="#fff" opacity="0.72" />;
  }

  if (profile.species === "cat" || profile.species === "fox") {
    return (
      <g stroke="#111827" strokeLinecap="round" strokeWidth="3" opacity="0.38">
        <path d="M62 126h28" />
        <path d="M64 137h27" />
        <path d="M130 126h28" />
        <path d="M129 137h27" />
      </g>
    );
  }

  if (profile.species === "sheep") {
    return (
      <g fill="#fff" opacity="0.62">
        <circle cx="77" cy="70" r="15" />
        <circle cx="99" cy="61" r="16" />
        <circle cx="122" cy="62" r="16" />
        <circle cx="144" cy="72" r="14" />
      </g>
    );
  }

  return null;
}

function getBodyPath(bodyShape: AvatarProfile["bodyShape"]) {
  if (bodyShape === "oval") {
    return "M46 116c0-44 27-76 64-76s64 32 64 76c0 48-27 77-64 77s-64-29-64-77Z";
  }

  if (bodyShape === "pear") {
    return "M58 110c0-42 22-70 52-70s52 28 52 70c0 50-22 83-52 83s-52-33-52-83Z";
  }

  return "M53 104c0-42 26-73 58-73 34 0 57 31 57 73v19c0 43-23 70-57 70-35 0-58-27-58-70v-19Z";
}

function getBellyPath(bodyShape: AvatarProfile["bodyShape"]) {
  if (bodyShape === "oval") {
    return "M74 104c15-17 56-17 72 0 9 35-5 67-36 67s-45-32-36-67Z";
  }

  if (bodyShape === "pear") {
    return "M79 105c14-15 48-15 62 0 10 35-3 63-31 63s-41-28-31-63Z";
  }

  return "M74 75c12-18 32-26 54-21 18 4 31 17 37 36-13-14-30-22-49-22-17 0-31 3-42 7Z";
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
