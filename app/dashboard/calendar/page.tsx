'use client';

import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Project, Payment, Fine, SupplyRequest } from '@/types';
import { getAllProjects, getPayments, getFines, getSupplyRequests } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isPast,
  isFuture,
  startOfDay,
  differenceInDays
} from 'date-fns';
import { 
  FaCalendarAlt, 
  FaProjectDiagram, 
  FaDollarSign, 
  FaExclamationTriangle, 
  FaTruck, 
  FaChevronLeft, 
  FaChevronRight,
  FaFilter,
  FaTimes,
  FaClock,
  FaCheckCircle
} from 'react-icons/fa';
import { MdEvent, MdToday } from 'react-icons/md';

type EventType = 'project' | 'payment' | 'fine' | 'supply' | 'all';

interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  date: Date;
  color: string;
  bgColor: string;
  borderColor: string;
  description?: string;
  icon: React.ReactNode;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<EventType>('all');
  const [viewMode, setViewMode] = useState<'month' | 'upcoming'>('month');
  const { t } = useLanguage();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [projectsData, paymentsData, finesData, supplyData] = await Promise.all([
        getAllProjects(),
        getPayments(),
        getFines(),
        getSupplyRequests()
      ]);
      setProjects(projectsData);
      setPayments(paymentsData);
      setFines(finesData);
      setSupplyRequests(supplyData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Project deadlines
    projects.forEach(project => {
      if (project.deadline) {
        const deadlineDate = new Date(project.deadline);
        const isOverdue = isPast(startOfDay(deadlineDate)) && !isToday(deadlineDate);
        allEvents.push({
          id: `project-${project.id}`,
          type: 'project',
          title: project.clientName || project.id.slice(0, 8),
          date: deadlineDate,
          color: isOverdue ? 'text-red-700' : 'text-blue-700',
          bgColor: isOverdue ? 'bg-red-50' : 'bg-blue-50',
          borderColor: isOverdue ? 'border-red-300' : 'border-blue-300',
          description: `${t('calendar.project_deadline') || 'Project Deadline'}${project.location ? ` - ${project.location}` : ''}`,
          icon: <FaProjectDiagram className="w-4 h-4" />
        });
      }
    });

    // Salary payments
    payments.forEach(payment => {
      allEvents.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        title: payment.userName,
        date: new Date(payment.date),
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        description: `${t('calendar.salary_payment') || 'Salary Payment'} - ${payment.amount.toLocaleString()} UZS`,
        icon: <FaDollarSign className="w-4 h-4" />
      });
    });

    // Fines
    fines.forEach(fine => {
      allEvents.push({
        id: `fine-${fine.id}`,
        type: 'fine',
        title: fine.userName,
        date: new Date(fine.date),
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        description: `${t('calendar.fine') || 'Fine'} - ${fine.amount.toLocaleString()} UZS: ${fine.reason}`,
        icon: <FaExclamationTriangle className="w-4 h-4" />
      });
    });

    // Supply request deadlines
    supplyRequests.forEach(request => {
      if (request.deadline) {
        const deadlineDate = new Date(request.deadline);
        const isOverdue = isPast(startOfDay(deadlineDate)) && !isToday(deadlineDate);
        allEvents.push({
          id: `supply-${request.id}`,
          type: 'supply',
          title: request.projectName || request.projectId.slice(0, 8),
          date: deadlineDate,
          color: isOverdue ? 'text-orange-700' : 'text-orange-600',
          bgColor: isOverdue ? 'bg-orange-50' : 'bg-orange-50',
          borderColor: isOverdue ? 'border-orange-300' : 'border-orange-300',
          description: `${t('calendar.supply_deadline') || 'Supply Deadline'} - ${request.foremanName} (${request.items.length} items)`,
          icon: <FaTruck className="w-4 h-4" />
        });
      }
    });

    return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [projects, payments, fines, supplyRequests, t]);

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter(event => event.type === filterType);
  }, [events, filterType]);

  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return filteredEvents
      .filter(event => isFuture(startOfDay(event.date)) || isToday(event.date))
      .slice(0, 10);
  }, [filteredEvents]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => isSameDay(event.date, date));
  };

  const eventStats = useMemo(() => {
    return {
      total: events.length,
      projects: events.filter(e => e.type === 'project').length,
      payments: events.filter(e => e.type === 'payment').length,
      fines: events.filter(e => e.type === 'fine').length,
      supply: events.filter(e => e.type === 'supply').length,
      upcoming: upcomingEvents.length,
      overdue: events.filter(e => {
        const eventDate = startOfDay(e.date);
        return isPast(eventDate) && !isToday(eventDate) && (e.type === 'project' || e.type === 'supply');
      }).length
    };
  }, [events, upcomingEvents]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
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

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <Layout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-3">
                <FaCalendarAlt className="w-6 h-6 text-white" />
              </div>
              {t('nav.calendar') || 'Calendar'}
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'month'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('calendar.month_view') || 'Month'}
              </button>
              <button
                onClick={() => setViewMode('upcoming')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'upcoming'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('calendar.upcoming') || 'Upcoming'}
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            {t('calendar.subtitle') || 'View all events, deadlines, and important dates'}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <FaProjectDiagram className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{eventStats.projects}</span>
            </div>
            <p className="text-xs opacity-90">{t('calendar.projects') || 'Projects'}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <FaDollarSign className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{eventStats.payments}</span>
            </div>
            <p className="text-xs opacity-90">{t('calendar.payments') || 'Payments'}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <FaExclamationTriangle className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{eventStats.fines}</span>
            </div>
            <p className="text-xs opacity-90">{t('calendar.fines') || 'Fines'}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <FaTruck className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{eventStats.supply}</span>
            </div>
            <p className="text-xs opacity-90">{t('calendar.supplies') || 'Supplies'}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <FaClock className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{eventStats.upcoming}</span>
            </div>
            <p className="text-xs opacity-90">{t('calendar.upcoming') || 'Upcoming'}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <MdEvent className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{eventStats.total}</span>
            </div>
            <p className="text-xs opacity-90">{t('calendar.total') || 'Total'}</p>
          </div>
          {eventStats.overdue > 0 && (
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 text-white shadow-lg animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <FaExclamationTriangle className="w-5 h-5 opacity-80" />
                <span className="text-2xl font-bold">{eventStats.overdue}</span>
              </div>
              <p className="text-xs opacity-90">{t('calendar.overdue') || 'Overdue'}</p>
            </div>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <FaFilter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{t('calendar.filter') || 'Filter:'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'project', 'payment', 'fine', 'supply'] as EventType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
                    filterType === type
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t(`calendar.filter_${type}`) || type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {viewMode === 'month' ? (
          <>
            {/* Calendar Navigation */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={prevMonth}
                  className="p-3 hover:bg-gray-100 rounded-xl transition-all transform hover:scale-110 active:scale-95"
                >
                  <FaChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center space-x-4">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                  <button
                    onClick={goToToday}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg transform hover:scale-105 active:scale-95 flex items-center space-x-2 font-medium"
                  >
                    <MdToday className="w-4 h-4" />
                    <span>{t('calendar.today') || 'Today'}</span>
                  </button>
                </div>
                <button
                  onClick={nextMonth}
                  className="p-3 hover:bg-gray-100 rounded-xl transition-all transform hover:scale-110 active:scale-95"
                >
                  <FaChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-bold text-gray-700 py-3 text-sm bg-gray-50 rounded-lg">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day, idx) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isPastDate = isPast(startOfDay(day)) && !isTodayDate;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        min-h-[120px] p-2 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98]
                        ${isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}
                        ${isTodayDate ? 'ring-4 ring-indigo-400 ring-offset-2 border-indigo-500 shadow-xl' : ''}
                        ${isSelected ? 'bg-indigo-50 border-indigo-400 shadow-lg' : ''}
                        ${isPastDate ? 'opacity-75' : ''}
                      `}
                    >
                      <div className={`
                        text-sm font-bold mb-2 flex items-center justify-between
                        ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${isTodayDate ? 'text-indigo-600' : ''}
                      `}>
                        <span>{format(day, 'd')}</span>
                        {dayEvents.length > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                            isTodayDate ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {dayEvents.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`${event.bgColor} ${event.borderColor} border-l-4 ${event.color} text-xs px-2 py-1.5 rounded-md flex items-center space-x-1.5 shadow-sm hover:shadow-md transition-all`}
                            title={event.title}
                          >
                            <div className="flex-shrink-0">{event.icon}</div>
                            <span className="truncate font-medium">{event.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 font-semibold text-center py-1 bg-gray-100 rounded">
                            +{dayEvents.length - 3} {t('calendar.more') || 'more'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Upcoming Events View */
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FaClock className="w-6 h-6 mr-2 text-indigo-600" />
              {t('calendar.upcoming_events') || 'Upcoming Events'}
            </h2>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12">
                <FaCheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">{t('calendar.no_upcoming') || 'No upcoming events'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map(event => {
                  const daysUntil = differenceInDays(startOfDay(event.date), startOfDay(new Date()));
                  return (
                    <div
                      key={event.id}
                      className={`${event.bgColor} ${event.borderColor} border-l-4 rounded-lg p-4 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.01]`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`p-2 rounded-lg ${event.color.replace('text-', 'bg-').replace('-700', '-100')}`}>
                            {event.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-bold text-lg mb-1 ${event.color}`}>{event.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <FaCalendarAlt className="w-3 h-3" />
                                <span>{format(event.date, 'MMM d, yyyy')}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <FaClock className="w-3 h-3" />
                                <span>
                                  {daysUntil === 0
                                    ? t('calendar.today') || 'Today'
                                    : daysUntil === 1
                                    ? t('calendar.tomorrow') || 'Tomorrow'
                                    : `${daysUntil} ${t('calendar.days_away') || 'days away'}`}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Selected Date Events Detail */}
        {selectedDate && viewMode === 'month' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <MdEvent className="w-6 h-6 mr-2 text-indigo-600" />
                {t('calendar.events_on') || 'Events on'} {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8">
                <MdEvent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('calendar.no_events') || 'No events on this date'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDateEvents.map(event => (
                  <div
                    key={event.id}
                    className={`${event.bgColor} ${event.borderColor} border-l-4 rounded-xl p-5 shadow-md hover:shadow-lg transition-all`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-3 rounded-lg ${event.color.replace('text-', 'bg-').replace('-700', '-100')} flex-shrink-0`}>
                        {event.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-lg mb-2 ${event.color}`}>{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                        )}
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <FaCalendarAlt className="w-3 h-3" />
                          <span>{format(event.date, 'h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
