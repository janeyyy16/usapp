/**
 * OFFLINE part-status governance helpers.
 *
 * Items 6 & 7 from the spec:
 *  - After a ticket is CLAIMED or DATA CLOSED, only the Claims Department
 *    (or Naveen) may change a part's status.
 *  - If anyone else attempts a change, the control is locked AND a
 *    notification is fired to Naveen, Ian, and Tina.
 *
 * In this offline build there's no backend, so notifications are pushed to a
 * local in-memory/localStorage queue that the NotificationsMenu reads.
 */

export const CLAIM_LOCK_STATUSES = ["Claimed", "CL-Claimed", "Data Closed", "DATA CLOSED"];

// Roles allowed to change part status after claim/data-close.
export const CLAIM_EXEMPT_ROLES = ["CLAIMS", "CLAIMS_MANAGER", "ADMIN", "SUPERADMIN"];

// Named supervisors always notified on a tamper attempt.
export const TAMPER_NOTIFY = ["Naveen Lakhani", "Ian Montesclaros", "Tina"];

const NOTIF_KEY = "ahs:offline:notifications";

export interface OfflineNotif {
  id: string;
  kind: "claim_part_tamper" | "tech_eod_reminder" | "restock_auto" | "system";
  title: string;
  body: string;
  ticketNo?: string;
  isRead: boolean;
  createdAt: string;
}

export function pushOfflineNotification(n: Omit<OfflineNotif, "id" | "isRead" | "createdAt">) {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    const list: OfflineNotif[] = raw ? JSON.parse(raw) : [];
    list.unshift({
      ...n,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(list.slice(0, 50)));
    // Notify any open listeners (NotificationsMenu) in the same tab.
    window.dispatchEvent(new CustomEvent("ahs-notif-updated"));
  } catch {
    /* ignore */
  }
}

export function getOfflineNotifications(): OfflineNotif[] {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markOfflineNotifRead(id: string) {
  const list = getOfflineNotifications().map((n) => (n.id === id ? { ...n, isRead: true } : n));
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("ahs-notif-updated"));
}

export function markAllOfflineNotifsRead() {
  const list = getOfflineNotifications().map((n) => ({ ...n, isRead: true }));
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("ahs-notif-updated"));
}

/** Is this ticket status one that locks part-status edits? */
export function isClaimLocked(ticketStatus: string | undefined | null): boolean {
  if (!ticketStatus) return false;
  const s = ticketStatus.toUpperCase();
  return CLAIM_LOCK_STATUSES.some((locked) => s.includes(locked.toUpperCase()));
}

/** Can this role change part status given the ticket's claim-lock state? */
export function canChangePartStatus(role: string | undefined | null, ticketStatus: string | undefined | null): boolean {
  if (!isClaimLocked(ticketStatus)) return true;
  const r = (role ?? "").toUpperCase();
  return CLAIM_EXEMPT_ROLES.includes(r);
}

/** Fire the tamper notification to Naveen/Ian/Tina. */
export function fireTamperNotification(actor: string, ticketNo: string | undefined, attemptedStatus: string) {
  pushOfflineNotification({
    kind: "claim_part_tamper",
    title: "Unauthorized part status change attempt",
    body: `${actor || "A user"} attempted to set part status to "${attemptedStatus}" on ticket ${ticketNo || "(unknown)"} after it was claimed/data-closed. Change was blocked. Notifying Naveen, Ian, and Tina.`,
    ticketNo,
  });
}
