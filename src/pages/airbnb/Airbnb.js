import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuth from '../../hooks/useAuth';
import { insertAirbnbListing, fetchAirbnbListingsByCreator } from '../../services/airbnbService';
import { insertAirbnbTenant, fetchAirbnbTenantsByListing, fetchAirbnbTenantsByListingIds, updateAirbnbTenantDates } from '../../services/airbnbTenantService';
import Modal from '../../components/ui/Modal';
const statusOptions = ['available', 'occupied', 'maintenance'];
const tenantStatusOptions = ['booked', 'checked_in', 'checked_out', 'cancelled'];
const initialFormState = {
    unitName: '',
    location: '',
    pricePerNight: '',
    status: 'available',
    roomNumbers: ''
};
const initialTenantFormState = {
    fullName: '',
    phone: '',
    email: '',
    checkInAt: '',
    checkOutAt: '',
    totalAmount: '',
    status: 'booked'
};
const parseRoomNumbersValue = (value) => {
    const raw = value?.trim() ?? '';
    if (!raw) {
        return ['Room 1'];
    }
    const byComma = raw
        .split(',')
        .map((room) => room.trim())
        .filter((room) => room.length > 0);
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
    const [form, setForm] = useState(initialFormState);
    const [statusMessage, setStatusMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [listings, setListings] = useState([]);
    const [loadingListings, setLoadingListings] = useState(false);
    const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
    }), []);
    const dateFormatter = useMemo(() => new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }), []);
    const [selectedListingId, setSelectedListingId] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [tenantForm, setTenantForm] = useState(initialTenantFormState);
    const [tenantLoading, setTenantLoading] = useState(false);
    const [tenantStatusMessage, setTenantStatusMessage] = useState(null);
    const [listingTenants, setListingTenants] = useState([]);
    const [loadingListingTenants, setLoadingListingTenants] = useState(false);
    const [listingTenantError, setListingTenantError] = useState(null);
    const [allTenants, setAllTenants] = useState([]);
    const [loadingAllTenants, setLoadingAllTenants] = useState(false);
    const [tenantModal, setTenantModal] = useState(null);
    const [tenantModalLoading, setTenantModalLoading] = useState(false);
    const [tenantModalForm, setTenantModalForm] = useState({
        checkInAt: '',
        checkOutAt: ''
    });
    const [showForm, setShowForm] = useState(false);
    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    const loadAggregatedTenants = useCallback(async (listingIds) => {
        const ids = listingIds.filter(Boolean);
        if (ids.length === 0) {
            setAllTenants([]);
            return;
        }
        setLoadingAllTenants(true);
        try {
            const aggregated = await fetchAirbnbTenantsByListingIds(ids);
            setAllTenants(aggregated);
        }
        catch (error) {
            console.error('loadAggregatedTenants', error);
        }
        finally {
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
        }
        catch (error) {
            console.error('Airbnb listing load failed', error);
        }
        finally {
            setLoadingListings(false);
        }
    }, [user, loadAggregatedTenants]);
    useEffect(() => {
        loadListings();
    }, [loadListings]);
    const loadListingTenants = useCallback(async (listingId) => {
        if (!listingId) {
            setListingTenants([]);
            return;
        }
        setLoadingListingTenants(true);
        setListingTenantError(null);
        try {
            const fetchedTenants = await fetchAirbnbTenantsByListing(listingId);
            setListingTenants(fetchedTenants);
        }
        catch (error) {
            console.error('loadListingTenants', error);
            setListingTenantError('Unable to load listing tenants.');
        }
        finally {
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
    const toggleListingSelection = (listingId) => {
        setSelectedListingId((prev) => (prev === listingId ? null : listingId));
        setSelectedRoom(null);
        setTenantStatusMessage(null);
        setTenantModal(null);
    };
    const selectedListing = useMemo(() => listings.find((listing) => listing.id === selectedListingId) ?? null, [listings, selectedListingId]);
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
            .filter((room) => room.length > 0);
        if (byComma.length > 1) {
            return byComma;
        }
        if (/^\d+$/.test(value)) {
            const count = Number(value);
            if (count <= 0)
                return ['Room 1'];
            return Array.from({ length: count }, (_, index) => `${index + 1}`);
        }
        return byComma.length === 1 ? byComma : ['Room 1'];
    }, [selectedListing]);
    const isBookingActive = useCallback((tenant) => {
        if (tenant.status === 'checked_out' || tenant.status === 'cancelled') {
            return false;
        }
        const checkout = new Date(tenant.checkOutAt);
        return checkout.getTime() >= Date.now();
    }, []);
    const bookedRoomNumbers = useMemo(() => {
        return new Set(listingTenants
            .filter(isBookingActive)
            .map((tenant) => tenant.roomNumber)
            .filter((room) => typeof room === 'string' && room.trim().length > 0));
    }, [listingTenants, isBookingActive]);
    const totalListings = listings.length;
    const totalRooms = useMemo(() => listings.reduce((sum, listing) => sum + parseRoomNumbersValue(listing.roomNumbers).length, 0), [listings]);
    const aggregatedBookedRoomKeys = useMemo(() => {
        return new Set(allTenants
            .filter(isBookingActive)
            .map((tenant) => {
            if (!tenant.roomNumber) {
                return null;
            }
            return `${tenant.airbnbId}:${tenant.roomNumber.trim()}`;
        })
            .filter((key) => key !== null));
    }, [allTenants, isBookingActive]);
    const bookedRoomsCount = aggregatedBookedRoomKeys.size;
    const availableRoomsCount = Math.max(0, totalRooms - bookedRoomsCount);
    const totalEarnings = useMemo(() => allTenants.reduce((sum, tenant) => sum + (tenant.totalAmount || 0), 0), [allTenants]);
    const summaryHighlights = useMemo(() => {
        const formatValue = (value) => (value === 0 ? '0' : value.toString());
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
                value: loadingAllTenants ? 'Loading...' : currencyFormatter.format(totalEarnings)
            }
        ];
    }, [totalListings, bookedRoomsCount, availableRoomsCount, totalEarnings, loadingListings, loadingAllTenants, currencyFormatter]);
    const handleRoomClick = (roomNumber) => {
        const isBooked = bookedRoomNumbers.has(roomNumber);
        if (isBooked) {
            const tenant = listingTenants.find((record) => record.roomNumber?.trim() === roomNumber);
            setTenantModal(tenant ?? null);
            setSelectedRoom(null);
            setTenantStatusMessage(null);
            return;
        }
        setTenantModal(null);
        setSelectedRoom(roomNumber);
        setTenantStatusMessage(null);
    };
    const handleTenantChange = (field, value) => {
        setTenantForm((prev) => ({ ...prev, [field]: value }));
    };
    const handleTenantModalChange = (field, value) => {
        setTenantModalForm((prev) => ({ ...prev, [field]: value }));
    };
    const handleTenantSubmit = async (event) => {
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
        }
        catch (error) {
            console.error('Airbnb tenant add failed', error);
            setTenantStatusMessage('Unable to assign guest right now.');
        }
        finally {
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
        }
        finally {
            setTenantModalLoading(false);
        }
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user) {
            setStatusMessage('Sign in to register Airbnb listings.');
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
        }
        catch (error) {
            console.error('Airbnb form submission', error);
            setStatusMessage('Unable to create the listing right now.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("section", { className: "space-y-6", children: [_jsx("div", { className: "grid gap-4 md:grid-cols-4 hover:cursor-pointer", children: summaryHighlights.map((item) => (_jsxs(Card, { className: "min-h-[100px]", children: [_jsx("p", { className: "text-sm text-gray-500", children: item.label }), _jsx("p", { className: "text-2xl font-semibold", children: item.value })] }, item.label))) }), _jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h2", { className: "font-semibold text-lg", children: "Add a new Airbnb listings" }), _jsx(Button, { variant: "ghost", type: "button", onClick: () => setShowForm((prev) => !prev), children: showForm ? 'Hide form' : 'Add listing' })] }), showForm && (_jsxs("form", { className: "grid gap-4 md:grid-cols-2", onSubmit: handleSubmit, children: [_jsx(Input, { label: "Unit name", name: "unitName", value: form.unitName, onChange: (event) => handleChange('unitName', event.target.value), required: true }), _jsx(Input, { label: "Location", name: "location", value: form.location, onChange: (event) => handleChange('location', event.target.value) }), _jsx(Input, { label: "Room numbers", name: "roomNumbers", value: form.roomNumbers, onChange: (event) => handleChange('roomNumbers', event.target.value), placeholder: "e.g. 101, 102" }), _jsx(Input, { label: "Price per night", name: "pricePerNight", type: "number", inputMode: "decimal", step: "0.01", value: form.pricePerNight, onChange: (event) => handleChange('pricePerNight', event.target.value), required: true }), _jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Status" }), _jsx("select", { value: form.status, onChange: (event) => handleChange('status', event.target.value), children: statusOptions.map((option) => (_jsx("option", { value: option, children: option.charAt(0).toUpperCase() + option.slice(1) }, option))) })] }), _jsx("div", { className: "md:col-span-2 flex justify-end gap-2", children: _jsx(Button, { type: "submit", disabled: loading, children: loading ? 'Saving...' : 'Create listing' }) }), statusMessage && (_jsx("p", { className: "md:col-span-2 text-sm text-gray-600", role: "status", children: statusMessage }))] }))] }), _jsxs(Card, { children: [_jsx("h2", { className: "font-semibold text-lg mb-3", children: "My Airbnb listings" }), loadingListings ? (_jsx("p", { className: "text-sm text-gray-600", children: "Loading listings..." })) : listings.length === 0 ? (_jsx("p", { className: "text-sm text-gray-600", children: "You have not created any listings yet." })) : (_jsx("div", { className: "space-y-3", children: listings.map((listing) => {
                            const isSelected = selectedListingId === listing.id;
                            return (_jsxs("article", { role: "button", tabIndex: 0, "aria-pressed": isSelected, className: `p-3 border rounded-lg shadow-sm bg-white cursor-pointer focus:outline-none focus:ring focus:ring-blue-200 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`, onClick: () => toggleListingSelection(listing.id), onKeyDown: (event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        toggleListingSelection(listing.id);
                                    }
                                }, children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("strong", { children: listing.unitName }), _jsx("span", { className: "text-xs uppercase tracking-wide text-gray-500", children: listing.status })] }), _jsx("p", { className: "text-sm text-gray-600", children: listing.location ?? 'Location not set' }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Rooms: ", listing.roomNumbers ?? 'Not specified'] }), _jsxs("p", { className: "text-sm text-gray-600", children: [currencyFormatter.format(listing.pricePerNight), " per night"] })] }, listing.id));
                        }) }))] }), selectedListing && (_jsxs(Card, { children: [_jsxs("h2", { className: "font-semibold text-lg mb-3", children: ["Rooms for ", selectedListing.unitName] }), loadingListingTenants && (_jsx("p", { className: "text-sm text-gray-500 mb-2", children: "Loading existing tenants\u2026" })), listingTenantError && (_jsx("p", { className: "text-sm text-red-500 mb-2", children: listingTenantError })), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 hover:cursor-pointer", children: roomNumbers.map((room) => {
                            const isBooked = bookedRoomNumbers.has(room);
                            const bookingClass = isBooked
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-red-500 bg-red-50 text-red-700';
                            const selectionClass = selectedRoom === room ? 'ring-2 ring-blue-500' : '';
                            return (_jsxs("button", { type: "button", onClick: () => handleRoomClick(room), className: `p-3 border rounded-lg text-left text-sm font-medium focus:outline-none focus:ring focus:ring-blue-200 ${bookingClass} ${selectionClass}`, children: [_jsx("span", { className: "block text-xs uppercase tracking-wide text-gray-500", children: "Room" }), _jsx("span", { className: "text-lg", children: room }), _jsx("span", { className: "text-[10px] uppercase tracking-wide", children: isBooked ? 'Booked' : 'Available' })] }, room));
                        }) }), selectedRoom && (_jsxs(Modal, { title: `Assign guest to ${selectedRoom}`, children: [_jsxs("p", { className: "text-sm text-gray-600 mb-2", children: ["Provide the guest details and booking dates for ", _jsx("strong", { children: selectedRoom }), "."] }), _jsxs("form", { className: "grid gap-4 md:grid-cols-2", onSubmit: handleTenantSubmit, children: [_jsx(Input, { label: "Guest name", name: "fullName", value: tenantForm.fullName, onChange: (event) => handleTenantChange('fullName', event.target.value), required: true }), _jsx(Input, { label: "Phone", name: "phone", value: tenantForm.phone, onChange: (event) => handleTenantChange('phone', event.target.value) }), _jsx(Input, { label: "Email", name: "email", type: "email", value: tenantForm.email, onChange: (event) => handleTenantChange('email', event.target.value) }), _jsx(Input, { label: "Check-in", name: "checkInAt", type: "datetime-local", value: tenantForm.checkInAt, onChange: (event) => handleTenantChange('checkInAt', event.target.value), required: true }), _jsx(Input, { label: "Check-out", name: "checkOutAt", type: "datetime-local", value: tenantForm.checkOutAt, onChange: (event) => handleTenantChange('checkOutAt', event.target.value), required: true }), _jsx(Input, { label: "Total amount", name: "totalAmount", type: "number", step: "0.01", value: tenantForm.totalAmount, onChange: (event) => handleTenantChange('totalAmount', event.target.value) }), _jsxs("label", { className: "input-field md:col-span-2", children: [_jsx("span", { children: "Status" }), _jsx("select", { value: tenantForm.status, onChange: (event) => handleTenantChange('status', event.target.value), children: tenantStatusOptions.map((status) => (_jsx("option", { value: status, children: status.replace('_', ' ') }, status))) })] }), _jsxs("div", { className: "md:col-span-2 flex justify-end gap-2", children: [_jsx(Button, { type: "submit", disabled: tenantLoading, children: tenantLoading ? 'Saving...' : 'Assign guest' }), _jsx(Button, { variant: "ghost", type: "button", onClick: () => setSelectedRoom(null), children: "Cancel" })] }), tenantStatusMessage && (_jsx("p", { className: "md:col-span-2 text-sm text-gray-600", children: tenantStatusMessage }))] })] }))] })), tenantModal && (_jsxs(Modal, { title: `Tenant in ${tenantModal.roomNumber ?? 'room'}`, children: [_jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "Name:" }), " ", tenantModal.fullName] }), _jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "Phone:" }), " ", tenantModal.phone ?? 'Not provided'] }), _jsxs("div", { className: "grid gap-3 md:grid-cols-2 mt-2", children: [_jsx(Input, { label: "Check-in", type: "datetime-local", value: tenantModalForm.checkInAt, onChange: (event) => handleTenantModalChange('checkInAt', event.target.value) }), _jsx(Input, { label: "Check-out", type: "datetime-local", value: tenantModalForm.checkOutAt, onChange: (event) => handleTenantModalChange('checkOutAt', event.target.value) })] }), _jsxs("p", { className: "text-sm text-gray-500 mt-2", children: ["Current booking ends: ", dateFormatter.format(new Date(tenantModal.checkOutAt))] }), _jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [_jsx(Button, { type: "button", disabled: tenantModalLoading, onClick: handleTenantModalUpdate, children: tenantModalLoading ? 'Saving...' : 'Update dates' }), _jsx(Button, { variant: "ghost", type: "button", onClick: closeTenantModal, children: "Close" })] })] }))] }));
};
export default Airbnb;
