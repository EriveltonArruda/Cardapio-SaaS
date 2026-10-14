import type { Order } from "@/types";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  observations?: string;
  addons?: { name: string; price: number }[];
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Abre uma aba com a comanda formatada (layout estreito, estilo impressora
 * térmica) e já dispara o diálogo de impressão do navegador. Não depende de
 * driver de impressora nenhum — imprime em qualquer impressora configurada
 * no sistema operacional, térmica ou comum.
 */
export function printOrderReceipt(order: Order, storeName: string) {
  const items: ReceiptItem[] = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
  const orderCode = order.id.split("-")[0].toUpperCase();
  const dateLabel = new Date(order.created_at).toLocaleString("pt-BR");

  const itemsHtml = (items || [])
    .map((item) => {
      const addonsHtml = (item.addons || [])
        .map((a) => `<div class="addon">+ ${escapeHtml(a.name)}</div>`)
        .join("");
      const obsHtml = item.observations ? `<div class="obs">Obs: ${escapeHtml(item.observations)}</div>` : "";
      return `
        <div class="item">
          <div class="item-row">
            <span>${item.quantity}x ${escapeHtml(item.name)}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
          </div>
          ${addonsHtml}
          ${obsHtml}
        </div>`;
    })
    .join("");

  const html = `
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Comanda #${orderCode}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    width: 300px;
    margin: 0 auto;
    padding: 16px;
    color: #000;
  }
  h1 { font-size: 16px; text-align: center; margin: 0 0 4px; text-transform: uppercase; }
  .center { text-align: center; }
  .divider { border-top: 1px dashed #000; margin: 10px 0; }
  .row { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
  .item { margin: 6px 0; font-size: 12px; }
  .item-row { display: flex; justify-content: space-between; font-weight: bold; }
  .addon { font-size: 11px; margin-left: 8px; }
  .obs { font-size: 11px; font-style: italic; margin-left: 8px; }
  .total { font-size: 15px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 8px; }
  .footer { text-align: center; font-size: 10px; margin-top: 14px; }
  @media print {
    body { width: 100%; }
  }
</style>
</head>
<body>
  <h1>${escapeHtml(storeName)}</h1>
  <p class="center">Pedido #${orderCode}</p>
  <p class="center">${dateLabel}</p>
  <div class="divider"></div>
  <div class="row"><strong>Cliente:</strong></div>
  <div class="row">${escapeHtml(order.customer_name)}</div>
  <div class="row">${escapeHtml(order.customer_phone)}</div>
  <div class="divider"></div>
  <div class="row"><strong>Entrega:</strong></div>
  <div class="row">${escapeHtml(order.address_street)}, ${escapeHtml(order.address_number)}</div>
  <div class="row">${escapeHtml(order.address_neighborhood)}</div>
  ${order.address_landmark ? `<div class="row">Ref: ${escapeHtml(order.address_landmark)}</div>` : ""}
  <div class="divider"></div>
  <p><strong>Itens:</strong></p>
  ${itemsHtml}
  <div class="divider"></div>
  ${order.delivery_fee ? `<div class="row"><span>Taxa de entrega</span><span>${formatPrice(order.delivery_fee)}</span></div>` : ""}
  <div class="total"><span>TOTAL</span><span>${formatPrice(order.total_amount || 0)}</span></div>
  <div class="row" style="margin-top:6px"><strong>Pagamento:</strong> ${escapeHtml((order.payment_method || "A combinar").toUpperCase())}</div>
  <div class="footer">Pedido gerado pelo Cardápio Digital</div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=380,height=600");
  if (!printWindow) return; // navegador bloqueou o popup
  printWindow.document.write(html);
  printWindow.document.close();
}
