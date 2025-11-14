import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { glass, heading, textMeta } from "@/lib/glass";

export const dynamic = "force-dynamic";

export default async function ContractorPendingPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      proStatus: true,
      proProfile: {
        select: {
          type: true,
          businessName: true,
        },
      },
    },
  });

  // If approved, redirect to dashboard
  if (user?.proStatus === "APPROVED") {
    redirect("/pro/contractor/dashboard");
  }

  // If rejected, show rejection message
  if (user?.proStatus === "REJECTED") {
    return (
      <main className="relative min-h-screen text-white">
        <Bg />
        <div className="mx-auto max-w-2xl p-6">
          <div className={`${glass} text-center`}>
            <div className="mb-6 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-red-500/20 border border-red-400/30">
              <svg
                className="h-8 w-8 text-red-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h1 className={`mb-2 text-2xl font-bold ${heading}`}>Application Not Approved</h1>
            <p className={`mb-6 ${textMeta}`}>
              Unfortunately, your contractor application was not approved at this time. Please contact
              support for more information.
            </p>

            <div className="space-y-3">
              <Link
                href="/contact"
                className="block w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-center font-medium text-white hover:from-orange-600 hover:to-red-600 transition"
              >
                Contact Support
              </Link>
              <Link
                href="/"
                className="block w-full rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-center font-medium text-white hover:bg-white/10 transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Pending status - Dashboard preview
  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Header */}
        <section className={glass}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-semibold ${heading}`}>Contractor Dashboard</h1>
              <p className={textMeta}>{user?.proProfile?.businessName}</p>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition"
            >
              Back to Home
            </Link>
          </div>
        </section>

        {/* Pending Banner */}
        <div className="rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,.15)]">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400/20">
              <svg
                className="h-5 w-5 text-yellow-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-100">
                Application Under Review
              </h3>
              <p className="mt-1 text-sm text-yellow-200/80">
                We're verifying your business information and credentials. You'll receive an email
                when approved (typically within 1-2 business days).
              </p>
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Projects" value="0" locked />
          <StatCard title="Completed Work" value="0" locked />
          <StatCard title="Connected Homes" value="0" locked />
          <StatCard title="Profile Views" value="0" locked />
        </div>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FeatureCard
            icon="📝"
            title="Document Your Work"
            description="Create verified records of completed projects on client properties. Upload photos, invoices, and warranties."
          />

          <FeatureCard
            icon="🎨"
            title="Build Your Portfolio"
            description="Showcase your craftsmanship with a verified history of completed projects that travels with the homes."
          />

          <FeatureCard
            icon="👥"
            title="Manage Clients"
            description="Stay connected with homeowners and their trusted circle. Maintain relationships long after projects are complete."
          />

          <FeatureCard
            icon="🔍"
            title="Get Discovered"
            description="When homes change hands or need work, new owners can see your quality craftsmanship and reach out directly."
          />
        </div>

        {/* What's Next */}
        <section className={glass}>
          <h3 className={`mb-4 text-lg font-semibold ${heading}`}>What happens next?</h3>
          <div className="space-y-3">
            <Step
              number="1"
              title="Verification"
              description="We'll verify your business information and license (if provided)"
            />
            <Step
              number="2"
              title="Email Notification"
              description="You'll receive an email when your application is approved"
            />
            <Step
              number="3"
              title="Full Access"
              description="Start documenting work, building your portfolio, and connecting with clients"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Bg() {
  return (
    <div className="fixed inset-0 -z-50">
      <Image
        src="/myhomedox_home3.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
    </div>
  );
}

function StatCard({ title, value, locked }: { title: string; value: string; locked?: boolean }) {
  return (
    <div className={`${glass} relative ${locked ? "opacity-60" : ""}`}>
      {locked && (
        <div className="absolute right-4 top-4 rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-white/70">
          Soon
        </div>
      )}
      <div className={`text-sm font-medium ${textMeta}`}>{title}</div>
      <div className={`mt-2 text-3xl font-bold ${heading}`}>{value}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className={`${glass} relative`}>
      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-orange-500/20 border border-orange-400/30 px-2 py-1 text-xs font-medium text-orange-200">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        Locked
      </div>
      <div className="mb-4 text-3xl">{icon}</div>
      <h3 className={`text-lg font-semibold ${heading}`}>{title}</h3>
      <p className={`mt-2 text-sm ${textMeta}`}>{description}</p>
      <div className={`mt-4 text-sm ${textMeta}`}>Available after approval</div>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <span className="text-xs font-bold">{number}</span>
      </div>
      <div>
        <div className={`text-sm font-medium ${heading}`}>{title}</div>
        <div className={`text-sm ${textMeta}`}>{description}</div>
      </div>
    </div>
  );
}