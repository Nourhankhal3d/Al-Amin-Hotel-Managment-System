import { SearchIcon } from '../../../components/ui/Icons';
import { PAYMENT_METHODS } from '../../../core/constants/paymentMethods';
import { STATUS } from '../../../core/constants/status';

export interface PaymentsFilterValues {
  query: string;
  method: string;
  status: string;
  from: string;
  to: string;
}

interface PaymentsFiltersProps {
  values: PaymentsFilterValues;
  onChange: (values: PaymentsFilterValues) => void;
  onReset: () => void;
}

export function PaymentsFilters({ values, onChange, onReset }: PaymentsFiltersProps) {
  const update = (patch: Partial<PaymentsFilterValues>) => onChange({ ...values, ...patch });

  return (
    <section className="al-card al-filters" aria-label="عوامل تصفية المدفوعات">
      <div className="al-filters__search">
        <SearchIcon />
        <input
          type="search"
          className="al-input al-input--search"
          aria-label="بحث"
          placeholder="ابحث باسم الضيف أو رقم الفاتورة"
          value={values.query}
          onChange={(event) => update({ query: event.target.value })}
        />
      </div>

      <div className="al-filters__row">
        <select
          className="al-select"
          aria-label="طريقة الدفع"
          value={values.method}
          onChange={(event) => update({ method: event.target.value })}
        >
          <option value="all">كل الطرق</option>
          {Object.values(PAYMENT_METHODS).map((method) => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>

        <select
          className="al-select"
          aria-label="حالة الدفع"
          value={values.status}
          onChange={(event) => update({ status: event.target.value })}
        >
          <option value="all">كل الحالات</option>
          {Object.values(STATUS).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <input
          type="date"
          className="al-input al-input--date"
          aria-label="من تاريخ"
          value={values.from}
          onChange={(event) => update({ from: event.target.value })}
        />

        <input
          type="date"
          className="al-input al-input--date"
          aria-label="إلى تاريخ"
          value={values.to}
          onChange={(event) => update({ to: event.target.value })}
        />

        <button type="button" className="al-link-btn" onClick={onReset}>
          عرض سريع
        </button>
      </div>
    </section>
  );
}
