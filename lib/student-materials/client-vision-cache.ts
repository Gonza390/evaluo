export const CLIENT_VISION_MAX_PAGES = 48;

export function buildClientVisionPagePath(filePath: string, pageNumber: number) {
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > CLIENT_VISION_MAX_PAGES) {
    throw new Error('Número de página visual inválido.');
  }

  return `${filePath}.client-vision/page-${String(pageNumber).padStart(3, '0')}.png`;
}

export function buildClientVisionPagePaths(
  filePath: string,
  pageNumbers: number[]
) {
  return [...new Set(pageNumbers)]
    .filter(
      (pageNumber) =>
        Number.isInteger(pageNumber) &&
        pageNumber >= 1 &&
        pageNumber <= CLIENT_VISION_MAX_PAGES
    )
    .sort((left, right) => left - right)
    .map((pageNumber) => buildClientVisionPagePath(filePath, pageNumber));
}
