export function sortCheckedToBottom<T extends { checked: boolean }>(
  items: T[],
): T[] {
  const unchecked = items.filter((item) => !item.checked);
  const checked = items.filter((item) => item.checked);
  return [...unchecked, ...checked];
}

export function sortByCategory<T extends { category: string }>(
  items: T[],
  categoryOrder: string[],
): T[] {
  return [...items].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a.category);
    const indexB = categoryOrder.indexOf(b.category);
    const orderA = indexA === -1 ? categoryOrder.length : indexA;
    const orderB = indexB === -1 ? categoryOrder.length : indexB;
    return orderA - orderB;
  });
}
