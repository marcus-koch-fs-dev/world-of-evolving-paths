/** Splits path ids into pages. A whole path always stays on one page. */
export function pagesOf(pathIds: readonly string[], pageSize: number): string[][] {
  const size = Math.max(1, Math.floor(pageSize));
  return Array.from({ length: Math.ceil(pathIds.length / size) }, (_, page) =>
    pathIds.slice(page * size, (page + 1) * size),
  );
}
