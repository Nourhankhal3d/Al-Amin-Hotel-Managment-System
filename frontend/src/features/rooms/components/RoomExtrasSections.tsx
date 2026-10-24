import type { Language } from '../../../core/i18n';
import { getTranslation } from '../../../core/i18n';
import { formatDate } from '../../../utils/date';
import { formatCurrency } from '../../../utils/format';
import { useRoomExtras } from '../services/useRoomExtras';
import './RoomExtrasSections.css';

interface RoomExtrasSectionsProps {
  roomId: string;
  language: Language;
}

function InfoTile({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="room-extras__tile">
      <span>{label}</span>
      <strong dir={ltr ? 'ltr' : undefined}>{value}</strong>
    </div>
  );
}

export function RoomExtrasSections({ roomId, language }: RoomExtrasSectionsProps) {
  const t = (key: string) => getTranslation(language, key);
  const { data, isLoading, isError } = useRoomExtras(roomId);

  if (isLoading) {
    return <p className="room-extras__muted">{t('rooms.drawer.extrasLoading')}</p>;
  }
  if (isError || !data) {
    return <p className="room-extras__muted">{t('rooms.drawer.extrasError')}</p>;
  }

  const { reservation, cleaning, maintenance } = data;
  const dash = '—';

  return (
    <>
      <section className="room-extras__section">
        <h3>{t('rooms.drawer.guestSection')}</h3>
        {reservation ? (
          <div className="room-extras__grid">
            <InfoTile label={t('rooms.drawer.guest')} value={reservation.guestName ?? dash} />
            <InfoTile label={t('rooms.drawer.guestPhone')} value={reservation.guestPhone ?? dash} ltr />
            <InfoTile label={t('rooms.drawer.guestIdNumber')} value={reservation.guestIdNumber ?? dash} ltr />
            <InfoTile label={t('rooms.drawer.arrival')} value={formatDate(reservation.checkIn, language)} />
            <InfoTile label={t('rooms.drawer.departure')} value={formatDate(reservation.checkOut, language)} />
          </div>
        ) : (
          <p className="room-extras__muted">{t('rooms.drawer.noGuest')}</p>
        )}
      </section>

      <section className="room-extras__section">
        <h3>{t('rooms.drawer.paymentsSection')}</h3>
        {reservation ? (
          <>
            <div className="room-extras__grid room-extras__grid--three">
              <InfoTile label={t('rooms.drawer.totalAmount')} value={formatCurrency(reservation.total, language)} />
              <InfoTile label={t('rooms.drawer.paidAmount')} value={formatCurrency(reservation.paid, language)} />
              <InfoTile label={t('rooms.drawer.remainingAmount')} value={formatCurrency(reservation.remaining, language)} />
            </div>
            {reservation.payments.length > 0 ? (
              <ul className="room-extras__list">
                {reservation.payments.map((payment) => (
                  <li key={payment.id}>
                    <div>
                      <strong>{t(`rooms.drawer.paymentMethod.${payment.method}`)}</strong>
                      <span>{formatDate(payment.paidAt, language)}</span>
                    </div>
                    <strong>{formatCurrency(payment.amount, language)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="room-extras__muted">{t('rooms.drawer.noPayments')}</p>
            )}
          </>
        ) : (
          <p className="room-extras__muted">{t('rooms.drawer.noPayments')}</p>
        )}
      </section>

      <section className="room-extras__section">
        <h3>{t('rooms.drawer.cleaningSection')}</h3>
        {cleaning.length > 0 ? (
          <ul className="room-extras__list">
            {cleaning.map((task) => (
              <li key={task.id}>
                <div>
                  <strong>{task.cleanerName ?? t('rooms.drawer.cleanerUnassigned')}</strong>
                  <span>
                    {t(`rooms.drawer.priority.${task.priority}`)} · {formatDate(task.assignedDate, language)}
                  </span>
                </div>
                <span className="room-extras__chip">{t(`rooms.drawer.cleaningStatus.${task.status}`)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="room-extras__muted">{t('rooms.drawer.noCleaning')}</p>
        )}
      </section>

      <section className="room-extras__section">
        <h3>{t('rooms.drawer.maintenanceSection')}</h3>
        {maintenance.length > 0 ? (
          <ul className="room-extras__list">
            {maintenance.map((issue) => (
              <li key={issue.id}>
                <div>
                  <strong>{issue.problem}</strong>
                  <span>
                    {t(`rooms.drawer.priority.${issue.priority}`)} · {formatDate(issue.createdDate, language)}
                  </span>
                </div>
                <span className="room-extras__chip">{t(`rooms.drawer.maintenanceStatus.${issue.status}`)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="room-extras__muted">{t('rooms.drawer.noMaintenance')}</p>
        )}
      </section>
    </>
  );
}