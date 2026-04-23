export function extractApiErrorMessage(error, fallback = 'Something went wrong.') {
  const fieldErrors = error?.response?.data?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstFieldError = Object.values(fieldErrors).find(Boolean);
    if (firstFieldError) return firstFieldError;
  }

  return error?.response?.data?.message || fallback;
}
