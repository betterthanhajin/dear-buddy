type PaletteResult = {
  photoDataUrl: string;
  dominantColor: string;
  accentColor: string;
};

export async function extractPaletteFromImage(file: File): Promise<PaletteResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  const photoDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(photoDataUrl);
  const dominantColor = sampleDominantColor(image);

  return {
    photoDataUrl,
    dominantColor,
    accentColor: createAccentColor(dominantColor),
  };
}

export function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function createAccentColor(hexColor: string) {
  const { red, green, blue } = parseHexColor(hexColor);
  const shouldDarken = getLuminance(red, green, blue) > 170;
  const target = shouldDarken ? 0 : 255;
  const amount = shouldDarken ? 0.2 : 0.4;

  return rgbToHex(
    mixChannel(red, target, amount),
    mixChannel(green, target, amount),
    mixChannel(blue, target, amount),
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("이미지를 읽지 못했습니다."));
    });

    reader.addEventListener("error", () => {
      reject(new Error("이미지를 읽지 못했습니다."));
    });

    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => {
      reject(new Error("이미지를 분석하지 못했습니다."));
    });

    image.src = source;
  });
}

function sampleDominantColor(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const size = 24;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("이미지를 분석하지 못했습니다.");
  }

  context.drawImage(image, 0, 0, size, size);

  const pixels = context.getImageData(0, 0, size, size).data;
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3];

    if (alpha < 32) {
      continue;
    }

    red += pixels[index];
    green += pixels[index + 1];
    blue += pixels[index + 2];
    count += 1;
  }

  if (count === 0) {
    return "#d9b99b";
  }

  return rgbToHex(
    Math.round(red / count),
    Math.round(green / count),
    Math.round(blue / count),
  );
}

function parseHexColor(hexColor: string) {
  const normalized = hexColor.replace("#", "");

  if (!/^[\da-f]{6}$/i.test(normalized)) {
    return { red: 217, green: 185, blue: 155 };
  }

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function getLuminance(red: number, green: number, blue: number) {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function mixChannel(value: number, target: number, amount: number) {
  return clampChannel(Math.round(value + (target - value) * amount));
}

function clampChannel(value: number) {
  return Math.min(Math.max(Math.round(value), 0), 255);
}
