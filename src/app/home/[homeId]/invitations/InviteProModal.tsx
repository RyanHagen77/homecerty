// app/home/[homeId]/invitations/InviteProModal.tsx
"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui";
import { textMeta } from "@/lib/glass";

type InviteProModalProps = {
  open: boolean;
  onCloseAction: () => void;
  homeId: string;
  homeAddress: string;
};

export function InviteProModal({
  open,
  onCloseAction,
  homeId,
  homeAddress,
}: InviteProModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleInvite() {
    if (!email || !email.includes("@")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/home/${homeId}/invitations/pro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "email",
          email,
          message: message || "",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to send invitation");
      }

      alert("Invitation sent!");
      onCloseAction();
    } catch (err) {
      console.error("Error sending invitation:", err);
      alert(
        err instanceof Error ? err.message : "Failed to send invitation"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onCloseAction={onCloseAction}>
      <div className="p-6">
        <h2 className="mb-2 text-xl font-bold text-white">Invite a Pro</h2>
        <p className={`mb-4 text-sm ${textMeta}`}>For {homeAddress}</p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white">
              Pro&apos;s Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pro@example.com"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-white outline-none backdrop-blur placeholder:text-white/40"
              rows={3}
              placeholder="Add a short note so they know why you’re inviting them…"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCloseAction}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInvite}
              disabled={!email.includes("@") || loading}
              className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send Invitation"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}