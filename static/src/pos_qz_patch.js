/** @odoo-module */

import { PosTicketPrinterPlugin } from "@point_of_sale/app/plugins/pos_ticket_printer_plugin";
import { patch } from "@web/core/utils/patch";
import { renderToElement } from "@web/core/utils/render";
import { getQzService } from "./qz_service";

patch(PosTicketPrinterPlugin.prototype, {
  async printOrderReceipt({
    order,
    basic = false,
    printBillActionTriggered = false,
    webFallback = true,
    simplified = false,
  } = {}) {
    const qzService = getQzService() || this.env?.services?.qz_tray;
    const printMethod = this.config?.receipt_print_method || "chrome";

    if (qzService && printMethod === "qz_tray") {
      const data = this.getOrderReceiptData(order, { basic, simplified });
      const el = renderToElement("point_of_sale.pos_order_receipt", data);
      const printerName = await qzService.getDefaultPrinter();

      await qzService.print(printerName, el.outerHTML, "pixel", {});

      if (!printBillActionTriggered) {
        await this.markReceiptAsPrinted(order);
      } else if (!order.nb_print) {
        order.nb_print = 0;
      }

      return { successful: true };
    }

    return super.printOrderReceipt({
      order,
      basic,
      printBillActionTriggered,
      webFallback,
      simplified,
    });
  },
});
