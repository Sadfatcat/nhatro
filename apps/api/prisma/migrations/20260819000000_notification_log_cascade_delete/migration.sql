ALTER TABLE "NotificationLog" DROP CONSTRAINT "NotificationLog_invoiceId_fkey";
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
