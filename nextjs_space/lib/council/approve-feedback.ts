export function approveErrorMessage(status: number, serverError?: string): string {
  if (status === 403) {
    return 'Admin authorization required — council approvals are admin-only. Your click was recorded.';
  }
  if (serverError) return serverError;
  return 'Approve failed. Check team feed for details.';
}

export function isFallbackSessionId(id: string | undefined): boolean {
  return !id || id.startsWith('session-');
}
