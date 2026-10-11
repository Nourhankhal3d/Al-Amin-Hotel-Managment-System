import { useEffect, useRef, useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/common/toast.context';
import { ExportIcon, NoteIcon, ReceiptIcon } from '../../../components/ui/Icons';
import { formatDateTime } from '../../../core/utils/date';
import { formatMoney, toArabicDigits } from '../../../core/utils/numerals';
import { ReceiptView } from './ReceiptView';
import type { Payment } from '../types/payment.types';
import {
  buildPaymentsCsv,
  downloadCsv,
  printReceipt,
} from '../utils/paymentsExport';
import { methodLabel, statusLabel, statusTone } from '../utils/paymentsLabels';

interface PaymentDetailsDrawerProps {
  payment: Payment;
  onClose: () => void;
}

/**
 * Figma-styled payment details panel rendered inside the shared `Drawer`.
 * Keeps the original receipt / CSV / print functionality fully wired.
 */
export function PaymentDetailsDrawer({ payment, onClose }: PaymentDetailsDrawerProps) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const pendingPrint = useRef(false);

  useEffect(() => {
    if (showReceipt && pendingPrint.current) {
      pendingPrint.current = false;
      printReceipt();
    }
  }, [showReceipt]);

  const reference = payment.invoiceNo ?? payment.id;

  const handleCashierLog = () => {
    setShowReceipt((visible) => !visible);
  };

  const handleExport = () => {
    downloadCsv(`payment-${payment.id}.csv`, buildPaymentsCsv([payment]));
    toast.showToast('تم تصدير بيانات الدفعة بنجاح', 'success');
  };

  const handleAddReceipt = () => {
    setShowReceipt(true);
    toast.showToast('تم عرض الإيصال — جاهز للطباعة أو الإرسال', 'info');
  };

  const handleSendReceipt = () => {
    if (showReceipt) {
      printReceipt();
      return;
    }
    pendingPrint.current = true;
    setShowReceipt(true);
  };

  return (
    <div className="al-drawer-body">
      <strong className="al-drawer__id">{reference}</strong>

      <div className="al-drawer__total">
        <span className="al-drawer__total-label">إجمالي الاستلام</span>
        <h3 className="al-drawer__total-value">{formatMoney(payment.amount)}</h3>
        <Badge tone={statusTone(payment.status)}>{statusLabel(payment.status)}</Badge>
      </div>

      <div className="al-drawer__grid">
        <div className="al-drawer__field">
          <span>اسم الصاحب</span>
          <strong>{payment.guestName ?? '—'}</strong>
        </div>
        <div className="al-drawer__field">
          <span>رقم الغرفة</span>
          <strong>{payment.roomNo ? toArabicDigits(payment.roomNo) : '—'}</strong>
        </div>
        <div className="al-drawer__field">
          <span>وقت الإنشاء</span>
          <strong>{formatDateTime(payment.paidAt, 'ar')}</strong>
        </div>
        <div className="al-drawer__field">
          <span>طريقة الدفع</span>
          <strong>{methodLabel(payment.method)}</strong>
        </div>
        <div className="al-drawer__field">
          <span>العملة</span>
          <strong>جنيه مصري (EGP)</strong>
        </div>
        <div className="al-drawer__field">
          <span>رقم المرجع</span>
          <strong>{reference}</strong>
        </div>
      </div>

      <div className="al-drawer__notes">
        <h3>ملاحظات</h3>
        <textarea
          aria-label="ملاحظات الدفعة"
          placeholder="أضف ملاحظة حول هذه الدفعة…"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <div className="al-drawer__actions">
        <button type="button" className="al-drawer__action" onClick={handleCashierLog}>
          <ReceiptIcon />
          سجل الكاشير
        </button>
        <button type="button" className="al-drawer__action" onClick={handleExport}>
          <ExportIcon />
          تصدير
        </button>
        <button type="button" className="al-drawer__action" onClick={handleAddReceipt}>
          <NoteIcon />
          إضافة إيصال
        </button>
      </div>

      {showReceipt && (
        <div className="al-drawer__receipt-slot">
          <ReceiptView payment={payment} />
        </div>
      )}

      <div className="al-drawer__footer">
        <button type="button" className="al-btn al-btn--white" onClick={onClose}>
          إغلاق
        </button>
        <button type="button" className="al-btn al-btn--green" onClick={handleSendReceipt}>
          <ReceiptIcon />
          إرسال إيصال
        </button>
      </div>
    </div>
  );
}
