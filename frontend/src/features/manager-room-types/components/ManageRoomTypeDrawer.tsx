import { useId, useMemo, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import {
  Bed,
  Check,
  Edit2,
  ExternalLink,
  Plus,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { useToast } from '../../../components/ui/ToastContext';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatCurrency, formatNumber, formatPercent } from '../../../utils/format';
import {
  AMENITIES_MAX,
  AMENITY_MAX_LENGTH,
  CAPACITY_MAX,
  DESCRIPTION_MAX_LENGTH,
  PRICE_MAX,
  ROOM_TYPES_I18N,
} from '../constants/roomTypes.constants';
import {
  useAllHotelRooms,
  useAssignRoomToTypeMutation,
  useRoomsForType,
  useUpdateRoomPriceMutation,
} from '../hooks/useRoomTypes';
import {
  parseWholeNumber,
  validateAmenities,
  validateCapacity,
  validateDescription,
  validateNewAmenity,
  validatePrice,
} from '../schemas/roomType.schema';
import type { RoomType, RoomTypeUpdate } from '../types/roomType.types';
import { amenityLabel, formatPriceRange, formatThousands, typeName } from '../utils/roomTypeDisplay';
import { RoomTypeField } from './RoomTypeField';
import { RoomTypeStat } from './RoomTypeStat';
import './RoomTypeDrawers.css';

const FORM_ID = 'manager-room-type-manage-form';

interface ManageRoomTypeDrawerProps {
  roomType: RoomType;
  isSaving: boolean;
  onClose: () => void;
  /** Only the fields that changed */
  onSave: (body: RoomTypeUpdate) => void;
}

type FieldErrors = Partial<Record<'basePrice' | 'capacity' | 'description' | 'amenities', string>>;
type RoomsFilter = 'all' | 'available' | 'occupied' | 'other';

// "عرض وإدارة النوع" / gear button:
// 1. Manage type settings (base price, capacity, description, amenities).
// 2. View and manage rooms belonging to this type (view rooms, filter, edit individual room prices, reassign).
export function ManageRoomTypeDrawer({ roomType, isSaving, onClose, onSave }: ManageRoomTypeDrawerProps) {
  const { language, t: translate } = useLanguage();
  const t = (key: string) => translate(`${ROOM_TYPES_I18N}.${key}`);
  const toast = useToast();
  const baseId = useId();

  // Active drawer tab: 'rooms' or 'settings'
  const [activeTab, setActiveTab] = useState<'rooms' | 'settings'>('rooms');

  // Type Settings Form State
  const [basePrice, setBasePrice] = useState(String(roomType.base_price));
  const [capacity, setCapacity] = useState(String(roomType.capacity));
  const [description, setDescription] = useState(roomType.description);
  const [amenities, setAmenities] = useState<string[]>(roomType.amenities);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Rooms Management State
  const roomTypeId = roomType.room_type_id || roomType.id || '';
  const roomsQuery = useRoomsForType(roomTypeId);
  const allRoomsQuery = useAllHotelRooms();
  const updateRoomPriceMutation = useUpdateRoomPriceMutation();
  const assignRoomMutation = useAssignRoomToTypeMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [roomsFilter, setRoomsFilter] = useState<RoomsFilter>('all');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [selectedAssignRoomId, setSelectedAssignRoomId] = useState<string>('');

  const rooms = roomsQuery.data ?? [];
  const allRooms = allRoomsQuery.data ?? [];

  // Rooms available to be assigned to this category (belonging to other categories)
  const assignableRooms = useMemo(() => {
    const currentRoomIds = new Set(rooms.map((r) => r.id));
    return allRooms.filter((r) => !currentRoomIds.has(r.id));
  }, [allRooms, rooms]);

  // Counts for filter pills
  const availableCount = rooms.filter((r) => r.status === 'available').length;
  const occupiedCount = rooms.filter((r) => r.status === 'occupied' || r.status === 'reserved').length;
  const otherCount = rooms.filter((r) => r.status === 'cleaning' || r.status === 'maintenance').length;

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // Status filter
      if (roomsFilter === 'available' && r.status !== 'available') return false;
      if (roomsFilter === 'occupied' && r.status !== 'occupied' && r.status !== 'reserved') return false;
      if (roomsFilter === 'other' && r.status !== 'cleaning' && r.status !== 'maintenance') return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesNumber = r.number.toLowerCase().includes(q);
        const matchesGuest = r.guestName ? r.guestName.toLowerCase().includes(q) : false;
        return matchesNumber || matchesGuest;
      }
      return true;
    });
  }, [rooms, roomsFilter, searchQuery]);

  // Settings form diff
  const labels = amenities.map((amenity) => amenityLabel(amenity, t));
  const body: RoomTypeUpdate = {
    ...(parseWholeNumber(basePrice) !== roomType.base_price ? { base_price: parseWholeNumber(basePrice) } : {}),
    ...(parseWholeNumber(capacity) !== roomType.capacity ? { capacity: parseWholeNumber(capacity) } : {}),
    ...(description.trim() !== roomType.description ? { description: description.trim() } : {}),
    ...(amenities.join('|') !== roomType.amenities.join('|') ? { amenities } : {}),
  };
  const changed = Object.keys(body).length > 0;

  const message = (key: string | undefined | null, max?: number) =>
    key ? t(`errors.${key}`).replace('{max}', formatNumber(max ?? 0, language)) : undefined;

  const addAmenity = () => {
    const error = validateNewAmenity(draft, labels);
    setDraftError(error);
    if (error) {
      document.getElementById(`${baseId}-amenity`)?.focus();
      return;
    }
    setAmenities([...amenities, draft.trim().replace(/\s+/g, ' ')]);
    setDraft('');
    setErrors((current) => ({ ...current, amenities: undefined }));
  };

  const onDraftKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addAmenity();
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    const nextErrors: FieldErrors = {
      basePrice: validatePrice(basePrice) ?? undefined,
      capacity: validateCapacity(capacity) ?? undefined,
      description: validateDescription(description) ?? undefined,
      amenities: validateAmenities(amenities) ?? undefined,
    };
    setErrors(nextErrors);
    const first = (['basePrice', 'capacity', 'description'] as const).find((field) => nextErrors[field]);
    if (first) {
      setActiveTab('settings');
      setTimeout(() => {
        document.getElementById(`${baseId}-${first}`)?.focus();
      }, 50);
      return;
    }
    if (nextErrors.amenities) {
      setActiveTab('settings');
      return;
    }
    onSave(body);
  };

  // Quick save room price
  const handleSaveRoomPrice = async (roomId: string, roomNumber: string) => {
    const parsed = parseInt(editingPrice, 10);
    if (isNaN(parsed) || parsed <= 0) {
      toast.notify(t('errors.pricePositive'), 'warning');
      return;
    }
    try {
      await updateRoomPriceMutation.mutateAsync({ roomId, price: parsed });
      setEditingRoomId(null);
      setEditingPrice('');
      toast.notify(
        t('toastRoomPriceSaved')
          .replace('{number}', roomNumber)
          .replace('{price}', formatNumber(parsed, language)),
        'success'
      );
    } catch {
      toast.notify(t('toastRoomPriceError'), 'error');
    }
  };

  // Quick assign room to this category
  const handleAssignRoom = async () => {
    if (!selectedAssignRoomId) return;
    const targetRoom = assignableRooms.find((r) => r.id === selectedAssignRoomId);
    try {
      await assignRoomMutation.mutateAsync({
        roomId: selectedAssignRoomId,
        roomTypeId,
      });
      setSelectedAssignRoomId('');
      toast.notify(
        t('toastRoomAssigned')
          .replace('{number}', targetRoom?.number ?? '')
          .replace('{type}', typeName(roomType, t)),
        'success'
      );
    } catch {
      toast.notify(t('toastRoomAssignError'), 'error');
    }
  };

  const getStatusLabel = (status: string) => {
    const key = `roomStatus.${status}`;
    const tr = t(key);
    return tr === `${ROOM_TYPES_I18N}.${key}` ? status : tr;
  };

  return (
    <Drawer
      open
      eyebrow={t('manageEyebrow')}
      title={typeName(roomType, t)}
      closeLabel={t('close')}
      onClose={onClose}
      className="room-type-drawer"
      footer={
        <div className="room-type-drawer__footer">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={isSaving || !changed}
            onClick={() => {
              if (activeTab !== 'settings') setActiveTab('settings');
            }}
          >
            {isSaving ? t('saving') : t('saveType')}
          </Button>
        </div>
      }
    >
      <div className="room-type-form">
        {/* KPI Stats */}
        <div className="room-type-form__stats">
          <RoomTypeStat label={t('occupancy')}>
            {formatPercent(roomType.occupancy_rate_pct, language)}
          </RoomTypeStat>
          <RoomTypeStat label={t('monthlyRevenue')}>
            {formatThousands(roomType.revenue_month_to_date, language, t)}
          </RoomTypeStat>
          <RoomTypeStat label={t('roomsCount')}>
            {formatNumber(rooms.length > 0 ? rooms.length : roomType.rooms_count, language)}
          </RoomTypeStat>
        </div>

        {/* Tab Switcher */}
        <div className="room-type-drawer__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'rooms'}
            className={`room-type-drawer__tab ${
              activeTab === 'rooms' ? 'room-type-drawer__tab--active' : ''
            }`}
            onClick={() => setActiveTab('rooms')}
          >
            <Bed aria-hidden="true" size={16} />
            {t('tabRooms').replace(
              '{count}',
              formatNumber(rooms.length > 0 ? rooms.length : roomType.rooms_count, language)
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'settings'}
            className={`room-type-drawer__tab ${
              activeTab === 'settings' ? 'room-type-drawer__tab--active' : ''
            }`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings aria-hidden="true" size={16} />
            {t('tabSettings')}
            {changed && <span className="room-type-form__dot-badge" aria-label="modifications" />}
          </button>
        </div>

        {/* Tab 1: Rooms of this Category */}
        {activeTab === 'rooms' && (
          <div className="room-type-rooms">
            <div className="room-type-rooms__toolbar">
              {/* Search */}
              <div className="room-type-rooms__search">
                <Search aria-hidden="true" />
                <input
                  type="text"
                  placeholder={t('searchRoomsPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="room-type-rooms__filters">
                <button
                  type="button"
                  className={`room-type-rooms__filter-btn ${
                    roomsFilter === 'all' ? 'room-type-rooms__filter-btn--active' : ''
                  }`}
                  onClick={() => setRoomsFilter('all')}
                >
                  {t('filterAll').replace('{count}', formatNumber(rooms.length, language))}
                </button>
                <button
                  type="button"
                  className={`room-type-rooms__filter-btn ${
                    roomsFilter === 'available' ? 'room-type-rooms__filter-btn--active' : ''
                  }`}
                  onClick={() => setRoomsFilter('available')}
                >
                  {t('filterAvailable').replace('{count}', formatNumber(availableCount, language))}
                </button>
                <button
                  type="button"
                  className={`room-type-rooms__filter-btn ${
                    roomsFilter === 'occupied' ? 'room-type-rooms__filter-btn--active' : ''
                  }`}
                  onClick={() => setRoomsFilter('occupied')}
                >
                  {t('filterOccupied').replace('{count}', formatNumber(occupiedCount, language))}
                </button>
                {otherCount > 0 && (
                  <button
                    type="button"
                    className={`room-type-rooms__filter-btn ${
                      roomsFilter === 'other' ? 'room-type-rooms__filter-btn--active' : ''
                    }`}
                    onClick={() => setRoomsFilter('other')}
                  >
                    {t('filterOther').replace('{count}', formatNumber(otherCount, language))}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Assign Room To This Category */}
            {assignableRooms.length > 0 && (
              <div className="room-type-rooms__assign-card">
                <h4>{t('assignRoomLabel')}</h4>
                <div className="room-type-rooms__assign-row">
                  <select
                    value={selectedAssignRoomId}
                    onChange={(e) => setSelectedAssignRoomId(e.target.value)}
                    disabled={assignRoomMutation.isPending}
                  >
                    <option value="">{t('selectRoomPlaceholder')}</option>
                    {assignableRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {t('roomCardNumber').replace('{number}', room.number)} (
                        {t('roomFloor').replace('{floor}', String(room.floor))}) -{' '}
                        {formatCurrency(room.price, language)}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    disabled={!selectedAssignRoomId || assignRoomMutation.isPending}
                    onClick={() => {
                      void handleAssignRoom();
                    }}
                  >
                    <Plus aria-hidden="true" size={14} />
                    {t('assignRoomBtn')}
                  </Button>
                </div>
              </div>
            )}

            {/* Rooms List */}
            {roomsQuery.isLoading ? (
              <p className="room-type-form__hint">{t('loading')}</p>
            ) : filteredRooms.length === 0 ? (
              <div className="room-type-rooms__empty">
                <p>
                  {searchQuery || roomsFilter !== 'all' ? t('noRoomsFound') : t('noRoomsAssigned')}
                </p>
              </div>
            ) : (
              <div className="room-type-rooms__list">
                {filteredRooms.map((room) => (
                  <div key={room.id} className="room-type-room-card">
                    <div className="room-type-room-card__header">
                      <div className="room-type-room-card__title">
                        <Bed aria-hidden="true" />
                        <strong>{t('roomCardNumber').replace('{number}', room.number)}</strong>
                        <span className="room-type-room-card__floor">
                          {t('roomFloor').replace('{floor}', String(room.floor))}
                        </span>
                      </div>
                      <div className="room-type-room-card__badges">
                        <span
                          className={`room-type-room-card__status room-type-room-card__status--${room.status}`}
                        >
                          {getStatusLabel(room.status)}
                        </span>
                      </div>
                    </div>

                    <div className="room-type-room-card__meta">
                      <div className="room-type-room-card__price-wrap">
                        {editingRoomId === room.id ? (
                          <div className="room-type-room-card__price-edit">
                            <input
                              type="number"
                              min={1}
                              value={editingPrice}
                              autoFocus
                              onChange={(e) => setEditingPrice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  void handleSaveRoomPrice(room.id, room.number);
                                }
                                if (e.key === 'Escape') {
                                  setEditingRoomId(null);
                                  setEditingPrice('');
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="room-type-room-card__icon-btn"
                              title={t('savePrice')}
                              disabled={updateRoomPriceMutation.isPending}
                              onClick={() => {
                                void handleSaveRoomPrice(room.id, room.number);
                              }}
                            >
                              <Check aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="room-type-room-card__icon-btn"
                              title={t('cancelEdit')}
                              onClick={() => {
                                setEditingRoomId(null);
                                setEditingPrice('');
                              }}
                            >
                              <X aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span>{t('roomPrice')}:</span>
                            <strong>{formatCurrency(room.price, language)}</strong>
                            <button
                              type="button"
                              className="room-type-room-card__icon-btn"
                              title={t('editPrice')}
                              onClick={() => {
                                setEditingRoomId(room.id);
                                setEditingPrice(String(room.price));
                              }}
                            >
                              <Edit2 aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>

                      <div className="room-type-room-card__actions">
                        <a
                          href={`/manager/rooms?floor=${room.floor}&id=${encodeURIComponent(
                            room.id
                          )}`}
                          className="room-type-room-card__link"
                          target="_blank"
                          rel="noreferrer"
                          title={t('viewInRooms')}
                        >
                          <span>{t('viewInRooms')}</span>
                          <ExternalLink aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Category Settings Form */}
        <form
          id={FORM_ID}
          onSubmit={handleSubmit}
          noValidate
          style={{ display: activeTab === 'settings' ? 'grid' : 'none', gap: 'var(--space-4)' }}
        >
          <section className="room-type-form__section">
            <h3>{t('pricingAndCapacity')}</h3>
            <div className="room-type-form__row">
              <RoomTypeField
                id={`${baseId}-basePrice`}
                label={t('basePrice')}
                value={basePrice}
                suffix={t('perNight')}
                inputMode="numeric"
                maxLength={7}
                disabled={isSaving}
                error={message(errors.basePrice, PRICE_MAX)}
                hint={t('currentRange').replace(
                  '{range}',
                  formatPriceRange(roomType.price_min, roomType.price_max, language)
                )}
                onChange={(value) => {
                  setBasePrice(value);
                  setErrors((current) => ({ ...current, basePrice: undefined }));
                }}
              />
              <RoomTypeField
                id={`${baseId}-capacity`}
                label={t('capacity')}
                value={capacity}
                suffix={t('guests')}
                inputMode="numeric"
                maxLength={2}
                disabled={isSaving}
                error={message(errors.capacity, CAPACITY_MAX)}
                onChange={(value) => {
                  setCapacity(value);
                  setErrors((current) => ({ ...current, capacity: undefined }));
                }}
              />
            </div>
            <label className="room-type-form__field" htmlFor={`${baseId}-description`}>
              <span>{t('descriptionLabel')}</span>
              <textarea
                id={`${baseId}-description`}
                rows={3}
                dir="auto"
                value={description}
                maxLength={DESCRIPTION_MAX_LENGTH + 20}
                disabled={isSaving}
                aria-invalid={errors.description ? true : undefined}
                className={errors.description ? 'room-type-form__control--error' : undefined}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setErrors((current) => ({ ...current, description: undefined }));
                }}
              />
              {errors.description && (
                <span className="room-type-form__error">
                  {message(errors.description, DESCRIPTION_MAX_LENGTH)}
                </span>
              )}
            </label>
          </section>

          <section className="room-type-form__section">
            <h3>{t('amenitiesLabel')}</h3>
            {amenities.length > 0 ? (
              <ul className="room-type-form__chips" aria-label={t('amenitiesLabel')}>
                {amenities.map((amenity) => (
                  <li key={amenity}>
                    <span dir="auto">{amenityLabel(amenity, t)}</span>
                    <button
                      type="button"
                      aria-label={t('removeAmenity').replace('{name}', amenityLabel(amenity, t))}
                      disabled={isSaving}
                      onClick={() => setAmenities(amenities.filter((item) => item !== amenity))}
                    >
                      <X aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="room-type-form__hint">{t('noAmenities')}</p>
            )}
            <div className="room-type-form__add">
              <RoomTypeField
                id={`${baseId}-amenity`}
                label={t('newAmenity')}
                value={draft}
                placeholder={t('newAmenityPlaceholder')}
                maxLength={AMENITY_MAX_LENGTH + 10}
                disabled={isSaving}
                error={message(
                  draftError,
                  draftError === 'amenitiesFull' ? AMENITIES_MAX : AMENITY_MAX_LENGTH
                )}
                onChange={(value) => {
                  setDraft(value);
                  if (draftError) setDraftError(null);
                }}
                onKeyDown={onDraftKeyDown}
              />
              <Button variant="secondary" onClick={addAmenity} disabled={isSaving}>
                <Plus aria-hidden="true" />
                {t('addAmenity')}
              </Button>
            </div>
            {errors.amenities && (
              <span className="room-type-form__error">{message(errors.amenities)}</span>
            )}
          </section>
        </form>
      </div>
    </Drawer>
  );
}
