"use client";

import { useState } from "react";
import { Input } from "@/components/ui";

type VerifiedAddress = {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  zip4?: string;
};

type AddressVerificationProps = {
  onVerified: (address: VerifiedAddress) => void;
  initialStreet?: string;
  initialCity?: string;
  initialState?: string;
  initialZip?: string;
  initialUnit?: string;
};

export default function AddressVerification({
  onVerified,
  initialStreet = "",
  initialCity = "",
  initialState = "",
  initialZip = "",
  initialUnit = "",
}: AddressVerificationProps) {
  const [street, setStreet] = useState(initialStreet);
  const [unit, setUnit] = useState(initialUnit);
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [zip, setZip] = useState(initialZip);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedAddress, setVerifiedAddress] = useState<VerifiedAddress | null>(null);

  async function handleVerify() {
    if (!street || !city || !state || !zip) {
      setError("Please fill in all required fields");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/verify-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ street, city, state, zip, unit }),
      });

      const result = await response.json();

      if (!result.isValid) {
        setError(result.error || "Address not found in USPS database");
        setVerified(false);
        return;
      }

      // Show verified address
      setVerifiedAddress(result.verified);
      setVerified(true);
    } catch (err) {
      setError("Failed to verify address. Please try again.");
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  }

  function handleConfirm() {
    if (verifiedAddress) {
      onVerified(verifiedAddress);
    }
  }

  function handleEdit() {
    setVerified(false);
    setError(null);
  }

  if (verified && verifiedAddress) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-400/30 bg-green-400/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-400/20 text-green-300">
              ✓
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-100">
                Address Verified by USPS
              </h3>
              <div className="mt-2 text-sm text-white">
                <p className="font-medium">
                  {verifiedAddress.street}
                  {verifiedAddress.unit && ` ${verifiedAddress.unit}`}
                </p>
                <p>
                  {verifiedAddress.city}, {verifiedAddress.state}{" "}
                  {verifiedAddress.zip}
                  {verifiedAddress.zip4 && `-${verifiedAddress.zip4}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Edit Address
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-red-600"
          >
            Confirm & Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1 text-white">
            Street Address *
          </label>
          <Input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="123 Main St"
            disabled={verifying}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">
            Unit / Apt (optional)
          </label>
          <Input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Apt 2B, #1S, etc."
            disabled={verifying}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              City *
            </label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              disabled={verifying}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              State *
            </label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="IL"
              maxLength={2}
              disabled={verifying}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">
            ZIP Code *
          </label>
          <Input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="60098"
            maxLength={5}
            disabled={verifying}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={verifying || !street || !city || !state || !zip}
        className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 font-medium text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
      >
        {verifying ? "Verifying with USPS..." : "Verify Address"}
      </button>

      <p className="text-xs text-white/60">
        * Address will be verified against USPS database to ensure accuracy
      </p>
    </div>
  );
}