"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fieldLabel } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";

type Connection = {
  id: string;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
      phone: string | null;
      verified: boolean;
      rating: number | null;
      specialties: string[];
    } | null;
  } | null;
};

type Props = {
  homeId: string;
  connections: Connection[];
};

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Carpentry",
  "Painting",
  "Roofing",
  "Appliance Repair",
  "Landscaping",
  "Flooring",
  "Drywall",
  "Windows & Doors",
  "General Repair",
  "Other",
];

export function RequestWorkForm({ homeId, connections }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    connectionId: "",
    contractorId: "",
    title: "",
    description: "",
    category: "",
    urgency: "NORMAL",
    budgetMin: "",
    budgetMax: "",
    timeframe: "", // Changed from desiredDate
  });

  const handleContractorChange = (connectionId: string) => {
    const connection = connections.find((c) => c.id === connectionId);
    if (connection?.contractor) {
      setForm({
        ...form,
        connectionId,
        contractorId: connection.contractor.id,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.connectionId || !form.contractorId || !form.title || !form.description) {
      alert("Please fill in contractor, title, and description");
      return;
    }

    setSubmitting(true);
    try {
      // Convert timeframe to actual date
      let desiredDate: string | null = null;
      const today = new Date();

      if (form.timeframe === "TODAY") {
        desiredDate = today.toISOString();
      } else if (form.timeframe === "ASAP") {
        // Set to tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        desiredDate = tomorrow.toISOString();
      } else if (form.timeframe === "SOON") {
        // Set to 3 days from now
        const threeDays = new Date(today);
        threeDays.setDate(threeDays.getDate() + 3);
        desiredDate = threeDays.toISOString();
      } else if (form.timeframe === "1-2_WEEKS") {
        // Set to 1 week from now
        const oneWeek = new Date(today);
        oneWeek.setDate(oneWeek.getDate() + 7);
        desiredDate = oneWeek.toISOString();
      }
      // NO_RUSH = null (no date specified)

      const res = await fetch(`/api/home/${homeId}/requested-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: form.connectionId,
          contractorId: form.contractorId,
          title: form.title,
          description: form.description,
          category: form.category || null,
          urgency: form.urgency,
          budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : null,
          budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : null,
          desiredDate,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create job request");
      }

      const { jobRequest } = await res.json();

      // Redirect to the job request detail page
      router.push(`/home/${homeId}/requested-jobs/${jobRequest.id}`);
    } catch (error) {
      console.error("Error creating job request:", error);
      alert(error instanceof Error ? error.message : "Failed to create job request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contractor Selection */}
      <div>
        <label className="block">
          <span className={`${fieldLabel} flex items-center gap-1`}>
            Select Contractor
            <span className="text-red-400">*</span>
          </span>
          <select
            value={form.connectionId}
            onChange={(e) => handleContractorChange(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
          >
            <option value="">Choose a contractor...</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.contractor?.proProfile?.businessName ||
                  conn.contractor?.name ||
                  conn.contractor?.email}
                {conn.contractor?.proProfile?.verified && " ✓"}
              </option>
            ))}
          </select>
        </label>

        {/* Show contractor details when selected */}
        {form.connectionId && (() => {
          const selected = connections.find((c) => c.id === form.connectionId);
          const contractor = selected?.contractor;
          const profile = contractor?.proProfile;

          if (!contractor) return null;

          return (
            <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                {contractor.image && (
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={contractor.image}
                      alt={contractor.name || "Contractor"}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {profile?.businessName || contractor.name}
                    {profile?.verified && (
                      <span className="ml-2 text-xs text-green-400">✓ Verified</span>
                    )}
                  </p>
                  {profile?.specialties && profile.specialties.length > 0 && (
                    <p className="mt-1 text-xs text-white/60">
                      {profile.specialties.join(", ")}
                    </p>
                  )}
                  {profile?.rating && (
                    <p className="mt-1 text-xs text-white/60">
                      ⭐ {profile.rating.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Work Title */}
      <div>
        <label className="block">
          <span className={`${fieldLabel} flex items-center gap-1`}>
            What work do you need?
            <span className="text-red-400">*</span>
          </span>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Fix leaking faucet in master bathroom"
            className="mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            maxLength={100}
            required
          />
        </label>
      </div>

      {/* Description */}
      <div>
        <label className="block">
          <span className={`${fieldLabel} flex items-center gap-1`}>
            Description
            <span className="text-red-400">*</span>
          </span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={6}
            placeholder="Describe the work you need done in detail. Include any specific requirements, preferences, or concerns..."
            className="mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </label>
      </div>

      {/* Category & Urgency */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block">
            <span className={fieldLabel}>Category</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="block">
            <span className={fieldLabel}>Urgency</span>
            <select
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="LOW">Low - Can wait</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High - Soon</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </label>
        </div>
      </div>

      {/* Budget Range */}
      <div>
        <span className={`${fieldLabel} mb-2 block`}>Budget Range (Optional)</span>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block">
              <span className="mb-1 block text-xs text-white/60">Minimum ($)</span>
              <input
                type="number"
                value={form.budgetMin}
                onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                placeholder="Min"
                min="0"
                step="0.01"
                className="block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>

          <div>
            <label className="block">
              <span className="mb-1 block text-xs text-white/60">Maximum ($)</span>
              <input
                type="number"
                value={form.budgetMax}
                onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                placeholder="Max"
                min="0"
                step="0.01"
                className="block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Timeframe */}
      <div>
        <label className="block">
          <span className={fieldLabel}>When do you need this done?</span>
          <select
            value={form.timeframe}
            onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Select timeframe...</option>
            <option value="TODAY">Today</option>
            <option value="ASAP">ASAP (within 1-2 days)</option>
            <option value="SOON">Soon (within 3-5 days)</option>
            <option value="1-2_WEEKS">1-2 Weeks</option>
            <option value="NO_RUSH">No Rush</option>
          </select>
          <p className="mt-1 text-xs text-white/60">
            Give the contractor an idea of your timeline
          </p>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <GhostButton
          type="button"
          onClick={() => router.back()}
        >
          Cancel
        </GhostButton>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending Request..." : "Send Request"}
        </Button>
      </div>
    </form>
  );
}