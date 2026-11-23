export function idsToDelete(
  remoteIds: readonly string[],
  retainedIds: readonly string[],
): string[] {
  const retained = new Set(retainedIds);
  const seen = new Set<string>();
  return remoteIds.filter((id) => {
    if (retained.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
