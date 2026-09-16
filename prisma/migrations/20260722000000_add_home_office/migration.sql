-- AlterTable User: add homeOfficeDays column
ALTER TABLE "User" ADD COLUMN "homeOfficeDays" TEXT NOT NULL DEFAULT '[]';

-- AlterTable Shift: add isHomeOffice column
ALTER TABLE "Shift" ADD COLUMN "isHomeOffice" BOOLEAN NOT NULL DEFAULT false;
