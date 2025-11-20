"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { glass } from "@/lib/glass";
import { Button } from "@/components/ui/Button";
import type { Prisma } from "@prisma/client";

type JobRequestWithRelations = Prisma.JobRequestGetPayload<{
  include: {
    home: {
      select: {
        address: true;
        city: true;
        state: true;
      };
    };
    contractor: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
        proProfile: {
          select: {
            businessName: true;
            company: true;
            phone: true;
            verified: true;
            rating: true;
            completedJobs: true;
          };
        };
      };
    };
    quote: {
      include: {
        items: true;
      };
    };
    workRecord: {
      select: {
        id: true;
        workType: true;
        workDate: true;
        status: true;
        cost: true;
      };
    };
  };
}>;

type Props = {
  jobRequest: JobRequestWithRelations;
  homeId: string;
};

export function JobRequestActions({ jobRequest, homeId }: Props) {
  const router = useRouter();
  const [acting, setActing] = useState(false);

  const canAccept = jobRequest.status === "QUOTED" && jobRequest.quote;
  const canCancel = ["PENDING", "QUOTED"].includes(jobRequest.status);

  const handleAccept = async () => {
    if (!confirm("Accept this quote and proceed with the work?")) return;

    setActing(true);
    try {
      const res = await fetch(
        `/api/home/${homeId}/requested-jobs/${jobRequest.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACCEPTED" }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to accept quote");
      }

      router.refresh();
    } catch (error) {
      console.error("Error accepting quote:", error);
      alert(error instanceof Error ? error.message : "Failed to accept quote");
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this job request?")) return;

    setActing(true);
    try {
      const res = await fetch(
        `/api/home/${homeId}/requested-jobs/${jobRequest.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CANCELLED" }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to cancel request");
      }

      router.push(`/home/${homeId}/requested-jobs`);
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert(error instanceof Error ? error.message : "Failed to cancel request");
    } finally {
      setActing(false);
    }
  };

  const handleMessage = () => {
    // TODO: Implement messaging
    alert("Messaging coming soon!");
  };

  return (
    <div className={glass}>
      <h2 className="mb-3 text-lg font-semibold text-white">Actions</h2>
      <div className="space-y-3">
        {/* Accept Quote */}
        {canAccept && (
          <Button
            onClick={handleAccept}
            disabled={acting}
            className="w-full"
          >
            {acting ? "Accepting..." : "✅ Accept Quote"}
          </Button>
        )}

        {/* Message Contractor */}
        <button
          onClick={handleMessage}
          className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
        >
          💬 Message Contractor
        </button>

        {/* Cancel Request */}
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={acting}
            className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            {acting ? "Cancelling..." : "🚫 Cancel Request"}
          </button>
        )}

        {/* Status Info */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">
            {jobRequest.status === "PENDING" && (
              <>Waiting for contractor to respond with a quote.</>
            )}
            {jobRequest.status === "QUOTED" && (
              <>Review the quote and accept to proceed with the work.</>
            )}
            {jobRequest.status === "ACCEPTED" && (
              <>Quote accepted. Contractor will begin work soon.</>
            )}
            {jobRequest.status === "IN_PROGRESS" && (
              <>Work is currently in progress.</>
            )}
            {jobRequest.status === "COMPLETED" && (
              <>Work has been completed. Check the work record for details.</>
            )}
            {jobRequest.status === "DECLINED" && (
              <>Contractor declined this request.</>
            )}
            {jobRequest.status === "CANCELLED" && (
              <>This request has been cancelled.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}