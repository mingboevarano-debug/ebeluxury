'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Attendance } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { getAttendance, createAttendance, updateAttendanceCheckOut } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { OFFICE_LOCATION, isWithinOfficeRadius, getAttendanceStatus } from '@/lib/officeConfig';
import { format, isSameDay, startOfDay, parseISO } from 'date-fns';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaMapMarkerAlt,
  FaSignInAlt,
  FaSignOutAlt,
  FaLocationArrow,
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
  const { t } = useLanguage();

  useEffect(() => {
    fetchAttendance();
    checkTodayAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const records = await getAttendance(user.id);
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error(t('attendance.load_error') || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const today = new Date();
      const records = await getAttendance(user.id, today);
      if (records.length > 0) {
        setTodayAttendance(records[0]);
      }
    } catch (error) {
      console.error('Error checking today attendance:', error);
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    setLocationError(null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('User not found');
        return;
      }

      // Get current location
      const location = await getCurrentLocation();
      setCurrentLocation(location);

      // Verify location
      const isAtOffice = isWithinOfficeRadius(location.lat, location.lng);
      
      if (!isAtOffice) {
        const distance = Math.sqrt(
          Math.pow(location.lat - OFFICE_LOCATION.latitude, 2) +
          Math.pow(location.lng - OFFICE_LOCATION.longitude, 2)
        ) * 111000; // Rough conversion to meters

        setLocationError(
          t('attendance.not_at_office') || 
          `You are not at the office. Distance: ${Math.round(distance)}m. Office location: ${OFFICE_LOCATION.latitude.toFixed(6)}, ${OFFICE_LOCATION.longitude.toFixed(6)}`
        );
        toast.warning(t('attendance.location_not_verified') || 'Location verification failed. You may not be at the office.');
        return;
      }

      // Get current time
      const now = new Date();
      const status = getAttendanceStatus(now);

      // Check if already checked in today
      const today = startOfDay(new Date());
      const existingRecords = await getAttendance(user.id, today);
      if (existingRecords.length > 0 && existingRecords[0].checkInTime) {
        toast.warning(t('attendance.already_checked_in') || 'You have already checked in today');
        return;
      }

      // Create attendance record
      await createAttendance({
        userId: user.id,
        userName: user.name,
        date: today,
        checkInTime: now,
        status: status,
        location: {
          latitude: location.lat,
          longitude: location.lng,
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

    setCheckingOut(true);
    setLocationError(null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('User not found');
        return;
      }

      // Get current location
      const location = await getCurrentLocation();
      setCurrentLocation(location);

      // Verify location (optional for checkout, but good to verify)
      const isAtOffice = isWithinOfficeRadius(location.lat, location.lng);
      
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

        {/* Office Location Info */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <MdLocationOn className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                {t('attendance.office_location') || 'Office Location'}
              </h3>
              <p className="text-sm text-blue-700">
                {OFFICE_LOCATION.name} - {OFFICE_LOCATION.address}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {OFFICE_LOCATION.latitude.toFixed(6)}, {OFFICE_LOCATION.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {t('attendance.radius') || 'Allowed radius'}: {OFFICE_LOCATION.radius}m
              </p>
            </div>
          </div>
        </div>

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

