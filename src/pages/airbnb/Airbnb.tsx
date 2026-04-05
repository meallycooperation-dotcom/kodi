import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuth from '../../hooks/useAuth';
import {
  insertAirbnbListing,
  fetchAirbnbListingsByCreator
} from '../../services/airbnbService';
import {
  insertAirbnbTenant,
  fetchAirbnbTenantsByListing,
  fetchAirbnbTenantsByListingIds,
  updateAirbnbTenantDates
} from '../../services/airbnbTenantService';
import type { AirbnbListing, AirbnbStatus } from '../../types/airbnb';
import type { AirbnbTenant, AirbnbTenantStatus } from '../../types/airbnbTenant';
import Modal from '../../components/ui/Modal';
import { fetchSubscriptionForUser, type SubscriptionRow } from '../../services/subscriptionService';
import { useCurrency } from '../../context/currency';

// Title map for plan names (shared with Properties page)
const planTitleMapAirbnb: Record<'basic' | 'standard' | 'premium', string> = {
  basic: 'Basic Plan',
  standard: 'Standard Plan',
  premium: 'Premium Plan'
};

const statusOptions: AirbnbStatus[] = ['available', 'occupied', 'maintenance'];
const tenantStatusOptions: AirbnbTenantStatus[] = ['booked', 'checked_in', 'checked_out', 'cancelled'];

type FormState = {
  unitName: string;
  location: string;
  pricePerNight: string;
  status: AirbnbStatus;
  roomNumbers: string;
};

const initialFormState: FormState = {
  unitName: '',
  location: '',
  pricePerNight: '',
  status: 'available',
  roomNumbers: ''
};

type TenantFormState = {
  fullName: string;
  phone: string;
  email: string;
  checkInAt: string;
  checkOutAt: string;
  totalAmount: string;
  status: AirbnbTenantStatus;
};

const initialTenantFormState: TenantFormState = {
  fullName: '',
  phone: '',
  email: '',
  checkInAt: '',
  checkOutAt: '',
  totalAmount: '',
  status: 'booked'
};

const parseRoomNumbersValue = (value?: string): string[] => {
  const raw = value?.trim() ?? '';
  if (!raw) {
    return ['Room 1'];
  }

  const byComma = raw
    .split(',')
    .map((room) => room.trim())
    .filter((room): room is string => room.length > 0);

  if (byComma.length > 1) {
    return byComma;
  }

  if (/^\d+$/.test(raw)) {
    const count = Number(raw);
    if (count <= 0) {
      return ['Room 1'];
    }
    return Array.from({ length: count }, (_, index) => `${index + 1}`);
  }

  return byComma.length === 1 ? byComma : ['Room 1'];
};

const Airbnb = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<AirbnbListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
    []
  );
  const { formatCurrency } = useCurrency();
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [tenantForm, setTenantForm] = useState<TenantFormState>(initialTenantFormState);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [tenantStatusMessage, setTenantStatusMessage] = useState<string | null>(null);
  const [listingTenants, setListingTenants] = useState<AirbnbTenant[]>([]);
  const [loadingListingTenants, setLoadingListingTenants] = useState(false);
  const [listingTenantError, setListingTenantError] = useState<string | null>(null);
  const [allTenants, setAllTenants] = useState<AirbnbTenant[]>([]);
  const [loadingAllTenants, setLoadingAllTenants] = useState(false);
  const [tenantModal, setTenantModal] = useState<AirbnbTenant | null>(null);
  const [tenantModalLoading, setTenantModalLoading] = useState(false);
  const [tenantModalForm, setTenantModalForm] = useState({
    checkInAt: '',
    checkOutAt: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [limitPopupOpen, setLimitPopupOpen] = useState(false);

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const loadAggregatedTenants = useCallback(async (listingIds: string[]) => {
    const ids = listingIds.filter(Boolean);
    if (ids.length === 0) {
      setAllTenants([]);
      return;
    }

    setLoadingAllTenants(true);

    try {
      const aggregated = await fetchAirbnbTenantsByListingIds(ids);
      setAllTenants(aggregated);
    } catch (error) {
      console.error('loadAggregatedTenants', error);
    } finally {
      setLoadingAllTenants(false);
    }
  }, []);

  const loadListings = useCallback(async () => {
    if (!user) {
      setListings([]);
      return;
    }

    setLoadingListings(true);
    try {
      const fetchedListings = await fetchAirbnbListingsByCreator(user.id);
      setListings(fetchedListings);
      await loadAggregatedTenants(fetchedListings.map((listing) => listing.id));
    } catch (error) {
      console.error('Airbnb listing load failed', error);
    } finally {
      setLoadingListings(false);
    }
  }, [user, loadAggregatedTenants]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Load subscription status for the current user to enforce per-plan limits
  useEffect(() => {
    if (!user?.id) {
      setSubscription(null);
      return;
    }
    setSubscriptionError(null);
    setSubscriptionLoading(true);
    fetchSubscriptionForUser(user.id)
      .then((data) => setSubscription(data ?? null))
      .catch(() => setSubscriptionError('Unable to load your subscription status.'))
      .finally(() => setSubscriptionLoading(false));
  }, [user?.id]);

  const loadListingTenants = useCallback(async (listingId?: string) => {
    if (!listingId) {
      setListingTenants([]);
      return;
    }

    setLoadingListingTenants(true);
    setListingTenantError(null);

    try {
      const fetchedTenants = await fetchAirbnbTenantsByListing(listingId);
      setListingTenants(fetchedTenants);
    } catch (error) {
      console.error('loadListingTenants', error);
      setListingTenantError('Unable to load listing tenants.');
    } finally {
      setLoadingListingTenants(false);
    }
  }, []);

  useEffect(() => {
    loadListingTenants(selectedListingId ?? undefined);
  }, [selectedListingId, loadListingTenants]);

  const closeTenantModal = () => {
    setTenantModal(null);
  };

  useEffect(() => {
    if (!tenantModal) {
      setTenantModalForm({ checkInAt: '', checkOutAt: '' });
      return;
    }

    setTenantModalForm({
      checkInAt: tenantModal.checkInAt,
      checkOutAt: tenantModal.checkOutAt
    });
  }, [tenantModal]);

  const toggleListingSelection = (listingId: string) => {
    setSelectedListingId((prev) => (prev === listingId ? null : listingId));
    setSelectedRoom(null);
    setTenantStatusMessage(null);
    setTenantModal(null);
  };

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) ?? null,
    [listings, selectedListingId]
  );

  const roomNumbers = useMemo(() => {
    if (!selectedListing) {
      return [];
    }

    const value = selectedListing.roomNumbers?.trim() ?? '';
    if (!value) {
      return ['Room 1'];
    }

    const byComma = value
      .split(',')
      .map((room) => room.trim())
      .filter((room): room is string => room.length > 0);

    if (byComma.length > 1) {
      return byComma;
    }

    if (/^\d+$/.test(value)) {
      const count = Number(value);
      if (count <= 0) return ['Room 1'];
      return Array.from({ length: count }, (_, index) => `${index + 1}`);
    }

    return byComma.length === 1 ? byComma : ['Room 1'];
  }, [selectedListing]);

  const isBookingActive = useCallback((tenant: AirbnbTenant) => {
    if (tenant.status === 'checked_out' || tenant.status === 'cancelled') {
      return false;
    }

    const checkout = new Date(tenant.checkOutAt);
    return checkout.getTime() >= Date.now();
  }, []);

  const bookedRoomNumbers = useMemo(() => {
    return new Set(
      listingTenants
        .filter(isBookingActive)
        .map((tenant) => tenant.roomNumber)
        .filter((room): room is string => typeof room === 'string' && room.trim().length > 0)
    );
  }, [listingTenants, isBookingActive]);

  const totalListings = listings.length;
  const planLimitReachedAirbnbs = Boolean(
    subscription && subscription.max_airbnbs > 0 && listings.length >= subscription.max_airbnbs
  );
  const totalRooms = useMemo(
    () => listings.reduce((sum, listing) => sum + parseRoomNumbersValue(listing.roomNumbers).length, 0),
    [listings]
  );

  // Plan & remaining listings panel for better UX
  // Renders a small panel showing current plan and remaining Airbnb listings for the user
  const planPanel = (
    <Card>
      {subscriptionLoading ? (
        <p className="text-sm text-gray-600">Loading plan details…</p>
      ) : subscription ? (
        <p className="text-sm text-gray-600">
          Current plan: <strong>{planTitleMapAirbnb[subscription.plan_name]}</strong> &ndash; {listings.length}/
          {subscription.max_airbnbs} listings used
          {subscription.max_airbnbs - listings.length > 0 ? (
            <span> &ndash; {subscription.max_airbnbs - listings.length} remaining</span>
          ) : (
            <span> &ndash; Limit reached</span>
          )}
        </p>
      ) : null}
    </Card>
  );

  const aggregatedBookedRoomKeys = useMemo(() => {
    return new Set(
      allTenants
        .filter(isBookingActive)
        .map((tenant) => {
          if (!tenant.roomNumber) {
            return null;
          }

          return `${tenant.airbnbId}:${tenant.roomNumber.trim()}`;
        })
        .filter((key): key is string => key !== null)
    );
  }, [allTenants, isBookingActive]);

  const bookedRoomsCount = aggregatedBookedRoomKeys.size;
  const availableRoomsCount = Math.max(0, totalRooms - bookedRoomsCount);
  const totalEarnings = useMemo(
    () => allTenants.reduce((sum, tenant) => sum + (tenant.totalAmount || 0), 0),
    [allTenants]
  );
  const summaryHighlights = useMemo(() => {
    const formatValue = (value: number) => (value === 0 ? '0' : value.toString());
    return [
      {
        label: 'Airbnb listings',
        value: loadingListings ? 'Loading...' : formatValue(totalListings)
      },
      {
        label: 'Rooms booked',
        value: loadingAllTenants ? 'Loading...' : formatValue(bookedRoomsCount)
      },
      {
        label: 'Rooms available',
        value: loadingAllTenants ? 'Loading...' : formatValue(availableRoomsCount)
      },
      {
        label: 'Total earnings',
        value: loadingAllTenants ? 'Loading...' : formatCurrency(totalEarnings)
      }
    ];
  }, [totalListings, bookedRoomsCount, availableRoomsCount, totalEarnings, loadingListings, loadingAllTenants, formatCurrency]);

  const handleRoomClick = (roomNumber: string) => {
    const isBooked = bookedRoomNumbers.has(roomNumber);
    if (isBooked) {
      const tenant = listingTenants.find(
        (record) => record.roomNumber?.trim() === roomNumber
      );
      setTenantModal(tenant ?? null);
      setSelectedRoom(null);
      setTenantStatusMessage(null);
      return;
    }

    setTenantModal(null);
    setSelectedRoom(roomNumber);
    setTenantStatusMessage(null);
  };

  const handleTenantChange = <K extends keyof TenantFormState>(field: K, value: TenantFormState[K]) => {
    setTenantForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTenantModalChange = (field: keyof typeof tenantModalForm, value: string) => {
    setTenantModalForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTenantSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !selectedListing || !selectedRoom) {
      setTenantStatusMessage('Select a room before adding a guest.');
      return;
    }

    if (!tenantForm.fullName.trim() || !tenantForm.checkInAt || !tenantForm.checkOutAt) {
      setTenantStatusMessage('Guest name and booking dates are required.');
      return;
    }

    setTenantLoading(true);
    setTenantStatusMessage(null);

    try {
      await insertAirbnbTenant({
        userId: user.id,
        airbnbId: selectedListing.id,
        fullName: tenantForm.fullName.trim(),
        phone: tenantForm.phone.trim() || undefined,
        email: tenantForm.email.trim() || undefined,
        checkInAt: tenantForm.checkInAt,
        checkOutAt: tenantForm.checkOutAt,
        totalAmount: tenantForm.totalAmount ? Number(tenantForm.totalAmount) : undefined,
        status: tenantForm.status,
        roomNumber: selectedRoom
      });
      setTenantStatusMessage(`Guest added for ${selectedRoom}.`);
      setTenantForm(initialTenantFormState);
      setSelectedRoom(null);
      await loadListingTenants(selectedListing.id);
      await loadAggregatedTenants(listings.map((listing) => listing.id));
    } catch (error) {
      console.error('Airbnb tenant add failed', error);
      setTenantStatusMessage('Unable to assign guest right now.');
    } finally {
      setTenantLoading(false);
    }
  };

  const handleTenantModalUpdate = async () => {
    if (!tenantModal) {
      return;
    }

    if (!tenantModalForm.checkInAt || !tenantModalForm.checkOutAt) {
      return;
    }

    setTenantModalLoading(true);
    try {
      const updatedTenant = await updateAirbnbTenantDates(tenantModal.id, {
        checkInAt: tenantModalForm.checkInAt,
        checkOutAt: tenantModalForm.checkOutAt
      });
      setTenantModal(updatedTenant);
      await loadListingTenants(selectedListingId ?? undefined);
      await loadAggregatedTenants(listings.map((listing) => listing.id));
    } finally {
      setTenantModalLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setStatusMessage('Sign in to register Airbnb listings.');
      return;
    }

    // Ensure user has a subscription before allowing creation
    if (!subscription) {
      setStatusMessage('Please pick a plan before registering Airbnb listings.');
      return;
    }
    // Enforce per-plan limit for Airbnb listings
    if (planLimitReachedAirbnbs) {
      setStatusMessage(
        `Your ${planTitleMapAirbnb[subscription.plan_name]} allows ${subscription.max_airbnbs} listings. Upgrade to add more.`
      );
      return;
    }

    const parsedPrice = Number(form.pricePerNight);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setStatusMessage('Provide a valid nightly price.');
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      await insertAirbnbListing({
        unitName: form.unitName.trim(),
        location: form.location.trim() || undefined,
        roomNumbers: form.roomNumbers.trim() || undefined,
        pricePerNight: parsedPrice,
        status: form.status,
        userId: user.id
      });
      setStatusMessage('Listing created.');
      setForm(initialFormState);
      await loadListings();
    } catch (error) {
      console.error('Airbnb form submission', error);
      setStatusMessage('Unable to create the listing right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      

      <div className="grid gap-4 md:grid-cols-4 hover:cursor-pointer">
        {summaryHighlights.map((item) => (
          <Card key={item.label} className="min-h-[100px]">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-2xl font-semibold">{item.value}</p>
          </Card>
        ))}
      </div>
      {planPanel}

      {limitPopupOpen && (
        <Modal title="Airbnb listing limit reached">
          <p className="text-sm text-gray-600">
            You have reached the maximum Airbnb listings for your current plan.
          </p>
          {subscription && (
            <p className="text-sm text-gray-600 mt-2">
              Current plan: <strong>{planTitleMapAirbnb[subscription.plan_name]}</strong> • Limit: {subscription.max_airbnbs}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setLimitPopupOpen(false)}>Close</Button>
          </div>
        </Modal>
      )}

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Add a new Airbnb listings</h2>
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              if (planLimitReachedAirbnbs) {
                setLimitPopupOpen(true);
              } else {
                setShowForm((prev) => !prev);
              }
            }}
          >
            {showForm ? 'Hide form' : 'Add listing'}
          </Button>
        </div>
        {showForm && (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <Input
              label="Unit name"
              name="unitName"
              value={form.unitName}
              onChange={(event) => handleChange('unitName', event.target.value)}
              required
            />
            <Input
              label="Location"
              name="location"
              value={form.location}
              onChange={(event) => handleChange('location', event.target.value)}
            />
            <Input
              label="Room numbers"
              name="roomNumbers"
              value={form.roomNumbers}
              onChange={(event) => handleChange('roomNumbers', event.target.value)}
              placeholder="e.g. 101, 102"
            />
            <Input
              label="Price per night"
              name="pricePerNight"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.pricePerNight}
              onChange={(event) => handleChange('pricePerNight', event.target.value)}
              required
            />
            <label className="input-field">
              <span>Status</span>
              <select value={form.status} onChange={(event) => handleChange('status', event.target.value as AirbnbStatus)}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <div className="md:col-span-2 flex justify-end gap-2">
            <Button
              type="submit"
              disabled={loading || !!planLimitReachedAirbnbs || !subscription}
            >
                {loading ? 'Saving...' : 'Create listing'}
            </Button>
            </div>
            {statusMessage && (
              <p className="md:col-span-2 text-sm text-gray-600" role="status">
                {statusMessage}
              </p>
            )}
          </form>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-lg mb-3">My Airbnb listings</h2>
        {loadingListings ? (
          <p className="text-sm text-gray-600">Loading listings...</p>
        ) : listings.length === 0 ? (
          <p className="text-sm text-gray-600">You have not created any listings yet.</p>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => {
              const isSelected = selectedListingId === listing.id;
              return (
                <article
                  key={listing.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  className={`p-3 border rounded-lg shadow-sm bg-white cursor-pointer focus:outline-none focus:ring focus:ring-blue-200 ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => toggleListingSelection(listing.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleListingSelection(listing.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong>{listing.unitName}</strong>
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      {listing.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{listing.location ?? 'Location not set'}</p>
                  <p className="text-sm text-gray-600">
                    Rooms: {listing.roomNumbers ?? 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(listing.pricePerNight)} per night
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </Card>

      {selectedListing && (
        <Card>
          <h2 className="font-semibold text-lg mb-3">Rooms for {selectedListing.unitName}</h2>
        {loadingListingTenants && (
          <p className="text-sm text-gray-500 mb-2">Loading existing tenants…</p>
        )}
        {listingTenantError && (
          <p className="text-sm text-red-500 mb-2">{listingTenantError}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 hover:cursor-pointer">
            {roomNumbers.map((room) => {
              const isBooked = bookedRoomNumbers.has(room);
              const bookingClass = isBooked
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-red-500 bg-red-50 text-red-700';
              const selectionClass = selectedRoom === room ? 'ring-2 ring-blue-500' : '';

              return (
                <button
                  key={room}
                  type="button"
                  onClick={() => handleRoomClick(room)}
                  className={`p-3 border rounded-lg text-left text-sm font-medium focus:outline-none focus:ring focus:ring-blue-200 ${bookingClass} ${selectionClass}`}
                >
                  <span className="block text-xs uppercase tracking-wide text-gray-500">Room</span>
                  <span className="text-lg">{room}</span>
                  <span className="text-[10px] uppercase tracking-wide">
                    {isBooked ? 'Booked' : 'Available'}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedRoom && (
            <Modal title={`Assign guest to ${selectedRoom}`}>
              <p className="text-sm text-gray-600 mb-2">
                Provide the guest details and booking dates for <strong>{selectedRoom}</strong>.
              </p>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleTenantSubmit}>
                <Input
                  label="Guest name"
                  name="fullName"
                  value={tenantForm.fullName}
                  onChange={(event) => handleTenantChange('fullName', event.target.value)}
                  required
                />
                <Input
                  label="Phone"
                  name="phone"
                  value={tenantForm.phone}
                  onChange={(event) => handleTenantChange('phone', event.target.value)}
                />
                <Input
                  label="Email (optional)"
                  name="email"
                  type="email"
                  value={tenantForm.email}
                  onChange={(event) => handleTenantChange('email', event.target.value)}
                />
                <Input
                  label="Check-in"
                  name="checkInAt"
                  type="datetime-local"
                  value={tenantForm.checkInAt}
                  onChange={(event) => handleTenantChange('checkInAt', event.target.value)}
                  required
                />
                <Input
                  label="Check-out"
                  name="checkOutAt"
                  type="datetime-local"
                  value={tenantForm.checkOutAt}
                  onChange={(event) => handleTenantChange('checkOutAt', event.target.value)}
                  required
                />
                <Input
                  label="Total amount"
                  name="totalAmount"
                  type="number"
                  step="0.01"
                  value={tenantForm.totalAmount}
                  onChange={(event) => handleTenantChange('totalAmount', event.target.value)}
                />
                <label className="input-field md:col-span-2">
                  <span>Status</span>
                  <select
                    value={tenantForm.status}
                    onChange={(event) => handleTenantChange('status', event.target.value as AirbnbTenantStatus)}
                  >
                    {tenantStatusOptions.map((status) => (
                      <option value={status} key={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button type="submit" disabled={tenantLoading}>
                    {tenantLoading ? 'Saving...' : 'Assign guest'}
                  </Button>
                  <Button variant="ghost" type="button" onClick={() => setSelectedRoom(null)}>
                    Cancel
                  </Button>
                </div>
                {tenantStatusMessage && (
                  <p className="md:col-span-2 text-sm text-gray-600">{tenantStatusMessage}</p>
                )}
              </form>
            </Modal>
          )}
        </Card>
      )}

      {tenantModal && (
      <Modal title={`Tenant in ${tenantModal.roomNumber ?? 'room'}`}>
        <p className="text-sm text-gray-600">
          <strong>Name:</strong> {tenantModal.fullName}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Phone:</strong> {tenantModal.phone ?? 'Not provided'}
        </p>
          <div className="grid gap-3 md:grid-cols-2 mt-2">
            <Input
              label="Check-in"
              type="datetime-local"
              value={tenantModalForm.checkInAt}
              onChange={(event) => handleTenantModalChange('checkInAt', event.target.value)}
            />
            <Input
              label="Check-out"
              type="datetime-local"
              value={tenantModalForm.checkOutAt}
              onChange={(event) => handleTenantModalChange('checkOutAt', event.target.value)}
            />
          </div>
        <p className="text-sm text-gray-500 mt-2">
          Current booking ends: {dateFormatter.format(new Date(tenantModal.checkOutAt))}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" disabled={tenantModalLoading} onClick={handleTenantModalUpdate}>
            {tenantModalLoading ? 'Saving...' : 'Update dates'}
          </Button>
          <Button variant="ghost" type="button" onClick={closeTenantModal}>
            Close
          </Button>
        </div>
      </Modal>
      )}

      
    </section>
  );
};

export default Airbnb;
