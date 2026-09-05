export function isCouncilUserModeEnabled(): boolean {
  return process.env.COUNCIL_USER_MODE_ENABLED === 'true';
}

export function getAdminUserIds(): string[] {
  const envIds = process.env.ADMIN_USER_IDS || '';
  return envIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isUserAdmin(user: { id?: string; email?: string; role?: string } | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;

  const adminIds = getAdminUserIds();
  if (user.id && adminIds.includes(user.id)) return true;

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email && user.email.toLowerCase() === adminEmail.toLowerCase()) {
    return true;
  }

  return false;
}
