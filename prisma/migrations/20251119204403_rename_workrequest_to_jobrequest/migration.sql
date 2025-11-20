/*
  Warnings:

  - The `status` column on the `WorkInvitation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `WorkRecord` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[jobRequestId]` on the table `Quote` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jobRequestId]` on the table `WorkRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WorkInvitationStatus" AS ENUM ('PENDING_ACCEPTANCE', 'READY_TO_DOCUMENT', 'DOCUMENTED_UNVERIFIED', 'DOCUMENTED', 'APPROVED', 'REJECTED', 'DISPUTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "JobRequestStatus" AS ENUM ('PENDING', 'QUOTED', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobRequestUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY');

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "jobRequestId" TEXT;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "jobRequestId" TEXT;

-- AlterTable
ALTER TABLE "WorkInvitation" DROP COLUMN "status",
ADD COLUMN     "status" "WorkInvitationStatus" NOT NULL DEFAULT 'PENDING_ACCEPTANCE';

-- AlterTable
ALTER TABLE "WorkRecord" ADD COLUMN     "jobRequestId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "WorkInvitationStatus" NOT NULL DEFAULT 'DOCUMENTED';

-- DropEnum
DROP TYPE "WorkRequestStatus";

-- CreateTable
CREATE TABLE "JobRequest" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "homeownerId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "urgency" "JobRequestUrgency" NOT NULL DEFAULT 'NORMAL',
    "budgetMin" DECIMAL(12,2),
    "budgetMax" DECIMAL(12,2),
    "desiredDate" TIMESTAMP(3),
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "JobRequestStatus" NOT NULL DEFAULT 'PENDING',
    "contractorNotes" TEXT,
    "respondedAt" TIMESTAMP(3),
    "quoteId" TEXT,
    "workRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobRequest_quoteId_key" ON "JobRequest"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "JobRequest_workRecordId_key" ON "JobRequest"("workRecordId");

-- CreateIndex
CREATE INDEX "JobRequest_connectionId_idx" ON "JobRequest"("connectionId");

-- CreateIndex
CREATE INDEX "JobRequest_homeId_idx" ON "JobRequest"("homeId");

-- CreateIndex
CREATE INDEX "JobRequest_homeownerId_idx" ON "JobRequest"("homeownerId");

-- CreateIndex
CREATE INDEX "JobRequest_contractorId_idx" ON "JobRequest"("contractorId");

-- CreateIndex
CREATE INDEX "JobRequest_status_idx" ON "JobRequest"("status");

-- CreateIndex
CREATE INDEX "JobRequest_createdAt_idx" ON "JobRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Attachment_jobRequestId_idx" ON "Attachment"("jobRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_jobRequestId_key" ON "Quote"("jobRequestId");

-- CreateIndex
CREATE INDEX "Quote_jobRequestId_idx" ON "Quote"("jobRequestId");

-- CreateIndex
CREATE INDEX "WorkInvitation_status_idx" ON "WorkInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkRecord_jobRequestId_key" ON "WorkRecord"("jobRequestId");

-- CreateIndex
CREATE INDEX "WorkRecord_status_idx" ON "WorkRecord"("status");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "JobRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_workRecordId_fkey" FOREIGN KEY ("workRecordId") REFERENCES "WorkRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_homeownerId_fkey" FOREIGN KEY ("homeownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
