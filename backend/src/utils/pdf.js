const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { DateTime } = require('luxon');
const { drawLine, wrapLines } = require('./rtlText');

const FONT_DIR = path.join(__dirname, '../../assets/fonts');
const FONT_REGULAR = path.join(FONT_DIR, 'IBMPlexSansArabic-Regular.ttf');
const FONT_BOLD = path.join(FONT_DIR, 'IBMPlexSansArabic-Bold.ttf');
const ZONE = 'Africa/Cairo';

// Same colors as the receptionist screens
const COLORS = {
  green: '#41C06A',
  greenDark: '#35A85A',
  greenSoft: '#EAF8EF',
  gold: '#8A6D3B',
  goldSoft: '#F8F0DF',
  danger: '#D45C5C',
  text: '#1F2A22',
  muted: '#7D827E',
  border: '#EBE8E0',
  surface: '#FAF8F4',
  white: '#FFFFFF',
};

const PAGE = { width: 595.28, height: 841.89, margin: 40 };
const LEFT = PAGE.margin;
const WIDTH = PAGE.width - PAGE.margin * 2;
const TOP = PAGE.margin;
const BOTTOM = PAGE.height - 60; // room for the footer

const SHIFT_TYPE = { morning: 'صباحية', evening: 'مسائية', night: 'ليلية' };
const METHOD = { cash: 'نقدي', instapay: 'إنستاباي', vodafone_cash: 'فودافون كاش' };
const PRIORITY = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' };
const CLEANING_STATUS = { pending: 'معلّقة', done: 'تمت' };
const MAINTENANCE_STATUS = { open: 'مفتوحة', in_progress: 'قيد التنفيذ', resolved: 'تم الحل' };
const EXPENSE_CATEGORY = {
  electricity: 'كهرباء',
  water: 'مياه',
  maintenance_supplies: 'مستلزمات صيانة',
  cleaning_supplies: 'مستلزمات نظافة',
  internet: 'إنترنت',
  emergency: 'طارئ',
  other: 'أخرى',
};

const money = (value) => {
  const n = Number(value || 0);
  const digits = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? '-' : ''}${digits} ج.م`;
};
const cairoDateTime = (iso) => (iso ? DateTime.fromISO(iso).setZone(ZONE).toFormat('yyyy-MM-dd  HH:mm') : '—');
// Numbers read right-to-left in an Arabic line, so the list is reversed to keep 101 before 205
const numberList = (items) => (items.length ? [...items].reverse().join(' ، ') : '—');

/** Builds the PDF page by page; every helper moves `y` down. */
function createReport(doc) {
  let y = TOP;

  const font = (bold, size, color = COLORS.text) => doc.font(bold ? 'bold' : 'regular').fontSize(size).fillColor(color);

  const newPage = () => {
    doc.addPage();
    y = TOP;
  };
  const ensureSpace = (height) => {
    if (y + height > BOTTOM) {
      newPage();
      return true;
    }
    return false;
  };

  const header = (data) => {
    doc.roundedRect(LEFT, y, WIDTH, 78, 14).fill(COLORS.green);
    font(true, 20, COLORS.white);
    drawLine(doc, 'فندق الأمين', LEFT + 20, y + 14, WIDTH - 40);
    font(false, 11, COLORS.white);
    drawLine(doc, 'التقرير الرسمي لتسليم الوردية', LEFT + 20, y + 46, WIDTH - 40);
    font(false, 9, COLORS.white);
    drawLine(doc, 'Al-Amin Hotel', LEFT + 20, y + 18, 200, 'left');
    drawLine(doc, `${data.shift.shift_date}`, LEFT + 20, y + 46, 200, 'left');
    y += 96;
  };

  const section = (title, subtitle) => {
    ensureSpace(64);
    font(true, 13, COLORS.greenDark);
    drawLine(doc, title, LEFT, y, WIDTH);
    y += 20;
    if (subtitle) {
      font(false, 8.5, COLORS.muted);
      drawLine(doc, subtitle, LEFT, y, WIDTH);
      y += 14;
    }
    doc.moveTo(LEFT, y + 2).lineTo(LEFT + WIDTH, y + 2).lineWidth(0.6).strokeColor(COLORS.border).stroke();
    y += 10;
  };

  /** Boxes in one row, first item on the right: [{ label, value, color, background }] */
  const statBoxes = (items, perRow = items.length) => {
    const gap = 8;
    const boxWidth = (WIDTH - gap * (perRow - 1)) / perRow;
    const boxHeight = 48;
    for (let i = 0; i < items.length; i += perRow) {
      ensureSpace(boxHeight + 8);
      items.slice(i, i + perRow).forEach((item, index) => {
        const x = LEFT + WIDTH - (index + 1) * boxWidth - index * gap;
        doc.roundedRect(x, y, boxWidth, boxHeight, 8).fill(item.background || COLORS.surface);
        font(false, 8.5, COLORS.muted);
        drawLine(doc, item.label, x + 10, y + 8, boxWidth - 20);
        font(true, 13, item.color || COLORS.text);
        drawLine(doc, String(item.value), x + 10, y + 23, boxWidth - 20);
      });
      y += boxHeight + 8;
    }
  };

  /**
   * Table with columns from right to left: [{ label, width, value(row), color?(row) }]
   * Widths are fractions of the page width. Long cells wrap; the header repeats on a new page.
   */
  const table = (columns, rows, emptyText) => {
    const pad = 6;
    const lineHeight = 13;
    const widths = columns.map((c) => c.width * WIDTH);
    const xs = [];
    let right = LEFT + WIDTH;
    widths.forEach((w) => {
      right -= w;
      xs.push(right);
    });

    const drawHeader = () => {
      doc.rect(LEFT, y, WIDTH, 22).fill(COLORS.greenSoft);
      font(true, 8.5, COLORS.greenDark);
      columns.forEach((c, i) => drawLine(doc, c.label, xs[i] + pad, y + 6, widths[i] - pad * 2));
      y += 22;
    };

    ensureSpace(22 + 24);
    drawHeader();

    if (rows.length === 0) {
      font(false, 9, COLORS.muted);
      drawLine(doc, emptyText, LEFT, y + 7, WIDTH, 'center');
      y += 26;
      doc.moveTo(LEFT, y).lineTo(LEFT + WIDTH, y).lineWidth(0.6).strokeColor(COLORS.border).stroke();
      y += 12;
      return;
    }

    rows.forEach((row) => {
      font(false, 9);
      const cells = columns.map((c, i) => wrapLines(doc, String(c.value(row) ?? '—') || '—', widths[i] - pad * 2));
      const height = Math.max(...cells.map((lines) => lines.length)) * lineHeight + pad * 2;
      if (ensureSpace(height)) drawHeader();
      cells.forEach((lines, i) => {
        const color = columns[i].color ? columns[i].color(row) : COLORS.text;
        font(Boolean(columns[i].bold), 9, color);
        lines.forEach((line, n) => drawLine(doc, line, xs[i] + pad, y + pad + n * lineHeight, widths[i] - pad * 2));
      });
      y += height;
      doc.moveTo(LEFT, y).lineTo(LEFT + WIDTH, y).lineWidth(0.6).strokeColor(COLORS.border).stroke();
    });
    y += 12;
  };

  const labelValue = (label, value) => {
    ensureSpace(18);
    font(false, 9.5, COLORS.muted);
    drawLine(doc, label, LEFT, y, WIDTH);
    const labelWidth = doc.widthOfString(`${label} `);
    font(true, 9.5, COLORS.text);
    drawLine(doc, value, LEFT, y, WIDTH - labelWidth - 4);
    y += 17;
  };

  const notesBox = (text) => {
    font(false, 10);
    const lines = wrapLines(doc, text, WIDTH - 28);
    const height = lines.length * 16 + 20;
    ensureSpace(height);
    doc.roundedRect(LEFT, y, WIDTH, height, 8).fill(COLORS.surface);
    font(false, 10, COLORS.text);
    lines.forEach((line, i) => drawLine(doc, line, LEFT + 14, y + 10 + i * 16, WIDTH - 28));
    y += height + 12;
  };

  const space = (h) => {
    y += h;
  };

  return { header, section, statBoxes, table, labelValue, notesBox, space };
}

function footers(doc, data) {
  const range = doc.bufferedPageRange();
  const created = cairoDateTime(data.shift.handed_over_at || new Date().toISOString());
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const y = PAGE.height - 42;
    doc.moveTo(LEFT, y - 6).lineTo(LEFT + WIDTH, y - 6).lineWidth(0.6).strokeColor(COLORS.border).stroke();
    doc.font('regular').fontSize(8).fillColor(COLORS.muted);
    drawLine(doc, 'فندق الأمين — تقرير تسليم الوردية', LEFT, y, WIDTH);
    drawLine(doc, `صفحة ${i + 1} من ${range.count}`, LEFT, y, WIDTH, 'center');
    drawLine(doc, `تم الإنشاء: ${created}`, LEFT, y, WIDTH, 'left');
  }
}

/**
 * Generates the official shift handover report (Arabic, right-to-left).
 * @param {object} data the shift summary (+ staff, + details from shiftReport.details)
 * @returns {Promise<{ pdfBuffer: Buffer, sha256: string }>}
 */
function generateShiftReportPdf(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: TOP, bottom: 10, left: LEFT, right: LEFT },
        bufferPages: true,
        info: { Title: 'تقرير تسليم الوردية — فندق الأمين', Author: 'Al-Amin Hotel' },
      });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const sha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
        resolve({ pdfBuffer, sha256 });
      });
      doc.on('error', reject);

      doc.registerFont('regular', FONT_REGULAR);
      doc.registerFont('bold', FONT_BOLD);

      const details = data.details || {};
      const payments = data.payments || {};
      const pending = details.pending || {};
      const surveys = details.surveys || { count: 0, average: null, items: [] };
      const expensesTotal = Number(details.expenses_total || 0);
      const net = details.net ?? Number(payments.total || 0) - expensesTotal;
      const r = createReport(doc);

      r.header(data);

      // 1. Shift and receptionist
      r.section('بيانات الوردية');
      r.statBoxes([
        { label: 'الموظف', value: data.staff?.name || '—' },
        { label: 'اسم المستخدم', value: data.staff?.username || '—' },
        { label: 'الوردية', value: SHIFT_TYPE[data.shift.shift_type] || data.shift.shift_type },
      ]);
      r.statBoxes([
        { label: 'التاريخ', value: data.shift.shift_date },
        { label: 'المواعيد', value: `من ${data.shift.start_time} إلى ${data.shift.end_time}` },
        { label: 'وقت التسليم', value: cairoDateTime(data.shift.handed_over_at) },
      ]);
      r.space(6);

      // 2. Collections, expenses and net
      r.section('التحصيل المالي', 'المبالغ المحصّلة خلال الوردية حسب طريقة الدفع، والمصروفات، وصافي الوردية');
      r.statBoxes([
        { label: 'نقدي', value: money(payments.cash) },
        { label: 'إنستاباي', value: money(payments.instapay) },
        { label: 'فودافون كاش', value: money(payments.vodafone_cash) },
      ]);
      r.statBoxes([
        { label: 'إجمالي التحصيل', value: money(payments.total), color: COLORS.greenDark, background: COLORS.greenSoft },
        {
          label: 'إجمالي المصروفات',
          value: money(expensesTotal ? -expensesTotal : 0),
          color: expensesTotal ? COLORS.danger : COLORS.text,
        },
        {
          label: 'صافي الوردية',
          value: money(net),
          color: net < 0 ? COLORS.danger : COLORS.greenDark,
          background: net < 0 ? '#FBE9E9' : COLORS.greenSoft,
        },
      ]);
      r.space(4);
      r.table(
        [
          { label: 'الوقت', width: 0.1, value: (p) => p.time },
          { label: 'الغرفة', width: 0.1, value: (p) => p.room_number },
          { label: 'الضيف', width: 0.3, value: (p) => p.guest_name },
          { label: 'طريقة الدفع', width: 0.16, value: (p) => METHOD[p.method] || p.method },
          { label: 'المبلغ', width: 0.18, bold: true, value: (p) => money(p.amount), color: (p) => (p.amount < 0 ? COLORS.danger : COLORS.greenDark) },
          { label: 'الحالة', width: 0.16, value: (p) => (p.is_reversal ? 'استرداد' : p.verified ? 'مؤكدة' : 'غير مؤكدة') },
        ],
        details.payments || [],
        'لا توجد مدفوعات في هذه الوردية',
      );
      r.table(
        [
          { label: 'الوقت', width: 0.1, value: (e) => e.time },
          { label: 'الفئة', width: 0.2, value: (e) => EXPENSE_CATEGORY[e.category] || e.category },
          { label: 'المبلغ', width: 0.18, bold: true, value: (e) => money(-e.amount), color: () => COLORS.danger },
          { label: 'ملاحظات', width: 0.52, value: (e) => e.notes || '—' },
        ],
        details.expenses || [],
        'لا توجد مصروفات في هذه الوردية',
      );

      // 3. Front desk
      r.section('عمليات الاستقبال');
      r.statBoxes([
        { label: 'تسجيل وصول', value: data.check_ins ?? 0 },
        { label: 'تسجيل مغادرة', value: data.check_outs ?? 0 },
        { label: 'الغرف التي تم التعامل معها', value: (details.rooms_handled || data.rooms_handled || []).length },
      ]);
      if (details.rooms_handled) r.labelValue('أرقام الغرف:', numberList(details.rooms_handled));
      r.space(6);

      // 4. Housekeeping and maintenance created in this shift
      r.section('النظافة', 'مهام النظافة التي سُجّلت خلال الوردية');
      r.table(
        [
          { label: 'الغرفة', width: 0.12, value: (t) => t.room_number },
          { label: 'الأولوية', width: 0.14, value: (t) => PRIORITY[t.priority] || t.priority },
          { label: 'الحالة', width: 0.14, value: (t) => CLEANING_STATUS[t.status] || t.status },
          { label: 'عامل النظافة', width: 0.22, value: (t) => t.cleaner_name || '—' },
          { label: 'ملاحظات', width: 0.38, value: (t) => t.notes || '—' },
        ],
        details.cleaning_tasks || [],
        'لم تُسجّل مهام نظافة في هذه الوردية',
      );
      r.section('الصيانة', 'بلاغات الصيانة التي سُجّلت خلال الوردية');
      r.table(
        [
          { label: 'الغرفة', width: 0.12, value: (i) => i.room_number },
          { label: 'المشكلة', width: 0.46, value: (i) => i.problem },
          { label: 'الأولوية', width: 0.2, value: (i) => PRIORITY[i.priority] || i.priority },
          { label: 'الحالة', width: 0.22, value: (i) => MAINTENANCE_STATUS[i.status] || i.status },
        ],
        details.maintenance_issues || [],
        'لم تُسجّل بلاغات صيانة في هذه الوردية',
      );

      // 5. Guest surveys
      r.section('استبيانات رضا النزلاء');
      r.statBoxes([
        { label: 'عدد الاستبيانات', value: surveys.count },
        { label: 'متوسط التقييم', value: surveys.average == null ? '—' : `${surveys.average} من 5` },
      ], 3);
      r.table(
        [
          { label: 'الغرفة', width: 0.14, value: (s) => s.room_number },
          { label: 'الضيف', width: 0.4, value: (s) => s.guest_name },
          { label: 'التقييم العام', width: 0.22, value: (s) => `${s.overall_rating} من 5` },
          { label: 'واجه مشكلة؟', width: 0.24, value: (s) => (s.had_problem ? 'نعم' : 'لا'), color: (s) => (s.had_problem ? COLORS.danger : COLORS.text) },
        ],
        surveys.items || [],
        'لم تُسجّل استبيانات في هذه الوردية',
      );

      // 6. Left for the next shift
      r.section('معلّق للوردية التالية', 'أعمال مفتوحة يجب متابعتها بعد التسليم');
      r.statBoxes([
        { label: 'نظافة معلّقة', value: (pending.cleaning || data.pending?.cleaning_tasks || []).length, color: COLORS.gold, background: COLORS.goldSoft },
        { label: 'صيانة مفتوحة', value: (pending.maintenance || data.pending?.maintenance_issues || []).length, color: COLORS.gold, background: COLORS.goldSoft },
        { label: 'مدفوعات غير مؤكدة', value: (pending.unverified_payments || data.pending?.unverified_payments || []).length, color: COLORS.gold, background: COLORS.goldSoft },
      ]);
      if (details.pending) {
        r.table(
          [
            { label: 'الغرفة', width: 0.14, value: (row) => row.room_number },
            { label: 'النوع', width: 0.2, value: (row) => row.kind },
            { label: 'التفاصيل', width: 0.66, value: (row) => row.text },
          ],
          [
            ...(pending.cleaning || []).map((t) => ({ room_number: t.room_number, kind: 'نظافة', text: `أولوية ${PRIORITY[t.priority] || t.priority}` })),
            ...(pending.maintenance || []).map((i) => ({
              room_number: i.room_number,
              kind: 'صيانة',
              text: `${i.problem} — ${MAINTENANCE_STATUS[i.status] || i.status}`,
            })),
            ...(pending.unverified_payments || []).map((p) => ({
              room_number: p.room_number,
              kind: 'دفعة غير مؤكدة',
              text: `${money(p.amount)} — ${METHOD[p.method] || p.method}`,
            })),
          ],
          'لا توجد أعمال معلّقة',
        );
      }

      // 7. Notes
      r.section('ملاحظات التسليم');
      r.notesBox(data.shift.shift_notes || 'لم تُكتب ملاحظات للتسليم.');

      footers(doc, data);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateShiftReportPdf };
