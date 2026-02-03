'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Attendance } from '@/types';
import { subscribeToAuthChanges } from '@/lib/auth';
import { getAttendance, createAttendance, updateAttendanceCheckOut } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { OFFICE_LOCATION, isWithinOfficeRadius, getAttendanceStatus, getCurrentLocation as getGeoLocation, verifyOfficeLocation } from '@/lib/officeConfig';
import { format, startOfDay } from 'date-fns';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaMapMarkerAlt,
  FaSignInAlt,
  FaSignOutAlt,
  FaCalendarAlt
} from 'react-icons/fa';
import { MdLocationOn, MdAccessTime, MdCheckCircle } from 'react-icons/md';
import { toast } from 'react-toastify';

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [showLocationCheck, setShowLocationCheck] = useState(false);
  const [locationCheckResult, setLocationCheckResult] = useState<{
    userLat: number;
    userLng: number;
    distance: number;
    withinRadius: boolean;
    accuracy?: number;
    accuracyAcceptable?: boolean;
  } | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      if (!user) {
        setCurrentUser(null);
        setAttendanceRecords([]);
        setTodayAttendance(null);
        setLoading(false);
        return;
      }
      setCurrentUser(user);
      try {
        const records = await getAttendance(user.id);
        setAttendanceRecords(records);
        const today = new Date();
        const todayRecords = await getAttendance(user.id, today);
        setTodayAttendance(todayRecords.length > 0 ? todayRecords[0] : null);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast.error(t('attendance.load_error') || 'Failed to load attendance records');
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [t]);

  const fetchAttendance = async () => {
    if (!currentUser) return;
    try {
      const records = await getAttendance(currentUser.id);
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error(t('attendance.load_error') || 'Failed to load attendance records');
    }
  };

  const checkTodayAttendance = async () => {
    if (!currentUser) return;
    try {
      const today = new Date();
      const records = await getAttendance(currentUser.id, today);
      setTodayAttendance(records.length > 0 ? records[0] : null);
    } catch (error) {
      console.error('Error checking today attendance:', error);
    }
  };

  const handleCheckLocation = async () => {
    setShowLocationCheck(true);
    setLocationCheckResult(null);
    setCheckingLocation(true);
    try {
      const loc = await getGeoLocation();
      const result = verifyOfficeLocation(loc.lat, loc.lng, loc.accuracy);
      setLocationCheckResult({
        userLat: result.lat,
        userLng: result.lng,
        distance: result.distance,
        withinRadius: result.withinRadius,
        accuracy: result.accuracy ?? undefined,
        accuracyAcceptable: result.accuracyAcceptable,
      });
    } catch (error: any) {
      toast.error(error.message || t('attendance.location_error'));
      setShowLocationCheck(false);
    } finally {
      setCheckingLocation(false);
    }
  };

  const handleCheckIn = async () => {
    if (!currentUser) {
      toast.error('User not found');
      return;
    }
    setCheckingIn(true);
    setLocationError(null);

    try {
      // Get current location (shared high-accuracy logic)
      const loc = await getGeoLocation();
      const result = verifyOfficeLocation(loc.lat, loc.lng, loc.accuracy);
      setCurrentLocation({ lat: result.lat, lng: result.lng });

      // Reject if GPS accuracy is too poor to trust (avoids false positives when far away)
      if (!result.accuracyAcceptable) {
        setLocationError(
          t('attendance.gps_accuracy_poor') || `GPS accuracy is too poor (${result.accuracy ? Math.round(result.accuracy) : '?'}m). Please enable high-accuracy location and try again.`
        );
        toast.warning(t('attendance.location_not_verified') || 'Location verification failed.');
        return;
      }

      if (!result.withinRadius) {
        setLocationError(
          `${t('attendance.not_at_office') || 'You are not at the office'} — ${Math.round(result.distance)}m ${t('attendance.away') || 'away'}. ${t('attendance.office_coords') || 'Office'}: ${OFFICE_LOCATION.latitude.toFixed(6)}, ${OFFICE_LOCATION.longitude.toFixed(6)}`
        );
        toast.warning(t('attendance.location_not_verified') || 'Location verification failed. You may not be at the office.');
        return;
      }

      // Get current time
      const now = new Date();
      const status = getAttendanceStatus(now);

      // Check if already checked in today
      const today = startOfDay(new Date());
      const existingRecords = await getAttendance(currentUser.id, today);
      if (existingRecords.length > 0 && existingRecords[0].checkInTime) {
        toast.warning(t('attendance.already_checked_in') || 'You have already checked in today');
        return;
      }

      // Create attendance record
      await createAttendance({
        userId: currentUser.id,
        userName: currentUser.name,
        date: today,
        checkInTime: now,
        status: status,
        location: {
          latitude: result.lat,
          longitude: result.lng,
        },
        verified: true,
      });

      toast.success(t('attendance.checked_in') || 'Successfully checked in!');
      await fetchAttendance();
      await checkTodayAttendance();
    } catch (error: any) {
      console.error('Error checking in:', error);
      setLocationError(error.message || t('attendance.location_error') || 'Failed to get location');
      toast.error(error.message || t('attendance.checkin_error') || 'Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance || !todayAttendance.checkInTime) {
      toast.warning(t('attendance.no_checkin') || 'Please check in first');
      return;
    }

    if (todayAttendance.checkOutTime) {
      toast.warning(t('attendance.already_checked_out') || 'You have already checked out today');
      return;
    }

    if (!currentUser) {
      toast.error('User not found');
      return;
    }
    setCheckingOut(true);
    setLocationError(null);

    try {

      // Get current location (shared logic)
      const loc = await getGeoLocation();
      setCurrentLocation({ lat: loc.lat, lng: loc.lng });

      // Verify location (optional for checkout, but good to verify)
      const isAtOffice = isWithinOfficeRadius(loc.lat, loc.lng);
      
      if (!isAtOffice) {
        // Allow checkout even if not at office, but show warning
        toast.warning(t('attendance.checkout_location_warning') || 'You are not at the office location');
      }

      // Update attendance with checkout time
      const now = new Date();
      await updateAttendanceCheckOut(todayAttendance.id, now);

      toast.success(t('attendance.checked_out') || 'Successfully checked out!');
      await fetchAttendance();
      await checkTodayAttendance();
    } catch (error: any) {
      console.error('Error checking out:', error);
      setLocationError(error.message || t('attendance.location_error') || 'Failed to get location');
      toast.error(error.message || t('attendance.checkout_error') || 'Failed to check out');
    } finally {
      setCheckingOut(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'early':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
      case 'late':
      case 'early':
        return <FaCheckCircle className="w-5 h-5" />;
      case 'absent':
        return <FaTimesCircle className="w-5 h-5" />;
      default:
        return <FaClock className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">{t('supplier.loading') || 'Loading...'}</div>
        </div>
      </Layout>
    );
  }

  const canCheckIn = !todayAttendance || !todayAttendance.checkInTime;
  const canCheckOut = todayAttendance && todayAttendance.checkInTime && !todayAttendance.checkOutTime;

  return (
    <Layout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-3">
              <FaClock className="w-6 h-6 text-white" />
            </div>
            {t('attendance.title') || 'Attendance'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            {t('attendance.subtitle') || 'Mark your attendance and track your work hours'}
          </p>
        </div>

        {/* Office Location Info + Check Location Button */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start space-x-3">
              <MdLocationOn className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  {t('attendance.office_location') || 'Office Location'}
                </h3>
                <p className="text-sm text-blue-700">
                  {OFFICE_LOCATION.name} - {OFFICE_LOCATION.address}
                </p>
                <p className="text-xs text-blue-600 mt-1 font-mono">
                  {OFFICE_LOCATION.latitude.toFixed(6)}, {OFFICE_LOCATION.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {t('attendance.radius') || 'Allowed radius'}: {OFFICE_LOCATION.radius}m
                </p>
              </div>
            </div>
            <button
              onClick={handleCheckLocation}
              disabled={checkingLocation}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow transition-all flex-shrink-0"
            >
              <FaMapMarkerAlt className="w-4 h-4" />
              <span>{t('attendance.check_my_location') || 'Check My Location'}</span>
            </button>
          </div>
        </div>

        {/* Location Check Modal */}
        {showLocationCheck && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="w-5 h-5 text-indigo-600" />
                {t('attendance.location_check_title') || 'Location Check'}
              </h3>
              {checkingLocation ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                  <span className="ml-3 text-gray-600">{t('attendance.getting_location') || 'Getting your location...'}</span>
                </div>
              ) : locationCheckResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('attendance.office_location') || 'Office'}</p>
                      <p className="font-mono text-gray-800">{OFFICE_LOCATION.latitude.toFixed(6)}, {OFFICE_LOCATION.longitude.toFixed(6)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('attendance.your_location') || 'Your location'}</p>
                      <p className="font-mono text-gray-800">{locationCheckResult.userLat.toFixed(6)}, {locationCheckResult.userLng.toFixed(6)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border-2 bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{t('attendance.distance') || 'Distance'}</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(locationCheckResult.distance)} m</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{t('attendance.radius') || 'Allowed radius'}</p>
                      <p className="text-2xl font-bold text-indigo-600">{OFFICE_LOCATION.radius} m</p>
                    </div>
                    {locationCheckResult.accuracy !== undefined && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{t('attendance.gps_accuracy') || 'GPS accuracy'}</p>
                        <p className="text-2xl font-bold text-gray-700">±{Math.round(locationCheckResult.accuracy)} m</p>
                      </div>
                    )}
                  </div>
                  {locationCheckResult.accuracyAcceptable === false && (
                    <div className="p-3 rounded-lg border-2 bg-amber-50 border-amber-300">
                      <p className="text-amber-800 text-sm font-medium">
                        ⚠ {t('attendance.gps_accuracy_poor') || 'GPS accuracy is too poor to reliably verify. Check-in may be rejected.'}
                      </p>
                    </div>
                  )}
                  <div className={`p-4 rounded-lg border-2 ${locationCheckResult.withinRadius ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    {locationCheckResult.withinRadius ? (
                      <p className="text-green-800 font-bold flex items-center gap-2">
                        <FaCheckCircle className="w-5 h-5" />
                        {t('attendance.within_radius') || '✓ Within office radius — You can check in'}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-red-800 font-bold flex items-center gap-2">
                          <FaTimesCircle className="w-5 h-5" />
                          {t('attendance.outside_radius') || '✗ Outside office radius — You are'} {Math.round(locationCheckResult.distance)}m {t('attendance.away') || 'away'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
              <button
                onClick={() => setShowLocationCheck(false)}
                className="mt-4 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg"
              >
                {t('foreman.close_btn') || 'Close'}
              </button>
            </div>
          </div>
        )}

        {/* Check In/Out Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Check In Card */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FaSignInAlt className="w-5 h-5 mr-2 text-green-600" />
                {t('attendance.check_in') || 'Check In'}
              </h2>
              {todayAttendance?.checkInTime && (
                <div className="flex items-center space-x-2 text-green-600">
                  <MdCheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('attendance.checked_in') || 'Checked In'}</span>
                </div>
              )}
            </div>
            
            {todayAttendance?.checkInTime ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-700">
                  <MdAccessTime className="w-4 h-4" />
                  <span className="text-sm">
                    {t('attendance.checkin_time') || 'Check-in time'}: {format(new Date(todayAttendance.checkInTime), 'PPpp')}
                  </span>
                </div>
                <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${getStatusColor(todayAttendance.status)}`}>
                  {getStatusIcon(todayAttendance.status)}
                  <span className="text-sm font-medium">
                    {t(`attendance.status_${todayAttendance.status}`) || todayAttendance.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {t('attendance.check_in_description') || 'Click the button below to check in. Your location will be verified.'}
                </p>
                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
                >
                  {checkingIn ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{t('attendance.checking_in') || 'Checking in...'}</span>
                    </>
                  ) : (
                    <>
                      <FaSignInAlt className="w-5 h-5" />
                      <span>{t('attendance.check_in_button') || 'I Have Come to the Office'}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {locationError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{locationError}</p>
              </div>
            )}

            {currentLocation && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">
                  {t('attendance.your_location') || 'Your location'}:
                </p>
                <p className="text-sm font-mono text-gray-700">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Check Out Card */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FaSignOutAlt className="w-5 h-5 mr-2 text-red-600" />
                {t('attendance.check_out') || 'Check Out'}
              </h2>
              {todayAttendance?.checkOutTime && (
                <div className="flex items-center space-x-2 text-red-600">
                  <MdCheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('attendance.checked_out') || 'Checked Out'}</span>
                </div>
              )}
            </div>

            {todayAttendance?.checkOutTime ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-700">
                  <MdAccessTime className="w-4 h-4" />
                  <span className="text-sm">
                    {t('attendance.checkout_time') || 'Check-out time'}: {format(new Date(todayAttendance.checkOutTime), 'PPpp')}
                  </span>
                </div>
                {todayAttendance.checkInTime && (
                  <div className="text-sm text-gray-600">
                    {t('attendance.work_duration') || 'Work duration'}: {
                      Math.round((new Date(todayAttendance.checkOutTime).getTime() - new Date(todayAttendance.checkInTime).getTime()) / (1000 * 60 * 60) * 10) / 10
                    } {t('attendance.hours') || 'hours'}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {t('attendance.check_out_description') || 'Click the button below to check out when you leave the office.'}
                </p>
                <button
                  onClick={handleCheckOut}
                  disabled={checkingOut || !canCheckOut}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
                >
                  {checkingOut ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{t('attendance.checking_out') || 'Checking out...'}</span>
                    </>
                  ) : (
                    <>
                      <FaSignOutAlt className="w-5 h-5" />
                      <span>{t('attendance.check_out_button') || 'Check Out'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-xl font-bold text-gray-900">
              {t('attendance.history') || 'Attendance History'}
            </h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {attendanceRecords.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {t('attendance.no_records') || 'No attendance records found'}
              </div>
            ) : (
              attendanceRecords.map((record) => (
                <div key={record.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{record.userName}</h3>
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg border ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="text-sm font-medium">
                            {t(`attendance.status_${record.status}`) || record.status}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <FaCalendarAlt className="w-4 h-4" />
                          <span>{format(new Date(record.date), 'PP')}</span>
                        </div>
                        {record.checkInTime && (
                          <div className="flex items-center space-x-2">
                            <FaSignInAlt className="w-4 h-4 text-green-600" />
                            <span>{t('attendance.check_in') || 'Check In'}: {format(new Date(record.checkInTime), 'pp')}</span>
                          </div>
                        )}
                        {record.checkOutTime && (
                          <div className="flex items-center space-x-2">
                            <FaSignOutAlt className="w-4 h-4 text-red-600" />
                            <span>{t('attendance.check_out') || 'Check Out'}: {format(new Date(record.checkOutTime), 'pp')}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <FaMapMarkerAlt className={`w-4 h-4 ${record.verified ? 'text-green-600' : 'text-red-600'}`} />
                          <span>
                            {record.verified ? t('attendance.location_verified') || 'Location Verified' : t('attendance.location_not_verified') || 'Location Not Verified'}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({record.location.latitude.toFixed(4)}, {record.location.longitude.toFixed(4)})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

