export function extractError(e: any): string {
  if (e?.status === 0) return 'Cannot reach the server. Is the API running?';
  if (e?.error?.message) return e.error.message;
  const errors = e?.error?.errors;
  if (errors) {
    const first = (Object.values(errors).flat() as unknown[])[0];
    if (first) return String(first);
  }
  return 'Something went wrong. Please try again.';
}
