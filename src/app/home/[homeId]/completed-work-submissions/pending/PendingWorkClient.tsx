// app/home/[homeId]/completed-work-submissions/pending/PendingWorkClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type PendingWorkItem = {
  id: string;
  workType: string;
  workDate: Date;
  description: string | null;
  cost: number | null;
  photos: string[];
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
  invoiceUrl: string | null;
  warrantyIncluded: boolean;
  warrantyLength: string | null;
  warrantyDetails: string | null;
  status: string;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
      phone: string | null;
      rating: number | null;
      completedJobs: number;
      verified: boolean;
    } | null;
  };
  invitation: {
    id: string;
    message: string | null;
  } | null;
};

export default function PendingWorkClient({
  homeId,
  homeAddress,
  pendingWork,
}: {
  homeId: string;
  homeAddress: string;
  pendingWork: PendingWorkItem[];
}) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleVerify(workRecordId: string) {
    setProcessing(workRecordId);
    try {
      const response = await fetch(
        `/api/home/${homeId}/records/${workRecordId}/verify-work`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "VERIFY" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify work");
      }

      router.refresh();
    } catch (error) {
      console.error("Error verifying work:", error);
      alert("Failed to verify work. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleDispute(workRecordId: string) {
    const feedback = prompt("Please provide details about your dispute:");
    if (!feedback) return;

    setProcessing(workRecordId);
    try {
      const response = await fetch(
        `/api/home/${homeId}/records/${workRecordId}/verify-work`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "DISPUTE", feedback }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to dispute work");
      }

      router.refresh();
    } catch (error) {
      console.error("Error disputing work:", error);
      alert("Failed to dispute work. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(workRecordId: string) {
    const feedback = prompt("Please provide a reason for rejection:");
    if (!feedback) return;

    setProcessing(workRecordId);
    try {
      const response = await fetch(
        `/api/home/${homeId}/records/${workRecordId}/verify-work`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "REJECT", feedback }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject work");
      }

      router.refresh();
    } catch (error) {
      console.error("Error rejecting work:", error);
      alert("Failed to reject work. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  // Helper function to get all photos (legacy + new attachments)
  function getAllPhotos(work: PendingWorkItem) {
    const allPhotos: Array<{ url: string; alt: string; source: 'legacy' | 'attachment' }> = [];

    // Add legacy photos
    work.photos.forEach((photo, idx) => {
      allPhotos.push({
        url: photo,
        alt: `Work photo ${idx + 1}`,
        source: 'legacy'
      });
    });

    // Add new attachment images
    work.attachments
      .filter(a => a.mimeType?.startsWith('image/'))
      .forEach((attachment) => {
        allPhotos.push({
          url: attachment.url,
          alt: attachment.filename,
          source: 'attachment'
        });
      });

    return allPhotos;
  }

  if (pendingWork.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Pending Work Verification</h1>
        <p className="text-gray-600 mb-4">{homeAddress}</p>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No pending work to verify at this time.</p>
          <a
            href={`/home/${homeId}`}
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a
          href={`/home/${homeId}`}
          className="text-blue-600 hover:underline mb-2 inline-block"
        >
          ← Back to Home
        </a>
        <h1 className="text-2xl font-bold">Pending Work Verification</h1>
        <p className="text-gray-600">{homeAddress}</p>
        <p className="text-sm text-gray-500 mt-1">
          {pendingWork.length} {pendingWork.length === 1 ? "item" : "items"} awaiting
          verification
        </p>
      </div>

      <div className="space-y-6">
        {pendingWork.map((work) => {
          const allPhotos = getAllPhotos(work);

          return (
            <div key={work.id} className="bg-white rounded-lg shadow-md p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{work.workType}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(work.workDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  {work.cost !== null && (
                    <p className="text-lg font-bold">
                      ${work.cost.toFixed(2)}
                    </p>
                  )}
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded ${
                      work.status === "DISPUTED"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {work.status}
                  </span>
                </div>
              </div>

              {/* Contractor Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  {work.contractor.image && (
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={work.contractor.image}
                        alt={work.contractor.name || "Contractor"}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {work.contractor.name || work.contractor.email}
                    </p>
                    {work.contractor.proProfile && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>
                          {work.contractor.proProfile.businessName ||
                            work.contractor.proProfile.company}
                        </span>
                        {work.contractor.proProfile.rating && (
                          <span>⭐ {work.contractor.proProfile.rating}</span>
                        )}
                        {work.contractor.proProfile.verified && (
                          <span className="text-green-600">✓ Verified</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {work.description && (
                <div className="mb-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-1">
                    Description
                  </h3>
                  <p className="text-gray-600">{work.description}</p>
                </div>
              )}

              {/* Warranty Info */}
              {work.warrantyIncluded && (
                <div className="mb-4 p-3 bg-green-50 rounded">
                  <h3 className="font-medium text-sm text-green-800 mb-1">
                    ✓ Warranty Included
                  </h3>
                  {work.warrantyLength && (
                    <p className="text-sm text-gray-700">
                      Length: {work.warrantyLength}
                    </p>
                  )}
                  {work.warrantyDetails && (
                    <p className="text-sm text-gray-600">{work.warrantyDetails}</p>
                  )}
                </div>
              )}

              {/* Photo Gallery - Updated Design */}
              {allPhotos.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">
                    Photos ({allPhotos.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {allPhotos.map((photo, idx) => (
                      <a
                        key={`${photo.source}-${idx}`}
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50 hover:border-gray-300 transition"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.alt}
                          fill
                          className="object-cover transition group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                        <div className="absolute bottom-2 right-2 opacity-0 transition group-hover:opacity-100">
                          <span className="rounded-full bg-white/90 px-2 py-1 text-xs text-gray-800 backdrop-blur-sm">
                            View Full Size
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Non-image Attachments */}
              {work.attachments.some(a => !a.mimeType?.startsWith('image/')) && (
                <div className="mb-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">
                    Documents
                  </h3>
                  <div className="space-y-2">
                    {work.attachments
                      .filter(a => !a.mimeType?.startsWith('image/'))
                      .map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition"
                        >
                          <span className="text-2xl">📄</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <span className="text-blue-600 text-sm whitespace-nowrap">
                            Download →
                          </span>
                        </a>
                      ))}
                  </div>
                </div>
              )}

              {/* Invoice */}
              {work.invoiceUrl && (
                <div className="mb-4">
                  <a
                    href={work.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    📄 View Invoice →
                  </a>
                </div>
              )}

              {/* Message from invitation */}
              {work.invitation?.message && (
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <h3 className="font-medium text-sm text-blue-800 mb-1">
                    Message from Contractor
                  </h3>
                  <p className="text-sm text-gray-700">{work.invitation.message}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleVerify(work.id)}
                  disabled={processing === work.id}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {processing === work.id ? "Processing..." : "✓ Verify & Approve"}
                </button>
                <button
                  onClick={() => handleDispute(work.id)}
                  disabled={processing === work.id}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 transition"
                >
                  ⚠ Dispute
                </button>
                <button
                  onClick={() => handleReject(work.id)}
                  disabled={processing === work.id}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}