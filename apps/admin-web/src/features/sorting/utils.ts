export function moveItemById<T>(
  items: T[],
  getId: (item: T) => number,
  draggedId: number,
  targetId: number,
) {
  const fromIndex = items.findIndex((item) => getId(item) === draggedId);
  const toIndex = items.findIndex((item) => getId(item) === targetId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export async function persistSequentialSort<T>(
  items: T[],
  getId: (item: T) => number,
  updateSort: (id: number, sortOrder: number) => Promise<unknown>,
) {
  for (let index = 0; index < items.length; index += 1) {
    await updateSort(getId(items[index]), index + 1);
  }
}
