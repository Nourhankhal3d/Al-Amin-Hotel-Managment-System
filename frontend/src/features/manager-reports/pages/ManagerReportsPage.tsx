import { PageHero } from '../../../components/common/PageHero';
import { useLanguage } from '../../../core/i18n/useLanguage';

// Placeholder from the Sprint 3 wiring: the page is built in its own PR
export function ManagerReportsPage() {
  const { t } = useLanguage();
  return (
    <div className="feature-page">
      <PageHero title={t('manager.shell.nav.reports')} />
    </div>
  );
}
