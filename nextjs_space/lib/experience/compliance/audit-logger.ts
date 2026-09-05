export interface AuditEntry {
  id: string;
  userId: string;
  actionType: 'OUTREACH_SENT' | 'EXTERNAL_CONNECT' | 'CREDIT_CONSUMPTION' | 'DATA_EXPORT' | 'ADMIN_ACTION';
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

const auditLogStore: AuditEntry[] = [];

export function logAuditEvent(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
  const fullEntry: AuditEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  auditLogStore.unshift(fullEntry);
  if (auditLogStore.length > 500) {
    auditLogStore.pop();
  }
  return fullEntry;
}

export function getAuditLogs(userId?: string, limit: number = 50): AuditEntry[] {
  if (userId) {
    return auditLogStore.filter((l) => l.userId === userId).slice(0, limit);
  }
  return auditLogStore.slice(0, limit);
}