/** Provider-neutral contract. No paid provider is configured or called here. */
export const decorSurfaces = ["curtain", "wallpaper", "flooring", "carpet"] as const;
export type DecorSurface = typeof decorSurfaces[number];
export type DecorDesignRequest = {
  room: File;
  material: File;
  surface: DecorSurface;
  details: string;
};
export type DecorDesignResult = { imageUrl: string };
export type DecorDesignGenerator = (request: DecorDesignRequest) => Promise<DecorDesignResult>;

export function validateDecorPhoto(file: File): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "عکس باید JPG، PNG یا WebP باشد.";
  if (file.size === 0 || file.size > 8 * 1024 * 1024) return "حجم هر عکس باید حداکثر ۸ مگابایت باشد.";
  return null;
}
