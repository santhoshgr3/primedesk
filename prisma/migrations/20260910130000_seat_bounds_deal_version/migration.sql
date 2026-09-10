-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "seatsMax" INTEGER,
ADD COLUMN     "seatsMin" INTEGER;


-- Backfill seat bounds from the existing display range.
UPDATE "Enquiry" SET "seatsMin" = 20,  "seatsMax" = 50     WHERE "seatsNeeded" = '20-50';
UPDATE "Enquiry" SET "seatsMin" = 50,  "seatsMax" = 100    WHERE "seatsNeeded" = '50-100';
UPDATE "Enquiry" SET "seatsMin" = 100, "seatsMax" = 200    WHERE "seatsNeeded" = '100-200';
UPDATE "Enquiry" SET "seatsMin" = 200, "seatsMax" = 100000 WHERE "seatsNeeded" = '200+';
