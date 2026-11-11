import { useMemo } from 'react';
import { useLanguage } from '../../../core/i18n/useLanguage';
import type { ReportFilterOptions } from '../types/manager-reports.types';

export function useReportFilterOptions(): ReportFilterOptions {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return useMemo<ReportFilterOptions>(
    () => ({
      periods: [
        { value: 'daily', label: isAr ? 'يومي' : 'Daily' },
        { value: 'weekly', label: isAr ? 'أسبوعي' : 'Weekly' },
        { value: 'monthly', label: isAr ? 'شهري' : 'Monthly' },
        { value: 'yearly', label: isAr ? 'سنوي' : 'Yearly' },
      ],
      floors: [
        { value: 'ALL', label: isAr ? 'جميع الطوابق' : 'All Floors' },
        { value: '1', label: isAr ? 'طابق 1' : 'Floor 1' },
        { value: '2', label: isAr ? 'طابق 2' : 'Floor 2' },
        { value: '3', label: isAr ? 'طابق 3' : 'Floor 3' },
      ],
      roomTypes: [
        { value: 'ALL', label: isAr ? 'كل الأنواع' : 'All Types' },
        { value: 'standard', label: isAr ? 'غرفة عادية' : 'Standard' },
        { value: 'vip', label: isAr ? 'غرفة VIP' : 'VIP' },
        { value: 'suite', label: isAr ? 'جناح فندقي' : 'Suite' },
      ],
      shifts: [
        { value: 'ALL', label: isAr ? 'جميع الورديات' : 'All Shifts' },
        { value: 'morning', label: isAr ? 'الوردية الصباحية' : 'Morning Shift' },
        { value: 'evening', label: isAr ? 'الوردية المسائية' : 'Evening Shift' },
        { value: 'night', label: isAr ? 'الوردية الليلية' : 'Night Shift' },
      ],
      roomStatuses: [
        { value: 'ALL', label: isAr ? 'كل الحالات' : 'All Statuses' },
        { value: 'AVAILABLE', label: isAr ? 'متاحة' : 'Available' },
        { value: 'OCCUPIED', label: isAr ? 'مشغولة' : 'Occupied' },
        { value: 'CLEANING', label: isAr ? 'قيد التنظيف' : 'Cleaning' },
        { value: 'MAINTENANCE', label: isAr ? 'تحت الصيانة' : 'Maintenance' },
      ],
      paymentMethods: [
        { value: 'ALL', label: isAr ? 'كل الطرق' : 'All Methods' },
        { value: 'CASH', label: isAr ? 'نقدي' : 'Cash' },
        { value: 'INSTAPAY', label: isAr ? 'إنستاباي' : 'Instapay' },
        { value: 'VODAFONE_CASH', label: isAr ? 'فودافون كاش' : 'Vodafone Cash' },
      ],
      expenseCategories: [
        { value: 'ALL', label: isAr ? 'كل الفئات' : 'All Categories' },
        { value: 'CLEANING', label: isAr ? 'مستلزمات تنظيف' : 'Cleaning Supplies' },
        { value: 'UTILITIES', label: isAr ? 'كهرباء ومياه' : 'Utilities' },
        { value: 'MAINTENANCE', label: isAr ? 'مستلزمات صيانة' : 'Maintenance' },
        { value: 'EMERGENCY', label: isAr ? 'مصروفات طارئة' : 'Emergency' },
      ],
    }),
    [isAr],
  );
}
