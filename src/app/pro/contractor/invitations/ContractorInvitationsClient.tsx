// app/pro/contractor/invitations/ContractorInvitationsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AddressVerification from "@/components/AddressVerification";
import { glass, heading, textMeta, ctaGhost, ctaPrimary } from "@/lib/glass";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui";

type Invitation = {
  id: string;
  invitedEmail: string;
  invitedName: string | null;
  role: string;
  message: string | null;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  inviter?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile?: {
      businessName: string | null;
      company: string | null;
      phone: string | null;
      rating: number | null;
      verified: boolean;
    } | null;
  };
  home?: {
    id: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  } | null;
};

type Tab = "received" | "sent";

export default function ContractorInvitationsClient({
  receivedInvitations,
  sentInvitations,
}: {
  receivedInvitations: Invitation[];
  sentInvitations: Invitation[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("received");
  const [processing, setProcessing] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  function handleAcceptClick(invitationId: string) {
    setSelectedInvitation(invitationId);
    setShowAddressModal(true);
  }

  async function handleAddressVerified(verifiedAddress: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  }) {
    if (!selectedInvitation) return;

    setProcessing(selectedInvitation);
    try {
      const response = await fetch(
        `/api/pro/contractor/invitations/${selectedInvitation}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: verifiedAddress.unit
              ? `${verifiedAddress.street} ${verifiedAddress.unit}`
              : verifiedAddress.street,
            city: verifiedAddress.city,
            state: verifiedAddress.state,
            zip: verifiedAddress.zip,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept invitation");
      }

      alert("Invitation accepted! Connection established.");
      setShowAddressModal(false);
      setSelectedInvitation(null);
      router.refresh();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      alert(error instanceof Error ? error.message : "Failed to accept invitation");
    } finally {
      setProcessing(null);
    }
  }

  async function handleDecline(invitationId: string) {
    if (!confirm("Are you sure you want to decline this invitation?")) return;

    setProcessing(invitationId);
    try {
      const response = await fetch(
        `/api/pro/contractor/invitations/${invitationId}/decline`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to decline invitation");
      }

      alert("Invitation declined.");
      router.refresh();
    } catch (error) {
      console.error("Error declining invitation:", error);
      alert("Failed to decline invitation. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleCancel(invitationId: string) {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    setProcessing(invitationId);
    try {
      const response = await fetch(
        `/api/pro/contractor/invitations/${invitationId}/cancel`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel invitation");
      }

      alert("Invitation cancelled.");
      router.refresh();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      alert("Failed to cancel invitation. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header - Match Work Records exactly */}
      <div className={glass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-semibold ${heading}`}>Invitations</h1>
            <p className={`mt-1 ${textMeta}`}>
              Manage invitations you&apos;ve sent and received
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowInviteModal(true)} className={ctaPrimary}>
              Invite Homeowner
            </button>
          </div>
        </div>
      </div>

      {/* Tabs/Filters Section - Match Work Records filters */}
      <section className={glass}>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("received")}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              activeTab === "received"
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            Received{" "}
            {receivedInvitations.filter((i) => i.status === "PENDING").length > 0 &&
              `(${receivedInvitations.filter((i) => i.status === "PENDING").length})`}
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              activeTab === "sent"
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            Sent{" "}
            {sentInvitations.filter((i) => i.status === "PENDING").length > 0 &&
              `(${sentInvitations.filter((i) => i.status === "PENDING").length})`}
          </button>
        </div>
      </section>

      {/* Content */}
      <section className={glass}>
        {activeTab === "received" ? (
          <ReceivedInvitationsTab
            invitations={receivedInvitations}
            processing={processing}
            onAccept={handleAcceptClick}
            onDecline={handleDecline}
          />
        ) : (
          <SentInvitationsTab
            invitations={sentInvitations}
            processing={processing}
            onCancel={handleCancel}
          />
        )}
      </section>

      {/* Address Verification Modal - now using shared Modal styling */}
      {showAddressModal && (
        <Modal
          open={true}
          onCloseAction={() => {
            setShowAddressModal(false);
            setSelectedInvitation(null);
          }}
        >
          <div className="p-6">
            <h2 className="mb-2 text-xl font-bold text-white">
              Verify Property Address
            </h2>
            <p className={`mb-4 text-sm ${textMeta}`}>
              Please verify the property address to accept this invitation:
            </p>

            <AddressVerification onVerified={handleAddressVerified} />

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddressModal(false);
                  setSelectedInvitation(null);
                }}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invite Homeowner Modal - matches Work Records version */}
      {showInviteModal && (
        <InviteHomeownerModal onCloseAction={() => setShowInviteModal(false)} />
      )}
    </div>
  );
}

/* ========== Received Invitations Tab ========== */
function ReceivedInvitationsTab({
  invitations,
  processing,
  onAccept,
  onDecline,
}: {
  invitations: Invitation[];
  processing: string | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const pendingInvitations = invitations.filter((inv) => inv.status === "PENDING");
  const processedInvitations = invitations.filter((inv) => inv.status !== "PENDING");

  if (invitations.length === 0) {
    return (
      <div className="py-10 text-center text-white/80">
        <div className="mb-4 text-5xl">📨</div>
        <p className="text-lg">No invitations received yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending */}
      {pendingInvitations.length > 0 && (
        <div>
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>
            Pending ({pendingInvitations.length})
          </h2>
          <div className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-colors hover:bg-white/10"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {invitation.inviter?.image && (
                      <Image
                        src={invitation.inviter.image}
                        alt={invitation.inviter.name || "Homeowner"}
                        width={50}
                        height={50}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {invitation.inviter?.name ||
                          invitation.inviter?.email ||
                          invitation.invitedEmail}
                      </p>
                      <p className="text-sm text-white/60">Homeowner</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-white/60">
                    <p>Sent {new Date(invitation.createdAt).toLocaleDateString()}</p>
                    <p>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {invitation.message && (
                  <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="mb-1 text-sm font-medium text-white/80">
                      Message:
                    </p>
                    <p className="text-white/70">{invitation.message}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept(invitation.id)}
                    disabled={processing === invitation.id}
                    className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 font-medium text-white transition-all hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
                  >
                    {processing === invitation.id ? "Processing..." : "✓ Accept"}
                  </button>
                  <button
                    onClick={() => onDecline(invitation.id)}
                    disabled={processing === invitation.id}
                    className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                  >
                    ✗ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed */}
      {processedInvitations.length > 0 && (
        <div>
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>
            History ({processedInvitations.length})
          </h2>
          <div className="space-y-2">
            {processedInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-colors hover:bg-white/10"
              >
                <div>
                  <p className="font-medium text-white">
                    {invitation.inviter?.name ||
                      invitation.inviter?.email ||
                      invitation.invitedEmail}
                  </p>
                  <p className={`text-sm ${textMeta}`}>
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={invitation.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== Sent Invitations Tab ========== */
function SentInvitationsTab({
  invitations,
  processing,
  onCancel,
}: {
  invitations: Invitation[];
  processing: string | null;
  onCancel: (id: string) => void;
}) {
  const pendingInvitations = invitations.filter((inv) => inv.status === "PENDING");
  const processedInvitations = invitations.filter((inv) => inv.status !== "PENDING");

  return (
    <>
      {/* Pending */}
      {pendingInvitations.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Pending ({pendingInvitations.length})
          </h2>
          <div className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-colors hover:bg-white/10"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-white">
                      {invitation.invitedEmail}
                    </p>
                    {invitation.invitedName && (
                      <p className="mt-1 text-sm text-white/60">
                        {invitation.invitedName}
                      </p>
                    )}
                    {invitation.home && (
                      <p className="mt-2 text-sm text-white/70">
                        📍 {invitation.home.address}, {invitation.home.city},{" "}
                        {invitation.home.state} {invitation.home.zip}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 shrink-0 text-right text-sm text-white/60">
                    <p>Sent {new Date(invitation.createdAt).toLocaleDateString()}</p>
                    <p>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {invitation.message && (
                  <div className="mb-4 rounded-lg border border-white/20 bg-white/10 p-4">
                    <p className="mb-1 text-sm font-medium text-white/90">Message:</p>
                    <p className="text-white/80">{invitation.message}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => onCancel(invitation.id)}
                    disabled={processing === invitation.id}
                    className="rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 font-medium text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {processing === invitation.id
                      ? "Processing..."
                      : "Cancel Invitation"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed */}
      {processedInvitations.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            History ({processedInvitations.length})
          </h2>
          <div className="space-y-2">
            {processedInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-colors hover:bg-white/10"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {invitation.invitedEmail}
                  </p>
                  {invitation.home && (
                    <p className="mt-1 text-sm text-white/60">
                      {invitation.home.address}, {invitation.home.city},{" "}
                      {invitation.home.state}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-white/50">
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={invitation.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {invitations.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
          <p className="text-lg text-white/70">No invitations sent yet.</p>
          <p className="mt-2 text-sm text-white/50">
            Invite homeowners from the Work Records page
          </p>
        </div>
      )}
    </>
  );
}

/* ========== Status Badge ========== */
function StatusBadge({ status }: { status: string }) {
  const styles =
    {
      ACCEPTED: "bg-green-500/20 text-green-300 border-green-500/30",
      DECLINED: "bg-red-500/20 text-red-300 border-red-500/30",
      CANCELLED: "bg-gray-500/20 text-gray-300 border-gray-500/30",
      EXPIRED: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    }[status] || "bg-white/10 text-white/60 border-white/20";

  return (
    <span className={`rounded-lg border px-3 py-1 text-sm font-medium ${styles}`}>
      {status}
    </span>
  );
}

/* ========== Invite Homeowner Modal ========== */
function InviteHomeownerModal({
  onCloseAction,
}: {
  onCloseAction: () => void;
}) {
  const [step, setStep] = useState<"email" | "address" | "message">("email");
  const [email, setEmail] = useState("");
  const [verifiedAddress, setVerifiedAddress] = useState<{
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!verifiedAddress) return;

    setLoading(true);

    try {
      const fullAddress = `${verifiedAddress.street}${
        verifiedAddress.unit ? ` ${verifiedAddress.unit}` : ""
      }, ${verifiedAddress.city}, ${verifiedAddress.state} ${
        verifiedAddress.zip
      }`;

      const response = await fetch("/api/pro/contractor/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitedEmail: email,
          homeAddress: fullAddress,
          message,
          role: "HOMEOWNER",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitation");
      }

      alert("Invitation sent successfully!");
      onCloseAction();
      window.location.reload();
    } catch (error) {
      console.error("Error sending invitation:", error);
      alert(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={true} onCloseAction={onCloseAction}>
      <div className="p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Invite Homeowner</h2>

        {/* Step Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <StepDot active={step === "email"} completed={step !== "email"} label="1" />
          <div className="h-0.5 w-8 bg-white/20" />
          <StepDot
            active={step === "address"}
            completed={step === "message"}
            label="2"
          />
          <div className="h-0.5 w-8 bg-white/20" />
          <StepDot active={step === "message"} label="3" />
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white">
                Homeowner Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="homeowner@example.com"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCloseAction}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep("address")}
                disabled={!email || !email.includes("@")}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 font-medium text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                Next: Verify Address
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Address Verification */}
        {step === "address" && (
          <div className="space-y-4">
            <AddressVerification
              onVerified={(address) => {
                setVerifiedAddress(address);
                setStep("message");
              }}
            />
            <button
              onClick={() => setStep("email")}
              className="text-sm text-white/70 hover:text-white"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Message */}
        {step === "message" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-white/20 bg-white/5 p-3">
              <p className="mb-1 text-xs text-white/60">Verified Address:</p>
              <p className="text-sm font-medium text-white">
                {verifiedAddress?.street}
                {verifiedAddress?.unit && ` ${verifiedAddress.unit}`}
              </p>
              <p className="text-sm text-white">
                {verifiedAddress?.city}, {verifiedAddress?.state}{" "}
                {verifiedAddress?.zip}
              </p>
              <button
                onClick={() => setStep("address")}
                className="mt-2 text-xs text-white/70 hover:text-white"
              >
                Change address
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white">
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message to the homeowner..."
                className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-white outline-none backdrop-blur placeholder:text-white/40"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setStep("address")}
                disabled={loading}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 font-medium text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function StepDot({
  active,
  completed,
  label,
}: {
  active?: boolean;
  completed?: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
        completed
          ? "bg-green-400/20 text-green-300"
          : active
          ? "bg-orange-400/20 text-orange-300"
          : "bg-white/10 text-white/40"
      }`}
    >
      {completed ? "✓" : label}
    </div>
  );
}