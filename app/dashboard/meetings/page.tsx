'use client';

import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Meeting } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { getMeetings, createMeeting, deleteMeeting } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, isPast, isFuture } from 'date-fns';
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaPlus, 
  FaTrash, 
  FaExternalLinkAlt,
  FaClock,
  FaUser,
  FaMap
} from 'react-icons/fa';
import { MdLocationOn, MdAccessTime } from 'react-icons/md';
import { toast } from 'react-toastify';
import MapPicker from '@/components/MapPicker';

// Default center (Tashkent, Uzbekistan)
const DEFAULT_CENTER = { lat: 41.2995, lng: 69.2401 };
const DEFAULT_ZOOM = 13;

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingDateTime, setMeetingDateTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    fetchMeetings();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMapCenter(loc);
          setSelectedLocation(loc);
        },
        () => {
          // Use default location if geolocation fails
          setSelectedLocation(DEFAULT_CENTER);
        }
      );
    } else {
      setSelectedLocation(DEFAULT_CENTER);
    }
  };

  const fetchMeetings = async () => {
    try {
      const data = await getMeetings();
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error(t('meetings.load_error') || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    setSelectedLocation(location);
    setMapCenter(location);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocation || !meetingTitle || !meetingDateTime) {
      toast.warning(t('meetings.required_fields') || 'Please fill all required fields and select a location');
      return;
    }

    setSubmitting(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('User not found');
        return;
      }

      await createMeeting({
        title: meetingTitle,
        description: meetingDescription,
        createdBy: user.id,
        createdByName: user.name,
        location: {
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
        },
        dateTime: new Date(meetingDateTime),
      });

      toast.success(t('meetings.created') || 'Meeting created successfully');
      setShowCreateModal(false);
      setMeetingTitle('');
      setMeetingDescription('');
      setMeetingDateTime('');
      setSelectedLocation(null);
      await fetchMeetings();
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error(t('meetings.create_error') || 'Failed to create meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm(t('meetings.confirm_delete') || 'Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      await deleteMeeting(id);
      toast.success(t('meetings.deleted') || 'Meeting deleted successfully');
      await fetchMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error(t('meetings.delete_error') || 'Failed to delete meeting');
    }
  };

  const getMapLinks = (lat: number, lng: number) => {
    return {
      google: `https://www.google.com/maps?q=${lat},${lng}`,
      yandex: `https://yandex.com/maps/?pt=${lng},${lat}&z=${mapZoom}`,
      twogis: `https://2gis.com/search/${lat},${lng}`
    };
  };

  const upcomingMeetings = meetings.filter(m => isFuture(new Date(m.dateTime)) || isPast(new Date(m.dateTime)) && new Date(m.dateTime).getTime() > Date.now() - 3600000);
  const pastMeetings = meetings.filter(m => isPast(new Date(m.dateTime)) && new Date(m.dateTime).getTime() <= Date.now() - 3600000);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">{t('supplier.loading') || 'Loading...'}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-3">
                <FaCalendarAlt className="w-6 h-6 text-white" />
              </div>
              {t('nav.meetings') || 'Meetings'}
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              {t('meetings.subtitle') || 'Schedule and manage meetings with location'}
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              getUserLocation();
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center space-x-2"
          >
            <FaPlus className="w-4 h-4" />
            <span>{t('meetings.create') || 'Create Meeting'}</span>
          </button>
        </div>

        {/* Meetings List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Meetings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FaClock className="w-5 h-5 mr-2 text-green-600" />
                {t('meetings.upcoming') || 'Upcoming Meetings'} ({upcomingMeetings.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {upcomingMeetings.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {t('meetings.no_upcoming') || 'No upcoming meetings'}
                </div>
              ) : (
                upcomingMeetings.map(meeting => {
                  const mapLinks = getMapLinks(meeting.location.latitude, meeting.location.longitude);
                  return (
                    <div key={meeting.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{meeting.title}</h3>
                          {meeting.description && (
                            <p className="text-sm text-gray-600 mb-2">{meeting.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('meetings.delete') || 'Delete'}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <MdAccessTime className="w-4 h-4 text-indigo-600" />
                          <span className="font-medium">{format(new Date(meeting.dateTime), 'PPpp')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700">
                          <FaUser className="w-4 h-4 text-indigo-600" />
                          <span>{t('meetings.created_by') || 'Created by'}: {meeting.createdByName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700">
                          <MdLocationOn className="w-4 h-4 text-red-600" />
                          <span>
                            {meeting.location.latitude.toFixed(6)}, {meeting.location.longitude.toFixed(6)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                          <a
                            href={mapLinks.google}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1"
                          >
                            <FaMap className="w-3 h-3" />
                            <span>Google Maps</span>
                          </a>
                          <a
                            href={mapLinks.yandex}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-medium hover:bg-yellow-700 transition-colors flex items-center space-x-1"
                          >
                            <FaMap className="w-3 h-3" />
                            <span>Yandex</span>
                          </a>
                          <a
                            href={mapLinks.twogis}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center space-x-1"
                          >
                            <FaMap className="w-3 h-3" />
                            <span>2GIS</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Past Meetings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FaCalendarAlt className="w-5 h-5 mr-2 text-gray-600" />
                {t('meetings.past') || 'Past Meetings'} ({pastMeetings.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {pastMeetings.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {t('meetings.no_past') || 'No past meetings'}
                </div>
              ) : (
                pastMeetings.map(meeting => {
                  const mapLinks = getMapLinks(meeting.location.latitude, meeting.location.longitude);
                  return (
                    <div key={meeting.id} className="p-5 hover:bg-gray-50 transition-colors opacity-75">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-700 mb-1">{meeting.title}</h3>
                          {meeting.description && (
                            <p className="text-sm text-gray-500 mb-2">{meeting.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MdAccessTime className="w-4 h-4" />
                          <span>{format(new Date(meeting.dateTime), 'PPpp')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <FaUser className="w-4 h-4" />
                          <span>{meeting.createdByName}</span>
                        </div>
                        <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                          <a
                            href={mapLinks.google}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1"
                          >
                            <FaMap className="w-3 h-3" />
                            <span>Google Maps</span>
                          </a>
                          <a
                            href={mapLinks.yandex}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-medium hover:bg-yellow-700 transition-colors flex items-center space-x-1"
                          >
                            <FaMap className="w-3 h-3" />
                            <span>Yandex</span>
                          </a>
                          <a
                            href={mapLinks.twogis}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center space-x-1"
                          >
                            <FaMap className="w-3 h-3" />
                            <span>2GIS</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Create Meeting Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FaMapMarkerAlt className="w-6 h-6 mr-2 text-indigo-600" />
                    {t('meetings.create') || 'Create Meeting'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedLocation(null);
                      setMeetingTitle('');
                      setMeetingDescription('');
                      setMeetingDateTime('');
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateMeeting} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('meetings.title') || 'Meeting Title'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder={t('meetings.title_placeholder') || 'Enter meeting title...'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('meetings.description') || 'Description'}
                      </label>
                      <textarea
                        rows={3}
                        value={meetingDescription}
                        onChange={(e) => setMeetingDescription(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder={t('meetings.description_placeholder') || 'Enter meeting description...'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('meetings.date_time') || 'Date & Time'} *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={meetingDateTime}
                        onChange={(e) => setMeetingDateTime(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {selectedLocation && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                        <p className="text-sm font-semibold text-green-800 mb-1">
                          {t('meetings.location_selected') || 'Location Selected'}
                        </p>
                        <p className="text-xs text-green-700">
                          {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          {t('meetings.click_map_hint') || 'Click on the map to change location'}
                        </p>
                      </div>
                    )}
                  </div>

                    {/* Map */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('meetings.select_location') || 'Select Location on Map'} *
                      </label>
                      <MapPicker
                        center={mapCenter}
                        zoom={mapZoom}
                        onLocationSelect={handleLocationSelect}
                        selectedLocation={selectedLocation}
                      />
                      <div className="mt-2 flex items-center space-x-2 text-xs text-gray-600">
                        <FaMapMarkerAlt className="w-3 h-3" />
                        <span>{t('meetings.click_to_select') || 'Click anywhere on the map to select location'}</span>
                      </div>
                    </div>

                    {selectedLocation && (
                      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-indigo-900 mb-3">
                          {t('meetings.open_in_maps') || 'Open in Maps:'}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <a
                            href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors text-center flex items-center justify-center space-x-1"
                          >
                            <FaMap className="w-3 h-3" />
                            <span>Google</span>
                          </a>
                          <a
                            href={`https://yandex.com/maps/?pt=${selectedLocation.lng},${selectedLocation.lat}&z=${mapZoom}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-yellow-600 text-white rounded-lg text-xs font-medium hover:bg-yellow-700 transition-colors text-center flex items-center justify-center space-x-1"
                          >
                            <FaMap className="w-3 h-3" />
                            <span>Yandex</span>
                          </a>
                          <a
                            href={`https://2gis.com/search/${selectedLocation.lat},${selectedLocation.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors text-center flex items-center justify-center space-x-1"
                          >
                            <FaMap className="w-3 h-3" />
                            <span>2GIS</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting || !selectedLocation}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95"
                  >
                    {submitting ? t('meetings.creating') || 'Creating...' : t('meetings.create_meeting') || 'Create Meeting'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedLocation(null);
                      setMeetingTitle('');
                      setMeetingDescription('');
                      setMeetingDateTime('');
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    {t('foreman.cancel') || 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

