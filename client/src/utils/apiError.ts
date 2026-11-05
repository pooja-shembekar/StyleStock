export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null || !('data' in error)) return fallback;
  const { data } = error;
  if (typeof data !== 'object' || data === null || !('message' in data)) return fallback;
  return typeof data.message === 'string' ? data.message : fallback;
};
