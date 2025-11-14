"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ctaPrimary, ctaGhost, textMeta, glass } from "@/lib/glass";
import { Modal } from "@/components/ui/Modal";

/** Client modals */
import {
  AddRecordModal,
  type UnifiedRecordPayload,
} from "@/app/home/_components/AddRecordModal";
import { ShareAccessModal } from "@/app/home/_components/ShareAccessModal";
import {
  FindVendorsModal,
  type VendorDirectoryItem,
} from "@/app/home/_components/FindVendorModal";

/* ---------- Types ---------- */
type PresignResponse = { key: string; url: string; publicUrl: string | null };
type PersistAttachment = {
  filename: string;
  size: number;
  contentType: string;
  storageKey: string;
  url: string | null;
  visibility: "OWNER" | "HOME" | "PUBLIC";
  notes?: string;
};

/* ---------- Component ---------- */
export default function ClientActions({ homeId }: { homeId: string }) {
  const router = useRouter();

  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [findVendorsOpen, setFindVendorsOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);

  const [pendingWorkCount, setPendingWorkCount] = useState(0);
  const [loadingPending, setLoadingPending] = useState(true);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  /* ---------- Fetch pending work count ---------- */
  useEffect(() => {
    async function fetchPendingWork() {
      try {
        const res = await fetch(`/api/home/${homeId}/records/pending-work`);
        if (res.ok) {
          const data = await res.json();
          setPendingWorkCount(data.totalPending || 0);
        }
      } catch (error) {
        console.error("Error fetching pending work:", error);
      } finally {
        setLoadingPending(false);
      }
    }

    fetchPendingWork();
  }, [homeId]);

  /* ---------- Fetch pending invitations count ---------- */
  useEffect(() => {
    async function fetchPendingInvitations() {
      try {
        const res = await fetch(`/api/user/invitations?status=PENDING`);
        if (res.ok) {
          const data = await res.json();
          setPendingInvitationsCount(data.invitations?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching pending invitations:", error);
      } finally {
        setLoadingInvitations(false);
      }
    }

    fetchPendingInvitations();
  }, []);

  /* ---------- API Helpers ---------- */
  async function createRecord(payload: {
    title: string;
    note?: string | null | undefined;
    date?: string | undefined;
    kind?: string | null | undefined;
    vendor?: string | null | undefined;
    cost?: number | null | undefined;
    verified?: boolean | null | undefined;
  }): Promise<{ id: string }> {
    const res = await fetch(`/api/home/${homeId}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.id)
      throw new Error(json?.error || "Failed to create record");
    return { id: json.id };
  }

  async function createReminder(payload: {
    title: string;
    dueAt: string;
    note?: string | null | undefined;
  }): Promise<{ id: string }> {
    const res = await fetch(`/api/home/${homeId}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.id)
      throw new Error(json?.error || "Failed to create reminder");
    return { id: json.id };
  }

  async function createWarranty(payload: {
    item: string;
    provider?: string | null | undefined;
    policyNo?: string | null | undefined;
    expiresAt?: string | null | undefined;
    note?: string | null | undefined;
  }): Promise<{ id: string }> {
    const res = await fetch(`/api/home/${homeId}/warranties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.id)
      throw new Error(json?.error || "Failed to create warranty");
    return { id: json.id };
  }

  /* ---------- Shared uploader helper ---------- */
  async function uploadAndPersistAttachments({
    homeId,
    recordId,
    warrantyId,
    reminderId,
    files,
  }: {
    homeId: string;
    recordId?: string;
    warrantyId?: string;
    reminderId?: string;
    files: File[];
  }) {
    if (!files.length) return;

    const uploaded: PersistAttachment[] = [];
    for (const f of files) {
      const presignPayload: {
        homeId: string;
        filename: string;
        contentType: string;
        size: number;
        recordId?: string;
        warrantyId?: string;
        reminderId?: string;
      } = {
        homeId,
        filename: f.name,
        contentType: f.type || "application/octet-stream",
        size: f.size,
      };

      if (recordId) presignPayload.recordId = recordId;
      if (warrantyId) presignPayload.warrantyId = warrantyId;
      if (reminderId) presignPayload.reminderId = reminderId;

      const pre = await fetch(`/api/uploads/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presignPayload),
      });

      if (!pre.ok) {
        const errorText = await pre.text();
        throw new Error(`Presign failed: ${errorText}`);
      }

      const { key, url, publicUrl } = (await pre.json()) as PresignResponse;
      if (!key || !url) throw new Error("Presign missing key/url");

      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": f.type || "application/octet-stream" },
        body: f,
      });
      if (!put.ok)
        throw new Error(`S3 PUT failed: ${await put.text().catch(() => "")}`);

      uploaded.push({
        filename: f.name,
        size: f.size,
        contentType: f.type || "application/octet-stream",
        storageKey: key,
        url: publicUrl,
        visibility: "OWNER",
        notes: undefined,
      });
    }

    let endpoint = "";
    if (recordId)
      endpoint = `/api/home/${homeId}/records/${recordId}/attachments`;
    else if (warrantyId)
      endpoint = `/api/home/${homeId}/warranties/${warrantyId}/attachments`;
    else if (reminderId)
      endpoint = `/api/home/${homeId}/reminders/${reminderId}/attachments`;
    if (!endpoint) return;

    const persist = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uploaded),
    });
    if (!persist.ok)
      throw new Error(
        `Persist attachments failed: ${await persist.text()}`
      );
  }

  /* ---------- Unified handler for all types ---------- */
  async function onCreateUnified({
    payload,
    files,
  }: {
    payload: UnifiedRecordPayload;
    files: File[];
  }) {
    if (payload.type === "record") {
      const record = await createRecord({
        title: payload.title,
        note: payload.note ?? undefined,
        date: payload.date ?? undefined,
        kind: payload.kind ?? undefined,
        vendor: payload.vendor ?? undefined,
        cost: typeof payload.cost === "number" ? payload.cost : undefined,
        verified: payload.verified ?? undefined,
      });
      await uploadAndPersistAttachments({ homeId, recordId: record.id, files });
    } else if (payload.type === "reminder") {
      const reminder = await createReminder({
        title: payload.title,
        dueAt: payload.dueAt!,
        note: payload.note ?? undefined,
      });
      await uploadAndPersistAttachments({
        homeId,
        reminderId: reminder.id,
        files,
      });
    } else if (payload.type === "warranty") {
      const warranty = await createWarranty({
        item: payload.item!,
        provider: payload.provider ?? undefined,
        policyNo: undefined,
        expiresAt: payload.expiresAt ?? undefined,
        note: payload.note ?? undefined,
      });
      await uploadAndPersistAttachments({
        homeId,
        warrantyId: warranty.id,
        files,
      });
    }

    setAddOpen(false);
    router.refresh();
  }

  const attentionCount =
    (loadingInvitations ? 0 : pendingInvitationsCount) +
    (loadingPending ? 0 : pendingWorkCount);

  /* ---------- UI ---------- */
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setAddOpen(true)} className={ctaPrimary}>
          + Add Record
        </button>

        {/* Unified Connections Button */}
        <button
          type="button"
          onClick={() => setConnectionsOpen(true)}
          className={`${ctaGhost} relative`}
        >
          Connections
          {attentionCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
              {attentionCount}
            </span>
          )}
        </button>

        <Link href={`/report?home=${homeId}`} className={ctaGhost}>
          View Report
        </Link>
      </div>

      {/* Unified Add Modal */}
      <AddRecordModal
        open={addOpen}
        onCloseAction={() => setAddOpen(false)}
        onCreateAction={onCreateUnified}
      />

      {/* Share Access */}
      <ShareAccessModal
        open={shareOpen}
        onCloseAction={() => setShareOpen(false)}
        homeId={homeId}
      />

      {/* Find Vendors */}
      <FindVendorsModal
        open={findVendorsOpen}
        onCloseAction={() => setFindVendorsOpen(false)}
        onAdd={(v: VendorDirectoryItem) => {
          console.log("picked vendor", v.id);
        }}
      />

      {/* Connections Modal */}
      <ConnectionsModal
        open={connectionsOpen}
        onCloseAction={() => setConnectionsOpen(false)}
        homeId={homeId}
        pendingWorkCount={pendingWorkCount}
        loadingWork={loadingPending}
        pendingInvitationsCount={pendingInvitationsCount}
        loadingInvites={loadingInvitations}
        onOpenShare={() => {
          setConnectionsOpen(false);
          setShareOpen(true);
        }}
        onOpenVendors={() => {
          setConnectionsOpen(false);
          setFindVendorsOpen(true);
        }}
      />
    </>
  );
}

/* ---------- Connections Modal ---------- */

type ConnectionsModalProps = {
  open: boolean;
  onCloseAction: () => void;
  homeId: string;
  pendingWorkCount: number;
  loadingWork: boolean;
  pendingInvitationsCount: number;
  loadingInvites: boolean;
  onOpenShare: () => void;
  onOpenVendors: () => void;
};

function ConnectionsModal({
  open,
  onCloseAction,
  homeId,
  pendingWorkCount,
  loadingWork,
  pendingInvitationsCount,
  loadingInvites,
  onOpenShare,
  onOpenVendors,
}: ConnectionsModalProps) {
  if (!open) return null;

  return (
    <Modal open={open} onCloseAction={onCloseAction}>
      <div className="p-6">
        <h2 className="mb-2 text-xl font-bold text-white">Connections</h2>
        <p className={`mb-4 text-sm ${textMeta}`}>
          Manage pros, invitations, and work tied to this home.
        </p>

        <div className="space-y-3">
          {/* Invitations */}
          <Link
            href={`/home/${homeId}/invitations`}
            className={`${glass} flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10`}
          >
            <div>
              <p className="text-sm font-medium text-white">Invitations</p>
              <p className={`text-xs ${textMeta}`}>
                Invitations you&apos;ve sent and contractor invites you&apos;ve
                received.
              </p>
            </div>
            <span className="ml-3 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200">
              {loadingInvites
                ? "—"
                : `${pendingInvitationsCount} pending`}
            </span>
          </Link>

          {/* Pending Work */}
          <Link
            href={`/home/${homeId}/pending-work`}
            className={`${glass} flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10`}
          >
            <div>
              <p className="text-sm font-medium text-white">Pending Work</p>
              <p className={`text-xs ${textMeta}`}>
                Work your pros have documented and are waiting for you to
                review.
              </p>
            </div>
            <span className="ml-3 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200">
              {loadingWork ? "—" : `${pendingWorkCount} items`}
            </span>
          </Link>

          {/* Share access */}
          <button
            type="button"
            onClick={onOpenShare}
            className={`${glass} flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left hover:bg-white/10`}
          >
            <div>
              <p className="text-sm font-medium text-white">Share Access</p>
              <p className={`text-xs ${textMeta}`}>
                Give a partner, co-owner, or assistant access to this home.
              </p>
            </div>
          </button>

          {/* Find vendors */}
          <button
            type="button"
            onClick={onOpenVendors}
            className={`${glass} flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left hover:bg-white/10`}
          >
            <div>
              <p className="text-sm font-medium text-white">Find Pros</p>
              <p className={`text-xs ${textMeta}`}>
                Browse recommended vendors for future work.
              </p>
            </div>
          </button>
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