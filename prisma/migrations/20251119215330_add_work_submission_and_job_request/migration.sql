/*
  Warnings:

  - You are about to drop the column `invitationId` on the `WorkRecord` table. All the data in the column will be lost.
  - The `status` column on the `WorkRecord` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `WorkInvitation` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[submissionId]` on the table `WorkRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WorkSubmissionStatus" AS ENUM ('PENDING_REVIEW', 'DOCUMENTED_UNVERIFIED', 'DOCUMENTED', 'APPROVED', 'REJECTED', 'DISPUTED', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "WorkInvitation" DROP CONSTRAINT "WorkInvitation_contractorId_fkey";

-- DropForeignKey
ALTER TABLE "WorkInvitation" DROP CONSTRAINT "WorkInvitation_homeId_fkey";

-- DropForeignKey
ALTER TABLE "WorkInvitation" DROP CONSTRAINT "WorkInvitation_homeownerId_fkey";

-- DropForeignKey
ALTER TABLE "WorkInvitation" DROP CONSTRAINT "WorkInvitation_invitedBy_fkey";

-- DropForeignKey
ALTER TABLE "WorkRecord" DROP CONSTRAINT "WorkRecord_invitationId_fkey";

-- DropIndex
DROP INDEX "WorkRecord_invitationId_idx";

-- DropIndex
DROP INDEX "WorkRecord_invitationId_key";

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "workSubmissionId" TEXT;

-- AlterTable
ALTER TABLE "WorkRecord" DROP COLUMN "invitationId",
ADD COLUMN     "submissionId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "WorkSubmissionStatus" NOT NULL DEFAULT 'DOCUMENTED';

-- DropTable
DROP TABLE "WorkInvitation";

-- DropEnum
DROP TYPE "WorkInvitationStatus";

-- CreateTable
CREATE TABLE "WorkSubmission" (
    "id" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "invitationType" "InvitationType" NOT NULL DEFAULT 'CONTRACTOR_TO_HOMEOWNER',
    "homeAddress" TEXT NOT NULL,
    "homeCity" TEXT,
    "homeState" TEXT,
    "homeZip" TEXT,
    "homeId" TEXT,
    "workType" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "contractorId" TEXT NOT NULL,
    "homeownerId" TEXT,
    "status" "WorkSubmissionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "WorkSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSubmission_contractorId_idx" ON "WorkSubmission"("contractorId");

-- CreateIndex
CREATE INDEX "WorkSubmission_homeownerId_idx" ON "WorkSubmission"("homeownerId");

-- CreateIndex
CREATE INDEX "WorkSubmission_homeId_idx" ON "WorkSubmission"("homeId");

-- CreateIndex
CREATE INDEX "WorkSubmission_status_idx" ON "WorkSubmission"("status");

-- CreateIndex
CREATE INDEX "WorkSubmission_createdAt_idx" ON "WorkSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "Attachment_workSubmissionId_idx" ON "Attachment"("workSubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkRecord_submissionId_key" ON "WorkRecord"("submissionId");

-- CreateIndex
CREATE INDEX "WorkRecord_status_idx" ON "WorkRecord"("status");

-- CreateIndex
CREATE INDEX "WorkRecord_submissionId_idx" ON "WorkRecord"("submissionId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_workSubmissionId_fkey" FOREIGN KEY ("workSubmissionId") REFERENCES "WorkSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSubmission" ADD CONSTRAINT "WorkSubmission_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSubmission" ADD CONSTRAINT "WorkSubmission_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSubmission" ADD CONSTRAINT "WorkSubmission_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSubmission" ADD CONSTRAINT "WorkSubmission_homeownerId_fkey" FOREIGN KEY ("homeownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRecord" ADD CONSTRAINT "WorkRecord_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WorkSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
