"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ContractorApplyForm = {
  name: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  licenseNo: string;
  website: string;
  bio: string;
  specialties: string;
  serviceAreas: string;
};

export default function ContractorApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState<ContractorApplyForm>({
    name: "",
    email: "",
    password: "",
    phone: "",
    businessName: "",
    licenseNo: "",
    website: "",
    bio: "",
    specialties: "",
    serviceAreas: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Convert comma-separated strings to arrays
      const payload = {
        ...formData,
        specialties: formData.specialties
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        serviceAreas: formData.serviceAreas
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      };

      const response = await fetch("/api/pro/contractor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as { error?: string })?.error || "Failed to submit application");
      }

      router.push("/pro/contractor/pending");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-8">
        <Link href="/apply" className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          ← Back to account types
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">Apply as a Contractor</h1>
        <p className="mt-2 text-gray-600">Join MyHomeDox and start documenting your work</p>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 font-semibold text-blue-900">Why join as a Contractor?</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>✓ Document your work on client properties</li>
          <li>✓ Build verified work history portfolio</li>
          <li>✓ Get discovered by homeowners viewing homes</li>
          <li>✓ Build credibility with verified records</li>
          <li>✓ Stay connected with past clients</li>
        </ul>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
        {/* Personal Information */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Business Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Mike's HVAC Service"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                License Number <span className="text-gray-400">(optional but recommended)</span>
              </label>
              <input
                type="text"
                value={formData.licenseNo}
                onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="IL-HVAC-12345"
              />
              <p className="mt-1 text-xs text-gray-500">
                Providing a license number helps build trust with clients
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Website <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="https://www.example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Specialties <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="HVAC, Plumbing, Electrical"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate multiple specialties with commas
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Service Areas <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.serviceAreas}
                onChange={(e) => setFormData({ ...formData, serviceAreas: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="60098, Woodstock, McHenry County"
              />
              <p className="mt-1 text-xs text-gray-500">
                Add zip codes, cities, or regions separated by commas
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                About Your Business <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Tell us about your business, years of experience, and what makes you unique..."
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-medium text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            We&apos;ll review your application within 1-2 business days
          </p>
        </div>
      </form>
    </main>
  );
}