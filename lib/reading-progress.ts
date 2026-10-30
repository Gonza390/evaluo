/** Reading position (furthest summary chapter reached), stored per browser and PDF. */
export function readingProgressKey(materialId: string) {
  return `evaluo_summary_reading_progress_v1:${materialId}`;
}
export function readReadingProgress(materialId: string, chapterCount: number): number {
  if (typeof window === 'undefined' || chapterCount <= 0) return 0;
  try {
    const value = Number(window.localStorage.getItem(readingProgressKey(materialId)) ?? 0);
    if (!Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, Math.round((Math.min(chapterCount, Math.max(0, value)) / chapterCount) * 100)));
  } catch {
    return 0;
  }
}
export function saveReadingPosition(materialId: string, chapterIndex: number, chapterCount: number) {
  if (typeof window === 'undefined' || chapterCount <= 0 || !Number.isInteger(chapterIndex)) return;
  try {
    const key = readingProgressKey(materialId);
    const previous = Number(window.localStorage.getItem(key) ?? 0);
    const next = Math.min(chapterCount, Math.max(0, chapterIndex + 1, Number.isFinite(previous) ? previous : 0));
    if (next > previous) window.localStorage.setItem(key, String(next));
  } catch {
    // Reading remains available if browser storage is disabled.
  }
}
