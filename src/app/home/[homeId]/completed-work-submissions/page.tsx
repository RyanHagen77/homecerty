import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import { WorkSubmissionStatus } from "@prisma/client";
import WorkClient from "./WorkClient";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) notFound();
  await requireHomeAccess(homeId, session.user.id);

  // Connected contractors
  const connectionsRaw = await prisma.connection.findMany({
    where: {
      homeId,
      status: "ACTIVE",
    },
    include: {
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: {
            select: {
              businessName: true,
              company: true,
              phone: true,
              rating: true,
              verified: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Pending work submissions (DOCUMENTED + DOCUMENTED_UNVERIFIED) + attachments
  const pendingWorkRaw = await prisma.workRecord.findMany({
    where: {
      homeId,
      status: {
        in: [
          WorkSubmissionStatus.DOCUMENTED,
          WorkSubmissionStatus.DOCUMENTED_UNVERIFIED,
        ],
      },
    },
    include: {
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: {
            select: {
              businessName: true,
              company: true,
            },
          },
        },
      },
      attachments: {
        select: {
          id: true,
          filename: true,
          url: true,
          mimeType: true,
          size: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Job requests
  const jobRequestsRaw = await prisma.jobRequest.findMany({
    where: {
      homeId,
      homeownerId: session.user.id,
    },
    include: {
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: {
            select: {
              businessName: true,
              company: true,
              phone: true,
              verified: true,
              rating: true,
            },
          },
        },
      },
      quote: {
        select: {
          id: true,
          totalAmount: true,
          status: true,
          expiresAt: true,
        },
      },
      workRecord: {
        select: {
          id: true,
          status: true,
          workDate: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  if (!home) notFound();

  // Serialize dates and decimals - filter out null contractors
  const connections = connectionsRaw
    .filter((conn) => conn.contractor !== null)
    .map((conn) => ({
      id: conn.id,
      contractor: conn.contractor!,
      createdAt: conn.createdAt.toISOString(),
    }));

  const pendingWork = pendingWorkRaw
    .filter((work) => work.contractor !== null)
    .map((work) => ({
      id: work.id,
      title: work.workType,
      description: work.description,
      workDate: work.workDate.toISOString(),
      cost: work.cost ? Number(work.cost) : null,
      createdAt: work.createdAt.toISOString(),
      contractor: work.contractor!,
      attachments: work.attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.mimeType,
        size: Number(a.size),
        url: a.url,
      })),
    }));

  const jobRequests = jobRequestsRaw
    .filter((job) => job.contractor !== null)
    .map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      category: job.category,
      urgency: job.urgency,
      budgetMin: job.budgetMin ? Number(job.budgetMin) : null,
      budgetMax: job.budgetMax ? Number(job.budgetMax) : null,
      desiredDate: job.desiredDate?.toISOString() || null,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      contractor: job.contractor!,
      quote: job.quote
        ? {
            id: job.quote.id,
            totalAmount: Number(job.quote.totalAmount),
            status: job.quote.status,
            expiresAt: job.quote.expiresAt?.toISOString() || null,
          }
        : null,
      workRecord: job.workRecord
        ? {
            id: job.workRecord.id,
            status: job.workRecord.status,
            workDate: job.workRecord.workDate.toISOString(),
          }
        : null,
    }));

  return (
    <WorkClient
      homeId={homeId}
      homeAddress={`${home.address}${home.city ? `, ${home.city}` : ""}${
        home.state ? `, ${home.state}` : ""
      }`}
      connections={connections}
      pendingWork={pendingWork}
      jobRequests={jobRequests}
    />
  );
}