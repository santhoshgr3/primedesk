-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "score" INTEGER,
ADD COLUMN     "scoredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Shortlist" ADD COLUMN     "shareToken" TEXT,
ADD COLUMN     "viewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ShortlistItem" ADD COLUMN     "clientPreferred" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Shortlist_shareToken_key" ON "Shortlist"("shareToken");

