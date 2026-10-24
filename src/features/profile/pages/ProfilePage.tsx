import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BedDouble,
  Bell,
  BriefcaseBusiness,
  Check,
  Clock,
  Fingerprint,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  Phone,
  Sparkles,
  Wallet,
  Wrench,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { StatCard } from '../../../components/ui/StatCard';
import { useToast } from '../../../components/ui/ToastContext';
import { getAuthSession, clearAuthSession } from '../../../core/auth/authManager';
import { logoutRequest } from '../../auth/services/auth.api';
import { ROUTES } from '../../../core/constants/routes';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber, formatPercent } from '../../../utils/format';
import './ProfilePage.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { language, dir, t } = useLanguage();
  const session = getAuthSession();
  const staffId = session?.userId ? `EMP-${session.userId.padStart(3, '0')}` : 'EMP-018';

  // Contact details the receptionist can edit (kept locally until the backend has a profile endpoint)
  const [contact, setContact] = useState({
    name: session?.staffName || t('topbar.userName'),
    email: session?.email || (session?.userId ? `reception${session.userId === '1' ? '' : session.userId}@alaminhotel.com` : 'reception@alaminhotel.com'),
    phone: '+20 100 000 0000',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...contact });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsEditing(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isEditing]);

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // the local logout below must happen even if the server call fails
    }
    clearAuthSession();
    navigate(ROUTES.login, { replace: true });
  }

  function openEdit() {
    setEditForm({ ...contact });
    setIsEditing(true);
  }

  function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    window.setTimeout(() => {
      setContact({ ...editForm });
      setSaving(false);
      setIsEditing(false);
      toast.notify(t('profilePage.saved'), 'success');
    }, 400);
  }

  const n = (value: number) => formatNumber(value, language);
  const activity = [
    { id: 'payment', icon: Wallet, tone: 'success' as const, status: t('profilePage.activity.statusSuccess'), title: t('profilePage.activity.payment'), desc: t('profilePage.activity.paymentDesc'), time: '11:42' },
    { id: 'cleaning', icon: Sparkles, tone: 'info' as const, status: t('profilePage.activity.statusInfo'), title: t('profilePage.activity.cleaning'), desc: t('profilePage.activity.cleaningDesc'), time: '11:18' },
    { id: 'maintenance', icon: Wrench, tone: 'warning' as const, status: t('profilePage.activity.statusWarning'), title: t('profilePage.activity.maintenance'), desc: t('profilePage.activity.maintenanceDesc'), time: '10:56' },
  ];
  const tasks = [
    { id: 'arrival', icon: BedDouble, label: t('profilePage.tasks.arrival'), status: t('profilePage.tasks.following'), tone: 'info' as const, time: '12:00' },
    { id: 'payment', icon: Wallet, label: t('profilePage.tasks.payment'), status: t('profilePage.tasks.done'), tone: 'success' as const, time: '11:42' },
    { id: 'maintenance', icon: Wrench, label: t('profilePage.tasks.maintenance'), status: t('profilePage.tasks.pending'), tone: 'warning' as const, time: '10:56' },
  ];
  const history = [
    { id: '18', day: 18, score: 92, shift: t('profilePage.history.morning') },
    { id: '17', day: 17, score: 88, shift: t('profilePage.history.evening') },
    { id: '15', day: 15, score: 90, shift: t('profilePage.history.night') },
  ];
  const monthName = new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-EG', { month: 'long' }).format(new Date(2026, 5, 1));
  const clock = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="feature-page profile-page" dir={dir}>
      <Card className="profile-hero">
        <span className="profile-hero__logo"><img src="/al-amin-hotel-logo.png" alt={t('profilePage.logoAlt')} /></span>
        <div className="profile-hero__copy">
          <span className="profile-hero__eyebrow">{t('profilePage.eyebrow')}</span>
          <h1>{contact.name}</h1>
          <div className="profile-hero__identity">
            <Badge tone="success">{t('profilePage.account.roleValue')}</Badge>
            <span className="profile-hero__staff-id"><Fingerprint aria-hidden="true" /><bdi>{staffId}</bdi></span>
          </div>
          <p>{t('profilePage.title')}</p>
          <small>{t('profilePage.location')}</small>
        </div>
        <div className="profile-hero__actions">
          <Button variant="secondary" onClick={openEdit}>{t('profilePage.edit')}</Button>
          <Button onClick={() => navigate(ROUTES.settings)}>{t('profilePage.preferences')}</Button>
        </div>
      </Card>

      <section className="profile-page__stats" aria-label={t('profilePage.stats.shift')}>
        <StatCard label={t('profilePage.stats.shift')} value={t('profilePage.stats.shiftValue')} icon={<Clock />} tone="green" />
        <StatCard label={t('profilePage.stats.tasks')} value={14} icon={<Check />} tone="green" />
        <StatCard label={t('profilePage.stats.rooms')} value={18} icon={<BedDouble />} tone="gold" />
        <StatCard label={t('profilePage.stats.shifts')} value={24} icon={<ArrowLeftRight />} tone="gold" />
      </section>

      <div className="profile-page__row">
        <Card className="profile-panel">
          <header className="profile-panel__heading">
            <div><h2>{t('profilePage.account.title')}</h2><p>{t('profilePage.account.subtitle')}</p></div>
            <span className="profile-panel__pill">{t('profilePage.account.active')}</span>
          </header>
          <div className="profile-info-grid">
            <div className="profile-info"><span><BriefcaseBusiness aria-hidden="true" />{t('profilePage.account.role')}</span><strong>{t('profilePage.account.roleValue')}</strong></div>
            <div className="profile-info"><span><Fingerprint aria-hidden="true" />{t('profilePage.account.account')}</span><strong><bdi>{staffId}</bdi></strong></div>
            <div className="profile-info"><span><Mail aria-hidden="true" />{t('profilePage.account.email')}</span><strong><bdi>{contact.email}</bdi></strong></div>
            <div className="profile-info"><span><Phone aria-hidden="true" />{t('profilePage.account.phone')}</span><strong><bdi>{contact.phone}</bdi></strong></div>
            <div className="profile-info"><span><Clock aria-hidden="true" />{t('profilePage.account.shift')}</span><strong>{t('profilePage.account.shiftValue')}</strong></div>
            <div className="profile-info"><span><LogIn aria-hidden="true" />{t('profilePage.account.lastLogin')}</span><strong>{t('profilePage.account.lastLoginValue')}</strong></div>
          </div>
        </Card>

        <Card className="profile-panel">
          <header className="profile-panel__heading">
            <div><h2>{t('profilePage.activity.title')}</h2><p>{t('profilePage.activity.subtitle')}</p></div>
          </header>
          <ol className="profile-activity">
            {activity.map((item) => (
              <li key={item.id}>
                <span className={`profile-activity__icon profile-activity__icon--${item.tone}`}><item.icon aria-hidden="true" /></span>
                <div className="profile-activity__content">
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                  <Badge tone={item.tone}>{item.status}</Badge>
                </div>
                <time dir="auto">{clock(item.time)}</time>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="profile-page__row">
        <Card className="profile-panel">
          <header className="profile-panel__heading">
            <div><h2>{t('profilePage.tasks.title')}</h2><p>{t('profilePage.tasks.subtitle')}</p></div>
            <span className="profile-panel__pill">{t('profilePage.tasks.count').replace('{count}', n(tasks.length))}</span>
          </header>
          <ul className="profile-tasks">
            {tasks.map((task) => (
              <li key={task.id}>
                <task.icon aria-hidden="true" />
                <span className="profile-tasks__details">{task.label}<time dir="auto">{clock(task.time)}</time></span>
                <Badge tone={task.tone}>{task.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="profile-panel">
          <header className="profile-panel__heading">
            <div><h2>{t('profilePage.history.title')}</h2><p>{t('profilePage.history.subtitle')}</p></div>
          </header>
          <div className="profile-history">
            {history.map((entry) => (
              <div key={entry.id}>
                <span>{n(entry.day)} {monthName}</span>
                <strong>{formatPercent(entry.score, language)}</strong>
                <small>{entry.shift}</small>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="profile-actions">
        <Button onClick={() => navigate(ROUTES.settings)}><KeyRound aria-hidden="true" />{t('profilePage.actions.password')}</Button>
        <Button variant="secondary" onClick={() => navigate(ROUTES.settings)}><Bell aria-hidden="true" />{t('profilePage.actions.notifications')}</Button>
        <Button variant="secondary" onClick={() => navigate(ROUTES.login)}><ArrowLeftRight aria-hidden="true" />{t('profilePage.actions.switch')}</Button>
        <Button variant="secondary" className="profile-actions__logout" onClick={handleLogout}><LogOut aria-hidden="true" />{t('profilePage.actions.logout')}</Button>
      </Card>

      {isEditing && (
        <div className="ui-drawer-backdrop" onClick={() => setIsEditing(false)}>
          <div className="ui-dialog figma-dialog profile-edit" role="dialog" aria-modal="true" aria-label={t('editProfile')} onClick={(event) => event.stopPropagation()}>
            <h2>{t('editProfile')}</h2>
            <form onSubmit={handleSaveProfile} className="profile-edit__form">
              <label className="profile-edit__field">
                <span>{t('fullNameLabel')}</span>
                <Input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} required />
              </label>
              <label className="profile-edit__field">
                <span>{t('emailLabel')}</span>
                <Input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} required />
              </label>
              <label className="profile-edit__field">
                <span>{t('phoneLabel')}</span>
                <Input type="tel" value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} required />
              </label>
              <div className="ui-dialog__actions">
                <Button variant="secondary" onClick={() => setIsEditing(false)}>{t('cancel')}</Button>
                <Button type="submit" disabled={saving}>{saving ? t('loading') : t('save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
