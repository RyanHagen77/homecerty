// app/invitations/ContractorInvitationsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AddressVerification from "@/components/AddressVerification";

type Invitation = {
  id: string;
  invitedEmail: string;
  invitedName: string | null;
  role: string;
  message: string | null;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  inviter: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
      phone: string | null;
      rating: number | null;
      verified: boolean;
    } | null;
  };
};

export default function InvitationsClient({
  invitations,
}: {
  invitations: Invitation[];
}) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<string | null>(null);

  const pendingInvitations = invitations.filter((inv) => inv.status === "PENDING");
  const processedInvitations = invitations.filter((inv) => inv.status !== "PENDING");

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

      setShowAddressModal(false);
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

      router.refresh();
    } catch (error) {
      console.error("Error declining invitation:", error);
      alert("Failed to decline invitation. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/dashboard" className="text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Dashboard
        </a>
        <h1 className="text-2xl font-bold">Contractor Invitations</h1>
        <p className="text-gray-600">
          Homeowners inviting you to document work on their properties
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {pendingInvitations.length} pending invitation
          {pendingInvitations.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
          <div className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500"
              >
                {/* Contractor Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {invitation.inviter.image && (
                      <Image
                        src={invitation.inviter.image}
                        alt={invitation.inviter.name || "Homeowner"}
                        width={50}
                        height={50}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-lg">
                        {invitation.inviter.name || invitation.inviter.email}
                      </p>
                      <p className="text-sm text-gray-600">Homeowner</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>
                      Sent {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      Expires{" "}
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Message */}
                {invitation.message && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Message:
                    </p>
                    <p className="text-gray-600">{invitation.message}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptClick(invitation.id)}
                    disabled={processing === invitation.id}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing === invitation.id
                      ? "Processing..."
                      : "✓ Accept Invitation"}
                  </button>
                  <button
                    onClick={() => handleDecline(invitation.id)}
                    disabled={processing === invitation.id}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    ✗ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Invitations */}
      {processedInvitations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Invitations</h2>
          <div className="space-y-2">
            {processedInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">
                    {invitation.inviter.name || invitation.inviter.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-sm ${
                    invitation.status === "ACCEPTED"
                      ? "bg-green-100 text-green-800"
                      : invitation.status === "CANCELLED"
                      ? "bg-gray-200 text-gray-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {invitation.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {invitations.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No invitations yet.</p>
        </div>
      )}

      {/* Address Verification Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Verify Property Address</h3>
            <p className="text-gray-600 mb-4">
              Please verify the property address to accept this invitation:
            </p>

            <AddressVerification
              onVerified={handleAddressVerified}
            />

            <button
              type="button"
              onClick={() => {
                setShowAddressModal(false);
                setSelectedInvitation(null);
              }}
              className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}