import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/** One bucket as already-resolved display strings (i18n + currency applied upstream). */
export interface BudgetPdfBucket {
  title: string;
  pct: number;
  accent: string;
  amount: string;
  items: { label: string; amount: string }[];
}

/** Everything the PDF needs, pre-localised and pre-formatted by the caller. */
export interface BudgetPdfData {
  title: string;
  subtitle: string;
  netLabel: string;
  net: string;
  buckets: BudgetPdfBucket[];
  footer: string;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );

/** Render the budget split as a standalone, print-ready HTML document. */
export function buildBudgetHtml(data: BudgetPdfData): string {
  const buckets = data.buckets
    .map(
      (b) => `
      <section class="bucket" style="border-color:${b.accent}">
        <div class="bhead">
          <span class="btitle">${escapeHtml(b.title)}</span>
          <span class="pill" style="background:${b.accent}">${b.pct}%</span>
        </div>
        <div class="bamount" style="color:${b.accent}">${escapeHtml(b.amount)}</div>
        <div class="track"><div class="fill" style="width:${b.pct}%;background:${b.accent}"></div></div>
        <div class="items">
          ${b.items
            .map(
              (it) => `<div class="row"><span>${escapeHtml(it.label)}</span><span class="iamount">${escapeHtml(
                it.amount,
              )}</span></div>`,
            )
            .join('')}
        </div>
      </section>`,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 32px; }
    h1 { font-size: 26px; margin: 0 0 4px; }
    .subtitle { color: #64748b; font-size: 13px; margin: 0 0 24px; }
    .net { background: #0f172a; color: #fff; border-radius: 16px; padding: 16px 20px; margin-bottom: 24px; }
    .net .label { font-size: 12px; opacity: .7; text-transform: uppercase; letter-spacing: .5px; }
    .net .value { font-size: 30px; font-weight: 800; letter-spacing: -1px; }
    .bucket { border: 1px solid; border-radius: 16px; padding: 16px 18px; margin-bottom: 16px; }
    .bhead { display: flex; justify-content: space-between; align-items: center; }
    .btitle { font-size: 15px; font-weight: 800; letter-spacing: .5px; }
    .pill { color: #fff; font-size: 12px; font-weight: 800; padding: 2px 10px; border-radius: 999px; }
    .bamount { font-size: 28px; font-weight: 800; letter-spacing: -1px; margin: 8px 0; }
    .track { height: 4px; border-radius: 999px; background: #e2e8f0; overflow: hidden; margin-bottom: 12px; }
    .fill { height: 100%; border-radius: 999px; }
    .row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
    .row span:first-child { color: #64748b; }
    .iamount { font-weight: 600; }
    .footer { color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px; }
  </style></head><body>
    <h1>${escapeHtml(data.title)}</h1>
    <p class="subtitle">${escapeHtml(data.subtitle)}</p>
    <div class="net">
      <div class="label">${escapeHtml(data.netLabel)}</div>
      <div class="value">${escapeHtml(data.net)}</div>
    </div>
    ${buckets}
    <p class="footer">${escapeHtml(data.footer)}</p>
  </body></html>`;
}

/** Print the HTML to a PDF file and open the native share sheet. */
export async function exportBudgetPdf(html: string, dialogTitle: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: 'com.adobe.pdf',
    });
  }
}
