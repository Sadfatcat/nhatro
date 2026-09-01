-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "mergedInvoiceId" TEXT;

-- CreateTable
CREATE TABLE "MergedInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'SENT',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MergedInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MergedInvoice_tenantId_idx" ON "MergedInvoice"("tenantId");

-- CreateIndex
CREATE INDEX "MergedInvoice_period_idx" ON "MergedInvoice"("period");

-- CreateIndex
CREATE INDEX "Invoice_mergedInvoiceId_idx" ON "Invoice"("mergedInvoiceId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_mergedInvoiceId_fkey" FOREIGN KEY ("mergedInvoiceId") REFERENCES "MergedInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MergedInvoice" ADD CONSTRAINT "MergedInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

