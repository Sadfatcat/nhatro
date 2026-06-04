-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "billingDay" INTEGER NOT NULL DEFAULT 15;

-- CreateTable
CREATE TABLE "UtilityRecord" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "prevElec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currElec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prevWater" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currWater" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "billingMonth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtilityRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UtilityRecord_roomId_key" ON "UtilityRecord"("roomId");

-- AddForeignKey
ALTER TABLE "UtilityRecord" ADD CONSTRAINT "UtilityRecord_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
