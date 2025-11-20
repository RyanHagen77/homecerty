// app/home/_components/ConnectionsModal.tsx
"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { glass, textMeta } from "@/lib/glass";

type ConnectionsModalProps = {
  open: boolean;
  onCloseAction: () => void;
  homeId: string;
  pendingWorkCount: number;
  loadingWork: boolean;
  pendingInvitationsCount: number;
  loadingInvites: boolean;
  pendingJobRequestsCount?: number;
  loadingJobRequests?: boolean;
  onOpenShareAction: () => void;
  onOpenVendorsAction: () => void;
};

export function ConnectionsModal({
  open,
  onCloseAction,
  homeId,
  pendingWorkCount,
  loadingWork,
  pendingInvitationsCount,
  loadingInvites,
  pendingJobRequestsCount = 0,
  loadingJobRequests = false,
  onOpenShareAction,
  onOpenVendorsAction,
}: ConnectionsModalProps) {
  if (!open) return null;

  const hasPendingItems =
    pendingWorkCount > 0 ||
    pendingInvitationsCount > 0 ||
    pendingJobRequestsCount > 0;

  return (
    <Modal open={open} onCloseAction={onCloseAction}>
      <div className="p-6">
        <h2 className="mb-2 text-xl font-bold text-white">Connections & Work</h2>
        <p className={`mb-6 text-sm ${textMeta}`}>
          Manage professionals, pending work, and access for this home.
        </p>

        <div className="space-y-6">
          {/* ========== PENDING ITEMS ========== */}
          {hasPendingItems && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                Needs Attention
              </h3>
              <div className="space-y-2">
                {/* Pending work submissions */}
                {pendingWorkCount > 0 && (
                  <Link
                    href={`/home/${homeId}/completed-work-submissions`}
                    onClick={onCloseAction}
                    className={`${glass} flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 hover:bg-red-500/20`}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        📋 Review Completed Work
                      </p>
                      <p className={`text-xs ${textMeta}`}>
                        Contractors have submitted work for your approval
                      </p>
                    </div>
                    <span className="ml-3 flex-shrink-0 rounded-full bg-red-500/30 px-3 py-1 text-xs font-bold text-red-100">
                      {loadingWork ? "—" : pendingWorkCount}
                    </span>
                  </Link>
                )}

                {/* Pending job requests */}
                {pendingJobRequestsCount > 0 && (
                  <Link
                    href={`/home/${homeId}/requested-jobs`}
                    onClick={onCloseAction}
                    className={`${glass} flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 hover:bg-blue-500/20`}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        💬 Job Requests Pending
                      </p>
                      <p className={`text-xs ${textMeta}`}>
                        Waiting for contractor quotes or your acceptance
                      </p>
                    </div>
                    <span className="ml-3 flex-shrink-0 rounded-full bg-blue-500/30 px-3 py-1 text-xs font-bold text-blue-100">
                      {loadingJobRequests ? "—" : pendingJobRequestsCount}
                    </span>
                  </Link>
                )}

                {/* Pending invitations */}
                {pendingInvitationsCount > 0 && (
                  <Link
                    href={`/home/${homeId}/invitations`}
                    onClick={onCloseAction}
                    className={`${glass} flex items-center justify-between rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 hover:bg-orange-500/20`}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        ✉️ Pending Invitations
                      </p>
                      <p className={`text-xs ${textMeta}`}>
                        Invitations waiting for response
                      </p>
                    </div>
                    <span className="ml-3 flex-shrink-0 rounded-full bg-orange-500/30 px-3 py-1 text-xs font-bold text-orange-100">
                      {loadingInvites ? "—" : pendingInvitationsCount}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ========== WORK & SERVICES ========== */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
              Work & Services
            </h3>
            <div className="space-y-2">

              {/* View all work */}
              <Link
                href={`/home/${homeId}/completed-work-submissions`}
                onClick={onCloseAction}
                className={`${glass} flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10`}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    📝 Requests &amp; Submissions
                  </p>
                  <p className={`text-xs ${textMeta}`}>
                    Request job quotes, review/approve completed work submissions
                  </p>
                </div>
                <span className="text-white/40">→</span>
              </Link>

              {/* Find pros */}
              <button
                type="button"
                onClick={onOpenVendorsAction}
                className={`${glass} flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left hover:bg-white/10`}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    🔍 Find &amp; Connect Pros
                  </p>
                  <p className={`text-xs ${textMeta}`}>
                    Browse and connect with verified contractors
                  </p>
                </div>
                <span className="text-white/40">→</span>
              </button>
            </div>
          </div>

          {/* ========== CONNECTIONS ========== */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
              Connections
            </h3>
            <div className="space-y-2">
              {/* My contractors */}
              <Link
                href={`/home/${homeId}/contractors`}
                onClick={onCloseAction}
                className={`${glass} flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10`}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    👷 My Contractors
                  </p>
                  <p className={`text-xs ${textMeta}`}>
                    View and manage your connected professionals
                  </p>
                </div>
                <span className="text-white/40">→</span>
              </Link>

              {/* Share access */}
              <button
                type="button"
                onClick={onOpenShareAction}
                className={`${glass} flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left hover:bg-white/10`}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    👥 Share Access
                  </p>
                  <p className={`text-xs ${textMeta}`}>
                    Give others view or edit access to this home
                  </p>
                </div>
                <span className="text-white/40">→</span>
              </button>

              {/* Invitations */}
              <Link
                href={`/home/${homeId}/invitations`}
                onClick={onCloseAction}
                className={`${glass} flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10`}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    ✉️ All Invitations
                  </p>
                  <p className={`text-xs ${textMeta}`}>
                    View sent and received invitations
                  </p>
                </div>
                <span className="text-white/40">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCloseAction}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}