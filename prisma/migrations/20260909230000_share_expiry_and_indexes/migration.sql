-- AlterTable
ALTER TABLE "Shortlist" ADD COLUMN     "shareExpiresAt" TIMESTAMP(3),
ADD COLUMN     "shareRevoked" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Deal_advisorId_idx" ON "Deal"("advisorId");

-- CreateIndex
CREATE INDEX "Deal_operatorId_idx" ON "Deal"("operatorId");

-- CreateIndex
CREATE INDEX "Deal_movedInAt_idx" ON "Deal"("movedInAt");

-- CreateIndex
CREATE INDEX "Message_enquiryId_idx" ON "Message"("enquiryId");

-- CreateIndex
CREATE INDEX "Message_sentAt_idx" ON "Message"("sentAt");

-- CreateIndex
CREATE INDEX "Shortlist_enquiryId_idx" ON "Shortlist"("enquiryId");

-- CreateIndex
CREATE INDEX "Shortlist_advisorId_idx" ON "Shortlist"("advisorId");

-- CreateIndex
CREATE INDEX "Shortlist_sentAt_idx" ON "Shortlist"("sentAt");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Visit_enquiryId_idx" ON "Visit"("enquiryId");

-- CreateIndex
CREATE INDEX "Visit_advisorId_idx" ON "Visit"("advisorId");

-- CreateIndex
CREATE INDEX "Visit_scheduledAt_idx" ON "Visit"("scheduledAt");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

