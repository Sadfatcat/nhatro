-- CreateTable
CREATE TABLE "ClosingBatch" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedBy" TEXT NOT NULL,

    CONSTRAINT "ClosingBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosingBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "invoiceId" TEXT,

    CONSTRAINT "ClosingBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClosingBatch_closedAt_idx" ON "ClosingBatch"("closedAt");

-- CreateIndex
CREATE INDEX "ClosingBatchItem_invoiceId_idx" ON "ClosingBatchItem"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "ClosingBatchItem_batchId_roomId_key" ON "ClosingBatchItem"("batchId", "roomId");

-- AddForeignKey
ALTER TABLE "ClosingBatchItem" ADD CONSTRAINT "ClosingBatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ClosingBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosingBatchItem" ADD CONSTRAINT "ClosingBatchItem_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosingBatchItem" ADD CONSTRAINT "ClosingBatchItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

