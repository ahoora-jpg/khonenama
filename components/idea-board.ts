export const IDEA_BOARD_KEY = "khonenama-idea-board-v1";
export const IDEA_BOARD_TITLE_KEY = "khonenama-idea-board-title-v1";

export type SavedIdea = {
  id: string;
  title: string;
  category: string;
  href: string;
  img: string;
};

export function readIdeaBoard(): SavedIdea[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(IDEA_BOARD_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is SavedIdea =>
      !!item && typeof item === "object" &&
      typeof item.id === "string" && typeof item.title === "string" &&
      typeof item.category === "string" && typeof item.href === "string" && typeof item.img === "string",
    );
  } catch {
    return [];
  }
}

export function writeIdeaBoard(items: SavedIdea[]) {
  localStorage.setItem(IDEA_BOARD_KEY, JSON.stringify(items.slice(0, 30)));
}
