export const getPagination = (query: Record<string, unknown>) => {
  const parseInteger = (value: unknown) => {
    if (typeof value !== 'string' && typeof value !== 'number') return undefined;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
  };

  const page = Math.min(parseInteger(query.page) ?? 1, 10_000);
  const limit = Math.min(parseInteger(query.limit) ?? 10, 100);
  return { page, limit };
};

export const getSearchTerm = (value: unknown) =>
  typeof value === 'string' ? value.trim().slice(0, 100) : '';

export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
