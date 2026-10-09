import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingState } from '../../../components/common/LoadingState';
import { useToast } from '../../../components/common/toast.context';
import { Badge } from '../../../components/ui/Badge';
import { Drawer } from '../../../components/ui/Drawer';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExportIcon,
  PlusIcon,
  ReceiptIcon,
} from '../../../components/ui/Icons';
import { STATUS } from '../../../core/constants/status';
import { formatDate, formatTime, toDayKey } from '../../../core/utils/date';
import { formatMoney, toArabicDigits } from '../../../core/utils/numerals';
import { usePagination } from '../../../hooks/usePagination';
import { PaymentDetailsDrawer } from '../components/PaymentDetailsDrawer';
import { PaymentsFilters } from '../components/PaymentsFilters';
import type { PaymentsFilterValues } from '../components/PaymentsFilters';
import { PaymentsRevenueCard } from '../components/PaymentsRevenueCard';
import { PaymentsSummary } from '../components/PaymentsSummary';
import { getPaymentsReport } from '../services/payments.api';
import type { Payment } from '../types/payment.types';
import {
  buildPaymentsCsv,
  buildPaymentsFileName,
  downloadCsv,
} from '../utils/paymentsExport';
import { methodLabel, methodTone, statusLabel, statusTone } from '../utils/paymentsLabels';

const PAGE_SIZE = 8;
const QUERY_KEY = ['payments', 'report'] as const;

const emptyPaymentFilters: PaymentsFilterValues = {
  query: '',
  method: 'all',
  status: 'all',
  from: '',
  to: '',
};

/** Local fallback used when the payments API is unreachable (keeps the report usable). */
const seedPayments: Payment[] = [
  { id: 'p-1001', invoiceNo: 'INV-1001', guestName: 'عبدالرحمن محمد', roomNo: '101', amount: 250, method: 'Cash', status: STATUS.completed, paidAt: '2026-10-01T10:15:00', recordedBy: 'Reception' },
  { id: 'p-1002', invoiceNo: 'INV-1002', guestName: 'سارة أحمد', roomNo: '204', amount: 480, method: 'Card', status: STATUS.completed, paidAt: '2026-10-03T14:05:00', recordedBy: 'Reception' },
  { id: 'p-1003', invoiceNo: 'INV-1003', guestName: 'Omar Ali', roomNo: '305', amount: 620, method: 'Transfer', status: STATUS.pending, paidAt: '2026-10-05T09:40:00', recordedBy: 'Accounting' },
  { id: 'p-1004', invoiceNo: 'INV-1004', guestName: 'فاطمة الزهراء', roomNo: '112', amount: 300, method: 'Cash', status: STATUS.completed, paidAt: '2026-10-07T18:20:00', recordedBy: 'Night Shift' },
  { id: 'p-1005', invoiceNo: 'INV-1005', guestName: 'Hassan Karim', roomNo: '410', amount: 750, method: 'Card', status: STATUS.cancelled, paidAt: '2026-10-08T11:00:00', recordedBy: 'Reception' },
  { id: 'p-1006', invoiceNo: 'INV-1006', guestName: 'خالد يوسف', roomNo: '208', amount: 190, method: 'Cash', status: STATUS.inProgress, paidAt: '2026-10-09T08:30:00', recordedBy: 'Reception' },
];

function filterPayments(payments: Payment[], values: PaymentsFilterValues): Payment[] {
  const query = values.query.trim().toLowerCase();

  return payments.filter((payment) => {
    if (values.method !== 'all' && payment.method !== values.method) return false;
    if (values.status !== 'all' && payment.status !== values.status) return false;

    const paidOn = payment.paidAt ? toDayKey(payment.paidAt) : '';
    if (values.from && (!paidOn || paidOn < values.from)) return false;
    if (values.to && (!paidOn || paidOn > values.to)) return false;

    if (query) {
      const haystack = [payment.guestName, payment.invoiceNo, payment.roomNo, payment.method, payment.recordedBy]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export function PaymentsPage() {
  const toast = useToast();
  const [filters, setFilters] = useState<PaymentsFilterValues>(emptyPaymentFilters);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getPaymentsReport(),
  });

  const payments = data ?? seedPayments;
  const filtered = useMemo(() => filterPayments(payments, filters), [payments, filters]);
  const { page, setPage, totalPages, items } = usePagination(filtered, PAGE_SIZE);

  const receipt = receiptId ? payments.find((payment) => payment.id === receiptId) : undefined;

  const handleFiltersChange = (values: PaymentsFilterValues) => {
    setFilters(values);
    setPage(1);
  };

  const handleReset = () => {
    setFilters(emptyPaymentFilters);
    setPage(1);
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.showToast('لا توجد بيانات لتصديرها', 'error');
      return;
    }
    downloadCsv(buildPaymentsFileName(), buildPaymentsCsv(filtered));
    toast.showToast(`تم تصدير ${filtered.length} عملية بنجاح`, 'success');
  };

  const handleAddPayment = () => {
    toast.showToast('إضافة الدفعات ستتاح عبر الخادم — هذه الميزة قيد التجهيز', 'info');
  };

  const rangeFrom = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div className="payments-page">

      <section className="al-hero">
        <div className="al-hero__text">
          <span className="al-hero__chip">المدفوعات</span>
          <h1>سجل المدفوعات</h1>
          <p>تسجيل ومتابعة جميع المدفوعات المستلمة خلال الوردية الحالية</p>
        </div>
        <div className="al-hero__actions">
          <button type="button" className="al-btn al-btn--glass" onClick={handleExport}>
            <ExportIcon />
            تصدير
          </button>
          <button type="button" className="al-btn al-btn--gold" onClick={handleAddPayment}>
            <PlusIcon />
            إضافة دفعة
          </button>
        </div>
      </section>

      {isError && (
        <div className="ui-note">
          تعذر الاتصال بخادم البيانات — يتم عرض بيانات تجريبية.
          <button type="button" className="al-link-btn" onClick={() => refetch()}>إعادة المحاولة</button>
        </div>
      )}

      <PaymentsSummary payments={filtered} />

      <PaymentsRevenueCard payments={filtered} />

      <PaymentsFilters values={filters} onChange={handleFiltersChange} onReset={handleReset} />

      <section className="al-card al-table-card">
        <div className="al-card__head">
          <div>
            <h2>المعاملات الأخيرة</h2>
            <p className="al-card__sub">سجل مالي شامل لجميع مدفوعات الوردية</p>
          </div>
          <span className="al-section-badge">{toArabicDigits(filtered.length)} معاملة</span>
        </div>

        {isPending ? (
          <LoadingState label="جارٍ تحميل المدفوعات" />
        ) : filtered.length === 0 ? (
          <EmptyState title="لا توجد مدفوعات مطابقة" description="جرّب تعديل عوامل التصفية." />
        ) : (
          <>
            <div className="al-table-wrap">
              <table className="al-table">
                <thead>
                  <tr>
                    <th>الحالة</th>
                    <th>طريقة الدفع</th>
                    <th>وقت الإنشاء</th>
                    <th>اسم الصاحب</th>
                    <th>الغرفة</th>
                    <th>المبلغ</th>
                    <th>رقم العملية</th>
                    <th aria-label="إجراءات" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((payment) => (
                    <tr key={payment.id}>
                      <td><Badge tone={statusTone(payment.status)}>{statusLabel(payment.status)}</Badge></td>
                      <td><Badge tone={methodTone(payment.method)}>{methodLabel(payment.method)}</Badge></td>
                      <td>
                        <span className="al-table__time">
                          <strong>{formatTime(payment.paidAt, 'ar')}</strong>
                          <span>{formatDate(payment.paidAt, 'ar')}</span>
                        </span>
                      </td>
                      <td>
                        <span className="al-table__guest">
                          <strong>{payment.guestName ?? '—'}</strong>
                          {payment.recordedBy && <span>{payment.recordedBy}</span>}
                        </span>
                      </td>
                      <td>{payment.roomNo ? toArabicDigits(payment.roomNo) : '—'}</td>
                      <td><span className="al-table__amount">{formatMoney(payment.amount)}</span></td>
                      <td><span className="al-table__mono">{payment.invoiceNo ?? payment.id}</span></td>
                      <td>
                        <button type="button" className="al-link-btn" onClick={() => setReceiptId(payment.id)}>
                          <ReceiptIcon />
                          التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav className="al-pagination" aria-label="تصفح الصفحات">
              <span className="al-pagination__info">
                عرض {toArabicDigits(rangeFrom)}–{toArabicDigits(rangeTo)} من {toArabicDigits(filtered.length)} معاملة
              </span>
              <div className="al-pagination__pages">
                <button type="button" className="al-page-btn" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="الصفحة السابقة">
                  <ChevronRightIcon />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={`al-page-btn${pageNumber === page ? ' al-page-btn--active' : ''}`}
                    aria-current={pageNumber === page ? 'page' : undefined}
                    onClick={() => setPage(pageNumber)}
                  >
                    {toArabicDigits(pageNumber)}
                  </button>
                ))}
                <button type="button" className="al-page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="الصفحة التالية">
                  <ChevronLeftIcon />
                </button>
              </div>
            </nav>
          </>
        )}
      </section>

      <Drawer open={receipt !== undefined} title="تفاصيل الدفعة" onClose={() => setReceiptId(null)}>
        {receipt && <PaymentDetailsDrawer payment={receipt} onClose={() => setReceiptId(null)} />}
      </Drawer>
    </div>
  );
}

