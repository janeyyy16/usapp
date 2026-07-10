/**
 * Employee conduct notes — warnings/mistakes attached to a specific
 * employee, optionally referencing a ticket number. Two-stage review
 * workflow: a submission starts 'pending', a department-level manager
 * reviews it first (approve -> 'manager_approved', reject -> 'rejected'
 * — terminal, since the direct manager already found it invalid), then
 * HR makes the final call on anything that reached 'manager_approved'
 * (-> 'approved' or 'rejected'). Only 'approved' counts as the
 * employee's official record. Company-scoped, no edit — only
 * create/read/delete (delete is for retracting a still-pending
 * submission) plus the review status update.
 *
 * The underlying table is `employee_conduct_notes` (renamed from
 * `csr_agent_notes` in migration 0032 once the feature went cross-
 * department — see that migration for the rename). The exported
 * `CsrAgentNote*` names and `agentProfileId` field here are kept as-is
 * on purpose to avoid a large, low-value rename across every component
 * that already consumes this module; only the SQL layer changed.
 *
 * Once a note clears final review (-> 'approved'), the employee it's
 * about gets a "Warning Issued"/"Mistake Issued" notification via the
 * Firestore notification feed (see notifyEmployeeOfIssuedNote below).
 */

import { supabase } from "./client";
import { sendNotification } from "@/lib/firebase/notifications";
import { isFirebaseReady } from "@/lib/firebase/config";

const TABLE = "employee_conduct_notes";

export type CsrAgentNoteStatus = "pending" | "manager_approved" | "approved" | "rejected";

export interface CsrAgentNote {
  id: string;
  agentProfileId: string;
  type: "warning" | "mistake";
  ticketNo: string | null;
  note: string;
  status: CsrAgentNoteStatus;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  managerReviewedBy: string | null;
  managerReviewedByName: string | null;
  managerReviewedAt: string | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
}

const SELECT = "id, employee_profile_id, type, ticket_no, note, status, created_at, created_by, manager_reviewed_by, manager_reviewed_at, reviewed_by, reviewed_at, author:created_by (display_name, username), manager_reviewer:manager_reviewed_by (display_name, username), reviewer:reviewed_by (display_name, username)";

function fromRow(r: any): CsrAgentNote {
  return {
    id: r.id,
    agentProfileId: r.employee_profile_id,
    type: r.type,
    ticketNo: r.ticket_no,
    note: r.note,
    status: r.status,
    createdBy: r.created_by,
    createdByName: r.author?.display_name || r.author?.username || null,
    createdAt: r.created_at,
    managerReviewedBy: r.manager_reviewed_by,
    managerReviewedByName: r.manager_reviewer?.display_name || r.manager_reviewer?.username || null,
    managerReviewedAt: r.manager_reviewed_at,
    reviewedBy: r.reviewed_by,
    reviewedByName: r.reviewer?.display_name || r.reviewer?.username || null,
    reviewedAt: r.reviewed_at,
  };
}

export async function getAgentNotes(agentProfileId: string): Promise<CsrAgentNote[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT)
    .eq("employee_profile_id", agentProfileId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/** Every note a given Team Leader has submitted (any agent), most recent first — feeds their Recent Activity. */
export async function getNotesSubmittedBy(createdByProfileId: string): Promise<CsrAgentNote[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT)
    .eq("created_by", createdByProfileId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/** Every note company-wide regardless of status — feeds report-level Warnings/Mistakes totals. */
export async function getAllAgentNotes(): Promise<CsrAgentNote[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/**
 * Every note not yet finalized, company-wide — 'pending' (awaiting a
 * department manager's first pass) and 'manager_approved' (awaiting HR's
 * final call). Callers filter to the stage relevant to who's viewing:
 * department managers act on 'pending', HR acts on 'manager_approved'.
 */
export async function getPendingAgentNotes(): Promise<CsrAgentNote[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT)
    .in("status", ["pending", "manager_approved"])
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/**
 * `fastTrackToApproved` is for submitters who already hold final review
 * authority (HR/Admin/Superadmin) — routing their own submission through
 * a department manager first would be redundant, since they can already
 * make the final call. `fastTrackToManagerApproved` is for submitters who
 * are themselves a stage-1 (department manager) reviewer but not stage-2 —
 * their submission skips straight to 'manager_approved' (awaiting HR)
 * instead of sitting in 'pending' for another manager to approve, since
 * they already are that manager. Both reuse the same trigger-stamped
 * transitions `reviewAgentNote` always uses, just chained immediately
 * after insert.
 */
export async function addAgentNote(input: { agentProfileId: string; type: "warning" | "mistake"; ticketNo?: string; note: string; fastTrackToApproved?: boolean; fastTrackToManagerApproved?: boolean }): Promise<void> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      employee_profile_id: input.agentProfileId,
      type: input.type,
      ticket_no: input.ticketNo?.trim() || null,
      note: input.note.trim(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (input.fastTrackToApproved) {
    await reviewAgentNote(data.id, "manager_approved");
    await reviewAgentNote(data.id, "approved");
  } else if (input.fastTrackToManagerApproved) {
    await reviewAgentNote(data.id, "manager_approved");
  }
}

/**
 * Move a note to the next stage. From 'pending': a department manager
 * approves (-> 'manager_approved', on to HR) or rejects (-> 'rejected',
 * terminal). From 'manager_approved': HR approves or rejects, finalizing
 * it. manager_reviewed_by/at and reviewed_by/at are auto-stamped by a DB
 * trigger based on the transition.
 */
export async function reviewAgentNote(id: string, status: "manager_approved" | "approved" | "rejected"): Promise<void> {
  const { data, error } = await supabase.from(TABLE).update({ status }).eq("id", id).select(SELECT).single();
  if (error) throw new Error(error.message);

  if (status === "approved") {
    // Best-effort — a notification failure shouldn't undo or block the
    // review decision, which has already been committed above.
    try {
      await notifyEmployeeOfIssuedNote(fromRow(data));
    } catch (err) {
      console.error("Failed to notify employee of issued note:", err);
    }
  }
}

/** Once a warning/mistake clears final review, let the employee know via their notification bell. */
async function notifyEmployeeOfIssuedNote(note: CsrAgentNote): Promise<void> {
  if (!isFirebaseReady()) {
    console.warn("notifyEmployeeOfIssuedNote: Firebase isn't configured/ready — skipping notification for note", note.id);
    return;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("firebase_uid")
    .eq("id", note.agentProfileId)
    .maybeSingle();
  if (error) {
    console.error("notifyEmployeeOfIssuedNote: failed to look up employee profile:", error.message);
    return;
  }
  if (!profile?.firebase_uid) {
    console.warn("notifyEmployeeOfIssuedNote: employee profile has no firebase_uid — skipping notification for note", note.id, note.agentProfileId);
    return;
  }

  const label = note.type === "warning" ? "Warning" : "Mistake";
  await sendNotification([profile.firebase_uid], {
    kind: "warning_mistake_issued",
    title: `${label} Issued`,
    body: note.note,
    ticketNo: note.ticketNo ?? undefined,
  });
  console.log(`notifyEmployeeOfIssuedNote: sent "${label} Issued" notification to`, profile.firebase_uid);
}

export async function deleteAgentNote(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
