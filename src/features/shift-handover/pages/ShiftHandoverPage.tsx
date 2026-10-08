import { PageHero } from '../../../components/common/PageHero';
import { Timeline } from '../../../components/common/Timeline';

const items = [{ id: '1', title: 'نهاية المناوبة', description: 'ملخص الاعتماديات', time: 'الآن' }];

export function ShiftHandoverPage() {
  return <div className="feature-page"><PageHero title="تبادل المناوبة" description="ملخص محتويات المناوبة الحالية." /><Timeline items={items} /></div>;
}
