-- CreateTable
CREATE TABLE "InvoiceEditLog" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "editedBy" TEXT,
    "changes" JSONB NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceEditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceEditLog_invoiceId_idx" ON "InvoiceEditLog"("invoiceId");

-- AddForeignKey
ALTER TABLE "InvoiceEditLog" ADD CONSTRAINT "InvoiceEditLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
