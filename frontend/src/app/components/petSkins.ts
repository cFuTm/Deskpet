export type PetSkinId =
  | "normal"
  | "happy"
  | "thinking"
  | "surprised"
  | "sleepy"
  | "angry"
  | "shy"
  | "sad"
  | "contempt";

const skinIds: PetSkinId[] = [
  "normal",
  "happy",
  "thinking",
  "surprised",
  "sleepy",
  "angry",
  "shy",
  "sad",
  "contempt",
];

const skinModules = (import.meta as ImportMeta & {
  glob: <T = unknown>(pattern: string, options?: { eager?: boolean; import?: string }) => Record<string, T>;
}).glob<string>("../../assets/pet-skins/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const skinAssets = Object.fromEntries(
  Object.entries(skinModules).map(([path, url]) => {
    const filename = path.split("/").pop()?.replace(".png", "") ?? "";
    return [filename, url];
  }),
) as Partial<Record<PetSkinId, string>>;

function createPlaceholderSkin(id: PetSkinId) {
  const colorMap: Record<PetSkinId, string> = {
    normal: "#76A072",
    happy: "#FFD166",
    thinking: "#9CA3AF",
    surprised: "#FFA500",
    sleepy: "#7C83B8",
    angry: "#EF4444",
    shy: "#FFB5D5",
    sad: "#3B82F6",
    contempt: "#8B5CF6",
  };

  const color = colorMap[id];
  const eye =
    id === "sleepy"
      ? '<path d="M80 132c9 7 18 7 27 0M133 132c9 7 18 7 27 0" fill="none" stroke="#3c3530" stroke-width="7" stroke-linecap="round"/>'
      : '<circle cx="88" cy="132" r="10" fill="#3c3530"/><circle cx="152" cy="132" r="10" fill="#3c3530"/>';
  const mouth =
    id === "sad"
      ? '<path d="M98 172c14-11 30-11 44 0" fill="none" stroke="#3c3530" stroke-width="8" stroke-linecap="round"/>'
      : id === "surprised"
        ? '<ellipse cx="120" cy="166" rx="13" ry="16" fill="#3c3530" opacity="0.9"/>'
        : '<path d="M96 166c15 13 33 13 48 0" fill="none" stroke="#3c3530" stroke-width="8" stroke-linecap="round"/>';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="body" x1="48" y1="32" x2="196" y2="216" gradientUnits="userSpaceOnUse">
          <stop stop-color="${color}" stop-opacity="0.96"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0.72"/>
        </linearGradient>
        <radialGradient id="shine" cx="35%" cy="28%" r="60%">
          <stop stop-color="#ffffff" stop-opacity="0.58"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="208" rx="62" ry="14" fill="#3c3530" opacity="0.12"/>
      <path d="M76 76c4-34 28-46 44-18 16-28 40-16 44 18 28 14 46 42 46 76 0 45-35 76-90 76s-90-31-90-76c0-34 18-62 46-76Z" fill="url(#body)"/>
      <path d="M76 76c4-34 28-46 44-18 16-28 40-16 44 18 28 14 46 42 46 76 0 45-35 76-90 76s-90-31-90-76c0-34 18-62 46-76Z" fill="url(#shine)"/>
      <circle cx="72" cy="154" r="14" fill="#ffffff" opacity="0.28"/>
      <circle cx="168" cy="154" r="14" fill="#ffffff" opacity="0.28"/>
      ${eye}
      ${mouth}
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const petSkins = Object.fromEntries(
  skinIds.map((id) => [id, skinAssets[id] ?? createPlaceholderSkin(id)]),
) as Record<PetSkinId, string>;
