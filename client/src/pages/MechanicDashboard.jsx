// MechanicDashboard.jsx - Enhanced with real-time task management
import React, { useState, useEffect } from 'react';
import { apiService, STATUS, TASK_TYPES } from '../routing/apiClient';
import MechanicOpenJobs from '../components/MechanicOpenJobs';
import MechanicBillModal from '../components/MechanicBillModal';

const MechanicDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskNotes, setTaskNotes] = useState('');
  // Same capabilities the app gives a mechanic: pick up open jobs, go
  // online/offline, and bill a finished job.
  const [billJob, setBillJob] = useState(null);
  const [available, setAvailable] = useState(true);
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleAvailability = async () => {
    const next = !available;
    setAvailable(next);
    try {
      await apiService.updateAvailability({ availability: next ? 'available' : 'offline' });
      notify(next ? "You're online — new jobs will reach you." : "You're offline.", 'success');
    } catch {
      setAvailable(!next);
      notify('Could not change your availability', 'error');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up periodic refresh for real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, tasksResponse] = await Promise.all([
        apiService.getMechanicDashboard(),
        apiService.getMechanicTasks()
      ]);
      
      setDashboardStats(statsResponse.data);
      setTasks(tasksResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced task status update with better UX
  const handleTaskStatusUpdate = async (taskId, status, taskType, notes = '') => {
    try {
      setLoading(true);
      
      await apiService.updateTaskStatus(taskId, { 
        status, 
        taskType,
        notes 
      });
      
      // Show success message
      alert('Task status updated successfully!');
      
      // Refresh tasks to show updated status
      await fetchDashboardData();
      setShowTaskModal(false);
      setSelectedTask(null);
      setTaskNotes('');
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick status update without modal
  const quickStatusUpdate = async (task, newStatus) => {
    const confirmMessage = `Are you sure you want to mark this task as ${newStatus}?`;
    if (window.confirm(confirmMessage)) {
      await handleTaskStatusUpdate(task._id, newStatus, task.taskType);
    }
  };

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter(task => {
    switch (activeTab) {
      case 'pending': 
        return task.status === 'confirmed' || task.status === 'assigned';
      case 'progress': 
        return task.status === 'in-progress';
      case 'completed': 
        return task.status === 'completed';
      default: 
        return true;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-lg text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-bold text-white">🔧 Mechanic Dashboard</h1>
            <button
              onClick={fetchDashboardData}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              disabled={loading}
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile card */}
        {dashboardStats && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {dashboardStats.photo ? (
                  <img src={`https://api.roadengo.com${dashboardStats.photo}`} alt={dashboardStats.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold">{(dashboardStats.name || 'M')[0]}</span>
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{dashboardStats.name}</p>
                <p className="text-sm font-semibold text-red-600">ID: {dashboardStats.mechanicId}</p>
                <p className="text-sm text-gray-500">{dashboardStats.phone}{dashboardStats.city ? ` · ${dashboardStats.city}` : ''}</p>
                {/* Same online/offline switch the app has — a mechanic must be
                    online to be sent new work. */}
                <button
                  onClick={toggleAvailability}
                  className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    available
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${available ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {available ? 'Online' : 'Offline'}
                </button>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-gray-600">
              <div>
                <p className="text-gray-400 text-xs">Joined</p>
                <p className="font-semibold">{dashboardStats.joinedAt ? new Date(dashboardStats.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Rating</p>
                <p className="font-semibold">⭐ {Number(dashboardStats.rating || 0).toFixed(1)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Experience</p>
                <p className="font-semibold">{dashboardStats.experience ?? 0} Years</p>
              </div>
            </div>
          </div>
        )}

        {/* Stat cards — All Time + Today, matching the mobile app dashboard */}
        {dashboardStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MiniStat icon="📅" color="text-blue-600 bg-blue-100" label="Total Bookings" sub="All Time" value={dashboardStats.totalAssigned ?? 0} />
            <MiniStat icon="✅" color="text-green-600 bg-green-100" label="Completed" sub="All Time" value={dashboardStats.completedTasks ?? 0} />
            <MiniStat icon="💰" color="text-yellow-600 bg-yellow-100" label="Total Billing" sub="All Time" value={`₹${dashboardStats.totalBilling ?? 0}`} />
            <MiniStat icon="⭐" color="text-purple-600 bg-purple-100" label="Rating" sub="All Time" value={Number(dashboardStats.rating || 0).toFixed(1)} />
            <MiniStat icon="📅" color="text-blue-600 bg-blue-100" label="Bookings" sub="Today" value={dashboardStats.todayBookings ?? 0} />
            <MiniStat icon="✅" color="text-green-600 bg-green-100" label="Completed" sub="Today" value={dashboardStats.todayCompleted ?? 0} />
            <MiniStat icon="💰" color="text-yellow-600 bg-yellow-100" label="Billing" sub="Today" value={`₹${dashboardStats.todayBilling ?? 0}`} />
            <MiniStat icon="🎯" color="text-red-600 bg-red-100" label="Daily Target" sub="Today" value={`₹${dashboardStats.dailyTarget ?? 0}`} />
          </div>
        )}

        {/* Enhanced Task Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">My Tasks</h2>
              
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'open', label: 'Open Jobs', count: null },
                  { key: 'pending', label: 'Pending', count: dashboardStats?.pending || 0 },
                  { key: 'progress', label: 'In Progress', count: dashboardStats?.inProgress || 0 },
                  { key: 'completed', label: 'Completed', count: dashboardStats?.completed || 0 }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      activeTab === tab.key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activeTab === tab.key
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Open (unassigned) jobs — accept one and it moves into My Tasks */}
          {activeTab === 'open' && (
            <div className="p-6 bg-gray-50">
              <MechanicOpenJobs onAccepted={fetchDashboardData} notify={notify} />
            </div>
          )}

          {/* Enhanced Task List */}
          <div className={`divide-y divide-gray-200 ${activeTab === 'open' ? 'hidden' : ''}`}>
            {filteredTasks.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab} tasks</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeTab === 'pending' ? 'No pending tasks to work on.' :
                   activeTab === 'progress' ? 'No tasks currently in progress.' :
                   'No completed tasks yet.'}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task._id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status?.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          task.taskType === 'emergency' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {task.taskType?.toUpperCase()}
                        </span>
                        {task.urgencyLevel && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.urgencyLevel)}`}>
                            {task.urgencyLevel?.toUpperCase()} PRIORITY
                          </span>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {task.serviceType || task.problemDescription || 'Service Request'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {task.bikeModel && `Bike: ${task.bikeModel} | `}
                          {task.issueDescription || task.serviceType}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg className="flex-shrink-0 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{task.userId?.name || task.name || 'Customer'}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="flex-shrink-0 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
<a href={`tel:${task.userId?.phone || task.phone || task.contactNumber || ''}`}>
  {task.userId?.phone || task.phone || task.contactNumber || 'N/A'}
</a>
                        </div>
                        <div className="flex items-center">
                          <svg className="flex-shrink-0 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="truncate">{task.location || 'Address not provided'}</span>
                        </div>
                        {task.appointmentDate && (
                          <div className="flex items-center">
                            <svg className="flex-shrink-0 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{new Date(task.appointmentDate).toLocaleDateString()} at {task.preferredTime || 'N/A'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-6">
                      {task.status === 'confirmed' || task.status === 'assigned' ? (
                        <button
                          onClick={() => quickStatusUpdate(task, 'in-progress')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                          disabled={loading}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-2-4a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>Start Task</span>
                        </button>
                      ) : task.status === 'in-progress' ? (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskModal(true);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                          disabled={loading}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Complete Task</span>
                        </button>
                      ) : task.status === 'completed' ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Completed</span>
                        </div>
                      ) : null}

                      {(task.status === 'in-progress' || task.status === 'completed') &&
                        (task.taskType || 'appointment') === 'appointment' && (
                          <button
                            onClick={() => setBillJob(task)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            🧾 Generate Bill
                          </button>
                        )}
                      
                      <button
  onClick={async () => {
    try {
      // Get mechanic's current location
      const getCurrentPosition = () =>
        new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser.'));
          } else {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
            });
          }
        });

      const position = await getCurrentPosition();
      const from = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      if (!from?.latitude || !from?.longitude) {
        alert('Current location not available.');
        return;
      }

      // Get destination coordinates or address from API
      const routeInfo = await apiService.getRouteInfo(task._id, task.taskType);
      const to = routeInfo.data.to;

      if (!to) {
        alert('Destination not available.');
        return;
      }

      // Build Google Maps URL using proper coordinates
      let toParam = "";
      if (to.latitude != null && to.longitude != null) {
        // Use lat/lng if available
        toParam = `${to.latitude},${to.longitude}`;
      } else if (typeof to.address === "string") {
        // Extract numeric coordinates from "Latitude: xx.xxxx, Longitude: yy.yyyy"
        const match = to.address.match(/([-+]?[0-9]*\.?[0-9]+),\s*([-+]?[0-9]*\.?[0-9]+)/);
        if (match) {
          toParam = `${match[1]},${match[2]}`;
        } else {
          // fallback to URL-encoded address if format is different
          toParam = encodeURIComponent(to.address);
        }
      }

      const googleMapsUrl = `https://www.google.com/maps/dir/${from.latitude},${from.longitude}/${toParam}`;
      window.open(googleMapsUrl, '_blank');

    } catch (error) {
      console.error('Error getting route info or current location:', error);
      alert('Unable to get directions. Please check the coordinates manually.');
    }
  }}
  className="text-blue-600 hover:text-blue-800 px-4 py-2 rounded-lg text-sm font-medium border border-blue-200 hover:border-blue-300 transition-colors flex items-center space-x-2"
  title="Get Directions"
>
   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                        </svg>
                        <span>Directions</span>
</button>

                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Task Completion Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Complete Task</h3>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Task:</span> {selectedTask.serviceType || selectedTask.issueDescription}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Customer:</span> {selectedTask.name}
                </p>
              </div>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTaskStatusUpdate(selectedTask._id, 'completed', selectedTask.taskType, taskNotes);
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completion Notes & Work Summary
                  </label>
                  <textarea
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Describe the work completed, parts used, any issues found, and recommendations for the customer..."
                    required
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Complete Task</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Billing — same endpoint and invoice series the app uses */}
      {billJob && (
        <MechanicBillModal
          job={billJob}
          onClose={() => setBillJob(null)}
          onSaved={fetchDashboardData}
          notify={notify}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.type === 'error'
              ? 'bg-red-600'
              : toast.type === 'info'
              ? 'bg-gray-800'
              : 'bg-emerald-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

function MiniStat({ icon, color, label, sub, value }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${color}`}>{icon}</div>
      <p className="text-xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className="text-[10px] text-gray-400">{sub}</p>
    </div>
  );
}

export default MechanicDashboard;
