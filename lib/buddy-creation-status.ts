export type BuddyCreationStage = "idle" | "reading" | "analyzing" | "generating";

type BuddyCreationStatus = {
  isBusy: boolean;
  message: string;
};

export function getBuddyCreationStatus(stage: BuddyCreationStage): BuddyCreationStatus {
  if (stage === "reading") {
    return {
      isBusy: true,
      message: "사진을 불러오고 있어요.",
    };
  }

  if (stage === "analyzing") {
    return {
      isBusy: true,
      message: "사진 속 버디를 살펴보고 있어요.",
    };
  }

  if (stage === "generating") {
    return {
      isBusy: true,
      message: "버디 이미지를 그리고 있어요. 잠시만 기다려 주세요.",
    };
  }

  return {
    isBusy: false,
    message: "",
  };
}
