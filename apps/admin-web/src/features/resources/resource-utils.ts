export function getValueByPath(record: Record<string, unknown>, path: string) {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, record);
}

export function formatCellValue(value: unknown) {
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

export function toInputValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return String(value);
}
