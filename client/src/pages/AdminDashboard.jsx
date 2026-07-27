// pages/AdminDashboard.jsx - COMPLETE FUNCTIONAL VERSION WITH ALL TABS
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiService, STATUS } from "../routing/apiClient";
import FleetMapView from "../components/FleetMapView";
import BookingsMapView from "../components/BookingsMapView";
import AllBookingsTable from "../components/AllBookingsTable";
import MechanicProfileView from "../components/MechanicProfileView";

const AVAILABILITY_MARKER_COLOR = {
  available: "#16a34a",
  busy: "#dc2626",
  offline: "#9ca3af",
};

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  console.log(appointments);
  
  const [emergencies, setEmergencies] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [contactForms, setContactForms] = useState([]);
  const [bookingsByLocation, setBookingsByLocation] = useState({ locations: [], totalBookings: 0 });
  const [contactFormStatusFilter, setContactFormStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("dashboardHome");
  const [emergencyStatusFilter, setEmergencyStatusFilter] = useState("all");
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState("all");
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateMechanicModal, setShowCreateMechanicModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState(null);

  const [notification, setNotification] = useState(null); 
  const [viewDetails, setViewDetails] = useState({ show: false, content: "", title: "" });

  const [newMechanic, setNewMechanic] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    specialization: [],
    vehicleType: "",
    experience: 0,
    city: "",
    dateOfBirth: "",
    gender: "",
    currentAddress: "",
    state: "",
    pinCode: "",
    aadhaarNumber: "",
    serviceAreaLocality: "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    isActive: true,
  });
  const [newMechanicFiles, setNewMechanicFiles] = useState({ photo: null, aadhaarFront: null, aadhaarBack: null });

  const navigate = useNavigate();

  // Stable fetch functions
  const fetchMechanics = useCallback(async () => {
    try {
      const response = await apiService.getMechanics();
      setMechanics(response.data || []);
      console.log("Mechanics fetched:", response.data?. length || 0);
    } catch (error) {
      console.error("Error fetching mechanics:", error);
      setMechanics([]);
    }
  }, []);

  const fetchBookingsByLocation = useCallback(async () => {
    try {
      const response = await apiService.getBookingsByLocation();
      setBookingsByLocation(response.data || { locations: [], totalBookings: 0 });
    } catch (error) {
      console.error("Error fetching bookings by location:", error);
      setBookingsByLocation({ locations: [], totalBookings: 0 });
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await apiService.getAppointments();
      setAppointments(response.data || []);
      console.log("Appointments fetched:", response. data?.length || 0);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    }
  }, []);

  const fetchEmergencies = useCallback(async () => {
    try {
      const response = await apiService.getEmergencies();
      setEmergencies(response.data || []);
      console.log("Emergencies fetched:", response.data?.length || 0);
    } catch (error) {
      console.error("Error fetching emergencies:", error);
      setEmergencies([]);
    }
  }, []);

  const fetchInquiries = useCallback(async () => {
    try {
      const response = await apiService. getInquiries();
      setInquiries(response.data || []);
      console.log("Inquiries fetched:", response. data?.length || 0);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      setInquiries([]);
    }
  }, []);

  const fetchContactForms = useCallback(async () => {
  try {
    const response = await apiService.getContactForms();
    setContactForms(response.data || []);
    console.log("Contact forms fetched:", response.data?.length || 0);
  } catch (error) {
    console.error("Error fetching contact forms:", error);
    setContactForms([]);
  }
}, []);

  const fetchAllData = useCallback(async (showLoader = true) => {
  if (showLoader) setLoading(true);
  setError(null);
  try {
    await Promise.all([
      fetchAppointments(),
      fetchEmergencies(),
      fetchInquiries(),
      fetchMechanics(),
      fetchContactForms(),
      fetchBookingsByLocation(),
    ]);
    } catch (err) {
      console.error("Dashboard data loading error:", err);
      setError("Error loading dashboard data. Please refresh the page.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [fetchAppointments, fetchEmergencies, fetchInquiries, fetchMechanics, fetchContactForms, fetchBookingsByLocation]);

  // Helper to show notification
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Auth check and initial fetch
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      console.log("No admin token found, redirecting to login");
      navigate("/admin/login");
      return;
    }
    fetchAllData();
  }, [navigate, fetchAllData]);


  // Scroll Lock Effect
  useEffect(() => {
    if (viewDetails.show || showAssignModal || showCreateMechanicModal) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.height = "100%";
      document.documentElement.style.height = "100%";
    } else {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
      document.body.style.height = "unset";
      document.documentElement.style.height = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
      document.body.style.height = "unset";
      document.documentElement.style.height = "unset";
    };
  }, [viewDetails.show, showAssignModal, showCreateMechanicModal]);

  // Auto-update polling (30 seconds)
  const POLL_INTERVAL = 30000;
  const intervalRef = useRef(null);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      console.log("Auto-updating dashboard data...");
      fetchAllData(false); // No loader for background updates
    }, POLL_INTERVAL);
  }, [fetchAllData]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef. current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startPolling();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab visible:  refreshing data");
        fetchAllData(false);
        startPolling();
      } else {
        console.log("Tab hidden: stopping polling");
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startPolling, stopPolling, fetchAllData]);

  // Create New Mechanic
  const handleCreateMechanic = async (e) => {
    e.preventDefault();

    if (!newMechanic.name || !newMechanic.phone || !newMechanic.password || !newMechanic.city || !newMechanic.vehicleType) {
      setError("Please fill in all required fields");
      return;
    }

    const isArray = Array.isArray(newMechanic.specialization);
    const specializationValid = isArray
      ? newMechanic.specialization.length > 0
      : Boolean(newMechanic.specialization);

    if (!specializationValid) {
      setError("Please select at least one specialization");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(newMechanic).forEach(([key, value]) => {
        if (key === "specialization") {
          (isArray ? value : [value]).forEach((s) => fd.append("specialization", s));
        } else if (value !== "" && value !== null && value !== undefined) {
          fd.append(key, value);
        }
      });
      if (newMechanicFiles.photo) fd.append("photo", newMechanicFiles.photo);
      if (newMechanicFiles.aadhaarFront) fd.append("aadhaarFront", newMechanicFiles.aadhaarFront);
      if (newMechanicFiles.aadhaarBack) fd.append("aadhaarBack", newMechanicFiles.aadhaarBack);

      await apiService.registerMechanicWithFiles(fd);
      await fetchMechanics();
      setShowCreateMechanicModal(false);
      setNewMechanic({
        name: "", email: "", phone: "", password: "", specialization: [], vehicleType: "",
        experience: 0, city: "", dateOfBirth: "", gender: "", currentAddress: "", state: "",
        pinCode: "", aadhaarNumber: "", serviceAreaLocality: "", accountHolderName: "",
        bankName: "", accountNumber: "", ifscCode: "", isActive: true,
      });
      setNewMechanicFiles({ photo: null, aadhaarFront: null, aadhaarBack: null });
      showNotification("Mechanic created successfully!", "success");
    } catch (error) {
      console.error("Error creating mechanic:", error);
      setError(`Failed to create mechanic:  ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Assign Task to Mechanic
const handleAssignTask = async (mechanicId) => {
  try {
    setLoading(true);
    setError(null);

    // Check if task already has a mechanic assigned
    const previousMechanicId = selectedTask.assignedMechanic;

    await apiService.assignTask({
      mechanicId,
      taskId: selectedTask._id,
      taskType: selectedTask.taskType,
    });

    // If re-assigning (previous mechanic exists), remove task from old mechanic
    if (previousMechanicId && previousMechanicId !== mechanicId) {
      try {
        await apiService.unassignTask({
          mechanicId: previousMechanicId,
          taskId: selectedTask._id,
          taskType: selectedTask.taskType,
        });
        console.log(`✅ Task removed from previous mechanic:  ${previousMechanicId}`);
      } catch (err) {
        console.warn("Could not unassign from previous mechanic:", err);
      }
    }

    // Update emergency status to 'assigned' if it's an emergency
    if (selectedTask. taskType === "emergency") {
      try {
        await apiService.updateEmergency(selectedTask._id, { status: "assigned" });
      } catch (err) {
        console.warn("Could not update emergency status:", err);
      }
    }

    const actionText = previousMechanicId ? "✅ Mechanic re-assigned successfully!" : "✅ Task assigned successfully!";
    showNotification(actionText, "success");
    
    await fetchAllData(false);
    setShowAssignModal(false);
    setSelectedTask(null);
  } catch (error) {
    console.error("Error assigning task:", error);
    setError(`Assignment failed: ${error.response?.data?.message || error.message}`);
    showNotification(`Assignment failed: ${error.response?.data?.message || error.message}`, "error");
  } finally {
    setLoading(false);
  }
};
  // Update Status Functions
  const updateAppointmentStatus = async (id, status) => {
    try {
      setLoading(true);
      await apiService.updateAppointment(id, { status });
      await fetchAppointments();
    } catch (error) {
      console.error("Error updating appointment:", error);
      setError("Failed to update appointment status");
      showNotification("Failed to update appointment status", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateInquiryStatus = async (id, status) => {
    try {
      setLoading(true);
      await apiService.updateInquiry(id, { status });
      await fetchInquiries();
    } catch (error) {
      console.error("Error updating inquiry:", error);
      setError("Failed to update inquiry status");
      showNotification("Failed to update inquiry status", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateContactFormStatus = async (id, status) => {
  try {
    setLoading(true);
    await apiService. updateContactFormStatus(id, { status });
    await fetchContactForms();
  } catch (error) {
    console.error("Error updating contact form:", error);
    setError("Failed to update contact form status");
    showNotification("Failed to update contact form status", "error");
  } finally {
    setLoading(false);
  }
};

const updateEmergencyStatus = async (id, status) => {
  try {
    setLoading(true);
    await apiService. updateEmergency(id, { status });
    await fetchEmergencies();
  } catch (error) {
    console.error("Error updating emergency:", error);
    setError("Failed to update emergency status");
    showNotification("Failed to update emergency status", "error");
  } finally {
    setLoading(false);
  }
};

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/admin/login");
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-IN");
    } catch {
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute:  '2-digit',
    hour12: true
  });
};

  // Enhanced Assign Modal Component
  const EnhancedAssignModal = () => {
    if (!showAssignModal || !selectedTask) return null;

    const getFilteredMechanics = () => {
      return mechanics
        .filter((mechanic) => {
          if (mechanic.availability !== "available") return false;

          const requiredSpecializations =
            selectedTask.taskType === "appointment"
              ? ["doorstep-service"]
              : ["emergency-repair"];

          const hasRequiredSkill = mechanic.specialization?. some((spec) =>
            requiredSpecializations.includes(spec)
          );

          return hasRequiredSkill;
        })
        .sort((a, b) => {
          if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0);
          return (b.experience || 0) - (a.experience || 0);
        });
    };

    const filteredMechanics = getFilteredMechanics();

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-4 mx-2 sm:mx-4 md:mx-auto p-3 sm:p-4 md:p-5 border w-full sm:w-11/12 md:w-5/6 lg:w-4/6 xl:w-1/2 2xl:max-w-4xl shadow-lg rounded-md bg-white min-h-screen sm:min-h-0 sm:top-8 md:top-12 lg:top-20">
          <div className="mt-0 sm:mt-3">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-medium text-gray-900">
                Assign Mechanic to Task
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedTask(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Task Details Card */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Task Details</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Type:</span> {selectedTask.taskType?. toUpperCase()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Service:</span>{" "}
                    {selectedTask.taskType === "appointment"
                      ? selectedTask.serviceType
                      : selectedTask.issueDescription}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Customer:</span> {selectedTask.name}
                  </p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {selectedTask.phone}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Location:</span>{" "}
                    {selectedTask.address || selectedTask.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-3 sm:mb-4 bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 flex items-start">
                <div className="text-red-500 mr-2 mt-0.5 text-sm sm:text-base">⚠️</div>
                <div className="flex-1">
                  <p className="text-red-600 text-xs sm:text-sm">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 ml-2 text-lg"
                >
                  ×
                </button>
              </div>
            )}

            {/* Available Mechanics Grid */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                Available Mechanics ({filteredMechanics.length})
              </h4>

              {filteredMechanics.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-[60vh] sm:max-h-96 overflow-y-auto">
                  {filteredMechanics.map((mechanic) => (
                    <div
                      key={mechanic._id}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200"
                      onClick={() => handleAssignTask(mechanic._id)}
                    >
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {mechanic.name}
                          </h5>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{mechanic.email}</p>
                          <p className="text-xs sm:text-sm text-gray-500">{mechanic.phone}</p>
                        </div>
                        <div className="flex flex-col items-end ml-2">
                          <span className="inline-flex px-1. 5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mb-1">
                            AVAILABLE
                          </span>
                          <div className="flex items-center">
                            <span className="text-yellow-400 text-xs sm:text-sm">⭐</span>
                            <span className="ml-1 text-xs sm:text-sm text-gray-600">
                              {mechanic.rating || 0}/5
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-2 sm:mb-3 space-y-1">
                        <p className="text-xs sm:text-sm text-gray-600">
                          <span className="font-medium">Experience:</span> {mechanic.experience} years
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          <span className="font-medium">Location:</span> {mechanic.location?. city}
                        </p>
                      </div>

                      <div className="mb-2 sm:mb-3">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">Specializations:</p>
                        <div className="flex flex-wrap gap-1">
                          {mechanic.specialization?.map((spec, index) => (
                            <span
                              key={index}
                              className="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                            >
                              {spec. replace("-", " ")}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 space-y-1">
                        <p>
                          Active Tasks:{" "}
                          {mechanic.assignedTasks?.filter(
                            (t) => t.status === "assigned" || t.status === "in-progress"
                          ).length || 0}
                        </p>
                        <p>Completed:  {mechanic.completedTasks || 0}</p>
                      </div>

                      <div className="pt-2 sm:pt-3 border-t border-gray-200">
                        <button
                          disabled={loading}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {loading ? "Assigning..." : "Assign This Mechanic"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-. 656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 4 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Available Mechanics</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500 px-4">
                    No mechanics are currently available with the required skills for this task.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading State
  if (loading && appointments.length === 0 && emergencies.length === 0 && inquiries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-base sm:text-lg text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const SIDEBAR_ITEMS = [
    { key: "dashboardHome", label: "Dashboard", icon: "🏠" },
    { key: "__addMechanic", label: "Add Mechanic", icon: "➕" },
    { key: "mechanics", label: "Mechanic", icon: "🧑‍🔧" },
    { key: "AllBookings", label: "Booking", icon: "📋" },
    { key: "billing", label: "Billing", icon: "💳" },
    { key: "fleetMap", label: "Fleet Inventory", icon: "🗺️" },
    { key: "reports", label: "Reports", icon: "📊" },
    { key: "settings", label: "Setting", icon: "⚙️" },
  ];

  const pendingAlertsCount =
    emergencies.filter((e) => e.status !== "completed").length +
    appointments.filter((a) => a.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 bg-gray-900 text-white min-h-screen sticky top-0 self-start">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
          <img src="/images/Admin-Logo.jpeg" className="w-9 h-9 rounded object-cover" alt="logo" />
          <span className="font-bold text-lg tracking-wide">ROADENGO</span>
        </div>
        <nav className="flex-1 py-4">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = item.key !== "__addMechanic" && activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  if (item.key === "__addMechanic") {
                    setShowCreateMechanicModal(true);
                    return;
                  }
                  setActiveTab(item.key);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors text-left ${
                  isActive ? "bg-red-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-40">
          <div className="flex items-center gap-2 md:hidden">
            <img src="/images/Admin-Logo.jpeg" className="w-8 h-8 rounded object-cover" alt="logo" />
            <span className="font-bold text-gray-900 text-sm">ROADENGO</span>
          </div>
          <h2 className="hidden md:block text-lg font-bold text-gray-800">
            {SIDEBAR_ITEMS.find((i) => i.key === activeTab)?.label || "Dashboard"}
          </h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-blue-600 hover:text-blue-800 font-medium text-xs sm:text-sm hidden sm:inline"
            >
              View Website
            </button>
            <button className="relative text-gray-500 hover:text-gray-700" title="Notifications">
              <span className="text-xl">🔔</span>
              {pendingAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingAlertsCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm">
                A
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-800">Admin</span>
            </div>
            <button
              onClick={handleLogout}
              className="md:hidden bg-red-600 text-white px-2 py-1.5 rounded-lg text-xs font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 flex justify-between items-center text-sm">
            <span className="flex-1 min-w-0 truncate">{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-2 text-lg">
              ×
            </button>
          </div>
        )}

        {/* Booking Overview — All Time + Today, matching the dashboard mockup */}
        {activeTab === "dashboardHome" && (() => {
          const todayStr = new Date().toDateString();
          const isToday = (d) => d && new Date(d).toDateString() === todayStr;
          const totalCompleted = appointments.filter(a => a.status === "completed").length;
          const totalCancelled = appointments.filter(a => a.status === "cancelled").length;
          const totalBilling = appointments.reduce((sum, a) => sum + (a.status === "completed" ? (a.cost || 0) : 0), 0);
          const todayBookings = appointments.filter(a => isToday(a.createdAt)).length;
          const todayCompleted = appointments.filter(a => a.status === "completed" && isToday(a.updatedAt)).length;
          const todayCancelled = appointments.filter(a => a.status === "cancelled" && isToday(a.updatedAt)).length;
          const todayBilling = appointments.reduce((sum, a) => sum + (a.status === "completed" && isToday(a.updatedAt) ? (a.cost || 0) : 0), 0);

          const pending = appointments.filter(a => a.status === "pending").length;
          const assigned = appointments.filter(a => a.status === "confirmed").length;
          const inProgress = appointments.filter(a => a.status === "in-progress").length;
          const activeBookings = pending + assigned + inProgress;

          const goToAppointments = (statusFilter) => {
            setActiveTab("appointments");
            setAppointmentStatusFilter(statusFilter);
          };

          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-3">
                <DashStat icon="📅" label="Total Bookings" sub="All Time" value={appointments.length} color="text-blue-600" onClick={() => goToAppointments("all")} />
                <DashStat icon="✅" label="Total Completed Vehicles" sub="All Time" value={totalCompleted} color="text-green-600" onClick={() => goToAppointments(STATUS.COMPLETED)} />
                <DashStat icon="❌" label="Total Cancel Booking" sub="All Time" value={totalCancelled} color="text-red-600" onClick={() => goToAppointments("cancelled")} />
                <DashStat icon="💰" label="Total Billing" sub="All Time" value={`₹${totalBilling}`} color="text-yellow-600" />
                <DashStat icon="👥" label="Total Mechanics" sub="All Time" value={mechanics.length} color="text-purple-600" onClick={() => setActiveTab("mechanics")} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
                <DashStat icon="📅" label="Today Bookings" sub="Today" value={todayBookings} color="text-blue-600" onClick={() => goToAppointments("all")} />
                <DashStat icon="✅" label="Today Completed Vehicle" sub="Today" value={todayCompleted} color="text-green-600" onClick={() => goToAppointments(STATUS.COMPLETED)} />
                <DashStat icon="❌" label="Today Cancel Booking" sub="Today" value={todayCancelled} color="text-red-600" onClick={() => goToAppointments("cancelled")} />
                <DashStat icon="💰" label="Today Billing" sub="Today" value={`₹${todayBilling}`} color="text-yellow-600" />
                <DashStat icon="👤" label="Available Mechanics" sub="Today" value={mechanics.filter(m => m.availability === "available").length} color="text-green-600" onClick={() => setActiveTab("mechanics")} />
              </div>

              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Job Status Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
                <DashStat icon="📋" label="Active Bookings" value={activeBookings} color="text-blue-600" small onClick={() => goToAppointments("all")} />
                <DashStat icon="⏳" label="Pending" value={pending} color="text-yellow-600" small onClick={() => goToAppointments(STATUS.PENDING)} />
                <DashStat icon="📍" label="Assign" value={assigned} color="text-purple-600" small onClick={() => goToAppointments(STATUS.CONFIRMED)} />
                <DashStat icon="🛵" label="On The Way" value={assigned} color="text-indigo-600" small onClick={() => goToAppointments(STATUS.CONFIRMED)} />
                <DashStat icon="🔧" label="Service In Progress" value={inProgress} color="text-orange-600" small onClick={() => goToAppointments(STATUS.IN_PROGRESS)} />
                <DashStat icon="🏁" label="Service Completed" value={totalCompleted} color="text-green-600" small onClick={() => goToAppointments(STATUS.COMPLETED)} />
              </div>

              {/* Real-time Bookings Table */}
              <div className="bg-white rounded-lg shadow border border-gray-100 mb-8 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-700">Recent Bookings</h2>
                  <button
                    onClick={() => setActiveTab("AllBookings")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Booking Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assign Mechanic</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...appointments]
                        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                        .slice(0, 10)
                        .map((a) => (
                          <tr key={a._id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{a.name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-gray-600">{a.phone}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-gray-600">{a.bikeModel || "-"}</td>
                            <td className="px-4 py-2 text-gray-600 max-w-[160px] truncate">{a.address}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-gray-600">{a.serviceType}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-xs">{formatDateTime(a.createdAt)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-gray-600">{a.assignedMechanic?.name || "—"}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-xs">
                              {a.serviceDate ? `${formatDate(a.serviceDate)} ${a.serviceTime || ""}` : "—"}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                  a.status === STATUS.PENDING
                                    ? "bg-yellow-100 text-yellow-800"
                                    : a.status === STATUS.CONFIRMED
                                    ? "bg-blue-100 text-blue-800"
                                    : a.status === STATUS.IN_PROGRESS
                                    ? "bg-purple-100 text-purple-800"
                                    : a.status === STATUS.COMPLETED
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {a.status?.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      {appointments.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-6 text-center text-gray-400 text-sm">
                            No bookings yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Mechanics Map */}
              <div className="bg-white rounded-lg shadow border border-gray-100 mb-8 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-700">Live Mechanics Map</h2>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#16a34a" }}></span>Online</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#dc2626" }}></span>Busy</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#9ca3af" }}></span>Offline</span>
                  </div>
                </div>
                <FleetMapView mechanics={mechanics} />
              </div>
            </>
          );
        })()}

        {/* Billing Section */}
        {activeTab === "billing" && (() => {
          const completed = appointments.filter((a) => a.status === "completed");
          const totalBilling = completed.reduce((sum, a) => sum + (a.cost || 0), 0);
          const todayStr = new Date().toDateString();
          const todayBilling = completed
            .filter((a) => a.updatedAt && new Date(a.updatedAt).toDateString() === todayStr)
            .reduce((sum, a) => sum + (a.cost || 0), 0);
          return (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <DashStat label="Total Billing" sub="All Time" value={`₹${totalBilling}`} color="text-yellow-600" />
                <DashStat label="Today Billing" sub="Today" value={`₹${todayBilling}`} color="text-yellow-600" />
                <DashStat label="Billed Jobs" sub="Completed" value={completed.length} color="text-green-600" />
              </div>
              <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mechanic</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {completed.map((a) => (
                        <tr key={a._id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{a.name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-600">{a.assignedMechanic?.name || "—"}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-600">{a.serviceType}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-xs">{formatDateTime(a.completedAt)}</td>
                          <td className="px-4 py-2 whitespace-nowrap font-semibold text-gray-900">₹{a.cost || 0}</td>
                        </tr>
                      ))}
                      {completed.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">
                            No billed jobs yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Reports Section */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-lg shadow border border-gray-100 p-8 text-center text-gray-500">
            <p className="text-sm">Detailed analytics reports are coming soon.</p>
          </div>
        )}

        {/* Setting Section */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-lg shadow border border-gray-100 p-8 text-center text-gray-500">
            <p className="text-sm">Account &amp; app settings are coming soon.</p>
          </div>
        )}

        {/* Tabs */}
        {activeTab !== "dashboardHome" && activeTab !== "billing" && activeTab !== "reports" && activeTab !== "settings" && (
        <div className="mb-4 sm:mb-6">
          <nav className="flex flex-wrap gap-1 sm:gap-2 md:gap-4">
            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-2 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm ${
                activeTab === "appointments"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="hidden sm:inline">Appointments </span>
              <span className="sm:hidden">Apt </span>
              ({appointments.filter(a => a.status !== "completed").length})
            </button>
            <button
              onClick={() => setActiveTab("emergencies")}
              className={`px-2 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm ${
                activeTab === "emergencies"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="hidden sm:inline">Emergencies </span>
              <span className="sm:hidden">Emg </span>
              ({emergencies.filter(e => e.status !== "completed").length})
            </button>
            <button
              onClick={() => setActiveTab("inquiries")}
              className={`px-2 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm ${
                activeTab === "inquiries"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="hidden sm:inline">Cart </span>Inquiries ({inquiries.filter(a => a.status !== "completed").length})
            </button>
            <button
              onClick={() => setActiveTab("mechanics")}
              className={`px-2 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm ${
                activeTab === "mechanics"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Mechanics ({mechanics.length})
            </button>
            <button
              onClick={() => setActiveTab("AllBookings")}
              className={`px-2 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm ${
                activeTab === "AllBookings"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All Bookings
            </button>
            <button
              onClick={() => setActiveTab("fleetMap")}
              className={`px-2 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm ${
                activeTab === "fleetMap"
                  ? "bg-blue-700 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Fleet Map
            </button>
            <button
              onClick={() => setActiveTab("bookingsMap")}
              className={`px-2 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm ${
                activeTab === "bookingsMap"
                  ? "bg-blue-700 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Bookings Map
            </button>
          </nav>
        </div>
        )}

        {/* Loading Indicator for Updates */}
        {loading && (
          <div className="fixed top-4 right-4 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg shadow-lg z-50 text-xs sm:text-sm">
            Updating... 
          </div>
        )}

        {/* MECHANICS TAB */}
        {activeTab === "mechanics" && selectedMechanicId && (() => {
          const mechanic = mechanics.find((m) => m._id === selectedMechanicId);
          if (!mechanic) {
            setSelectedMechanicId(null);
            return null;
          }
          return (
            <MechanicProfileView
              mechanic={mechanic}
              appointments={appointments}
              onBack={() => setSelectedMechanicId(null)}
              onRefresh={fetchMechanics}
              showNotification={showNotification}
            />
          );
        })()}

        {activeTab === "mechanics" && !selectedMechanicId && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Mobile Card View */}
            <div className="block md:hidden">
              <div className="space-y-4 p-4">
                {mechanics.map((mechanic) => (
                  <div key={mechanic._id} onClick={() => setSelectedMechanicId(mechanic._id)} className="border border-gray-200 rounded-lg p-4 space-y-3 cursor-pointer hover:border-red-300">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{mechanic.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{mechanic.email}</p>
                        <p className="text-sm text-gray-500">{mechanic.phone}</p>
                        <p className="text-xs text-gray-400">ID: {mechanic.mechanicId}</p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          mechanic.availability === "available"
                            ? "bg-green-100 text-green-800"
                            : mechanic.availability === "busy"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {mechanic.availability?. toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Experience</p>
                        <p className="text-sm font-medium">{mechanic.experience} years</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Rating</p>
                        <div className="flex items-center">
                          <span className="text-yellow-400 text-sm">⭐</span>
                          <span className="ml-1 text-sm">{mechanic.rating || 0}/5</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Specializations</p>
                      <div className="flex flex-wrap gap-1">
                        {mechanic.specialization?. map((spec, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                          >
                            {spec. replace("-", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Active Tasks</p>
                        <p className="text-sm font-medium">
                          {mechanic.assignedTasks?.filter(
                            (t) => t.status === "assigned" || t.status === "in-progress"
                          ).length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Completed</p>
                        <p className="text-sm font-medium">{mechanic.completedTasks || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mechanic Details
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Availability
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasks
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mechanics. map((mechanic) => (
                    <tr key={mechanic._id} onClick={() => setSelectedMechanicId(mechanic._id)} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-semibold text-gray-900">{mechanic.name}</div>
                          <div className="text-sm text-gray-600">{mechanic.email}</div>
                          <div className="text-sm text-gray-500">{mechanic.phone}</div>
                          <div className="text-xs text-gray-400">ID:  {mechanic.mechanicId}</div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {mechanic.specialization?. map((spec, index) => (
                            <span
                              key={index}
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                            >
                              {spec.replace("-", " ")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{mechanic.experience} years</div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            mechanic.availability === "available"
                              ? "bg-green-100 text-green-800"
                              : mechanic.availability === "busy"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {mechanic.availability?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Active:{" "}
                          {mechanic.assignedTasks?. filter(
                            (t) => t.status === "assigned" || t.status === "in-progress"
                          ).length || 0}
                        </div>
                        <div className="text-sm text-gray-500">
                          Completed:  {mechanic.completedTasks || 0}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-yellow-400">⭐</span>
                          <span className="ml-1 text-sm text-gray-900">
                            {mechanic.rating || 0}/5
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {mechanics.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No mechanics found. Create one to get started. 
              </div>
            )}
          </div>
        )}

        {/* APPOINTMENTS TAB */}
{activeTab === "appointments" && (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
    
    {/* Status Filter Sub-tabs */}
    <div className="border-b border-gray-200 bg-gray-50 p-3 sm:p-4">
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "All Active", color: "gray" },
          { id: STATUS.PENDING, label: "Pending", color: "yellow" },
          { id:  STATUS.CONFIRMED, label: "Confirmed", color: "blue" },
          { id: STATUS. IN_PROGRESS, label: "In Progress", color: "purple" },
          { id: STATUS. COMPLETED, label: "Completed", color: "green" }
        ].map((filter) => {
          // Count logic
          const activeAppointments = filter.id === STATUS. COMPLETED 
            ? appointments. filter(a => a.status === "completed")
            : appointments. filter(a => a.status !== "completed");
          
          const count = filter.id === "all" 
            ? activeAppointments.length 
            : appointments. filter(a => a.status === filter.id).length;
          
          return (
            <button
              key={filter.id}
              onClick={() => setAppointmentStatusFilter(filter.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                appointmentStatusFilter === filter. id
                  ? filter.id === STATUS.PENDING
                    ? "bg-yellow-600 text-white"
                    :  filter.id === STATUS.CONFIRMED
                    ? "bg-blue-600 text-white"
                    : filter.id === STATUS.IN_PROGRESS
                    ? "bg-purple-600 text-white"
                    :  filter.id === STATUS.COMPLETED
                    ? "bg-green-600 text-white"
                    : "bg-gray-600 text-white"
                  :  "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {filter.label} ({count})
            </button>
          );
        })}
      </div>
    </div>

    {/* Filtering Logic Wrapper */}
    {(() => {
      // Filter appointments based on selected tab
      let filteredAppointments;
      
      if (appointmentStatusFilter === "all") {
        // Show only non-completed (active) appointments
        filteredAppointments = appointments.filter(a => a.status !== "completed");
      } else if (appointmentStatusFilter === STATUS.COMPLETED) {
        // Show only completed appointments
        filteredAppointments = appointments.filter(a => a.status === "completed");
      } else {
        // Show specific status
        filteredAppointments = appointments.filter(a => a.status === appointmentStatusFilter);
      }

      return (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            <div className="space-y-4 p-4">
              {filteredAppointments.map((appointment) => (
                <div 
                  key={appointment._id} 
                  className={`border-2 rounded-lg p-4 space-y-3 ${
                    appointment.status === 'completed' 
                      ? 'bg-green-50 border-green-200' 
                      : 'border-gray-200'
                  }`}
                >
                  
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{appointment.name}</h3>
                      <p className="text-sm text-gray-600">{appointment.phone}</p>
                      <p className="text-sm text-gray-500 truncate">{appointment.email}</p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        appointment.status === STATUS.PENDING
                          ? "bg-yellow-100 text-yellow-800"
                          :  appointment.status === STATUS.CONFIRMED
                          ? "bg-blue-100 text-blue-800"
                          : appointment.status === STATUS.IN_PROGRESS
                          ? "bg-purple-100 text-purple-800"
                          : appointment.status === STATUS.COMPLETED
                          ?  "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {appointment.status?. toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Service</p>
                      <p className="text-sm font-medium">{appointment.serviceType}</p>
                      <p className="text-sm text-gray-600">{appointment.bikeModel}</p>
                    </div>
                    
                    {/* Show Service Date/Time for non-completed */}
                    {appointment.status !== 'completed' && (
                      <div>
                        <p className="text-xs text-gray-500">Scheduled Service</p>
                        <p className="text-sm font-medium">{formatDate(appointment.serviceDate)}</p>
                        <p className="text-sm text-gray-600">{appointment.serviceTime}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm text-gray-600 truncate">{appointment.address}</p>
                    </div>
                    
                    {/* ✅ SHOW BOOKING TIME */}
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700">⏰ Booking Time</p>
                      <p className="text-sm text-blue-900">{formatDateTime(appointment.createdAt)}</p>
                    </div>
                    
                    {/* ✅ SHOW COMPLETED TIME (if completed) */}
                    {appointment.status === 'completed' && appointment.completedAt && (
                      <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs font-semibold text-green-700">✅ Completed Time</p>
                        <p className="text-sm text-green-900">{formatDateTime(appointment.completedAt)}</p>
                      </div>
                    )}
                    
                    {/* ⚠️ Warning if completed but no timestamp */}
                    {appointment. status === 'completed' && ! appointment.completedAt && (
                      <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs text-red-600">⚠️ Completed but timestamp missing</p>
                      </div>
                    )}
                    
                    {appointment.assignedMechanic && (
                      <div>
                        <p className="text-xs text-gray-500">Assigned Mechanic</p>
                        <p className="text-sm font-medium">
                          {appointment?. assignedMechanic?.name || "Unknown"}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* ✅ ACTIONS - Only show Assign button for non-completed without mechanic */}
                  {appointment.status !== 'completed' && ! appointment.assignedMechanic && (
                    <div className="pt-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSelectedTask({ ...appointment, taskType: "appointment" });
                          setShowAssignModal(true);
                          setError(null);
                        }}
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
                      >
                        Assign Mechanic
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Details
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamps
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Mechanic
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr 
                    key={appointment._id} 
                    className={`hover:bg-gray-50 ${
                      appointment.status === 'completed' ?  'bg-green-50' : ''
                    }`}
                  >
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-gray-900">{appointment.name}</div>
                        <div className="text-sm text-gray-600">{appointment.phone}</div>
                        <div className="text-sm text-gray-500">{appointment.email}</div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{appointment.serviceType}</div>
                        <div className="text-sm text-gray-600">{appointment.bikeModel}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{appointment. address}</div>
                        {appointment.status !== 'completed' && (
                          <div className="text-xs text-blue-600 mt-1">
                            📅 Scheduled: {formatDate(appointment.serviceDate)} {appointment.serviceTime}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* ✅ NEW COLUMN:  Timestamps */}
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">⏰ Booked</p>
                          <p className="text-sm text-gray-900">{formatDateTime(appointment.createdAt)}</p>
                        </div>
                        {appointment.status === 'completed' && appointment.completedAt && (
                          <div>
                            <p className="text-xs text-green-600 font-semibold">✅ Completed</p>
                            <p className="text-sm text-green-700">{formatDateTime(appointment.completedAt)}</p>
                          </div>
                        )}
                        {appointment.status === 'completed' && !appointment.completedAt && (
                          <div>
                            <p className="text-xs text-red-600">⚠️ Missing timestamp</p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          appointment.status === STATUS. PENDING
                            ? "bg-yellow-100 text-yellow-800"
                            : appointment. status === STATUS.CONFIRMED
                            ? "bg-blue-100 text-blue-800"
                            : appointment.status === STATUS.IN_PROGRESS
                            ? "bg-purple-100 text-purple-800"
                            : appointment.status === STATUS. COMPLETED
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {appointment.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {appointment.assignedMechanic ?  (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {appointment?.assignedMechanic?.name || "Unknown"}
                          </div>
                          <div className="text-gray-500">Assigned</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {/* ✅ ONLY SHOW ASSIGN BUTTON - NO DROPDOWN */}
                      {appointment. status !== 'completed' && ! appointment.assignedMechanic && (
                        <button
                          onClick={() => {
                            setSelectedTask({ ...appointment, taskType: "appointment" });
                            setShowAssignModal(true);
                            setError(null);
                          }}
                          disabled={loading}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                        >
                          Assign Mechanic
                        </button>
                      )}
                      {appointment.status === 'completed' && (
                        <span className="text-xs text-green-600 font-medium">✅ Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredAppointments.length === 0 && ! loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {appointmentStatusFilter === STATUS.PENDING ?  "⏳" : 
                 appointmentStatusFilter === STATUS. CONFIRMED ? "✅" : 
                 appointmentStatusFilter === STATUS.IN_PROGRESS ? "🔧" : 
                 appointmentStatusFilter === STATUS.COMPLETED ?  "✅" : "📅"}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No {appointmentStatusFilter !== "all" ? appointmentStatusFilter. charAt(0).toUpperCase() + appointmentStatusFilter.slice(1).replace("-", " ") : "Active"} Appointments
              </h3>
              <p className="text-gray-600">
                {appointmentStatusFilter === "all" 
                  ? "No active appointments found"
                  : appointmentStatusFilter === STATUS.COMPLETED
                  ? "No completed appointments yet"
                  : `No ${appointmentStatusFilter. replace("-", " ")} appointments found`}
              </p>
            </div>
          )}
        </>
      );
    })()}
  </div>
)}

       {/* EMERGENCIES TAB */}
{activeTab === "emergencies" && (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
    
    {/* Status Filter Sub-tabs */}
    <div className="border-b border-gray-200 bg-gray-50 p-3 sm:p-4">
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "All Active", color: "gray" },
          { id: "pending", label: "Pending", color: "yellow" },
          { id: "assigned", label: "Assigned", color: "blue" },
          { id: "in-progress", label: "In Progress", color: "purple" },
          { id: "completed", label: "Completed", color: "green" }  // ✅ ADDED
        ].map((filter) => {
          // Count logic
          const activeEmergencies = filter.id === "completed" 
            ? emergencies.filter(e => e. status === "completed")
            : emergencies.filter(e => e.status !== "completed");
          
          const count = filter.id === "all" 
            ? activeEmergencies.length 
            : emergencies.filter(e => (e.status || "pending") === filter.id).length;
          
          return (
            <button
              key={filter. id}
              onClick={() => setEmergencyStatusFilter(filter.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                emergencyStatusFilter === filter.id
                  ? filter.id === "pending"
                    ? "bg-yellow-600 text-white"
                    : filter.id === "assigned"
                    ? "bg-blue-600 text-white"
                    :  filter.id === "in-progress"
                    ? "bg-purple-600 text-white"
                    : filter.id === "completed"
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {filter.label} ({count})
            </button>
          );
        })}
      </div>
    </div>

    {(() => {
      // ✅ UPDATED FILTER LOGIC
      let filteredEmergencies;
      
      if (emergencyStatusFilter === "all") {
        // Show only non-completed (active) emergencies
        filteredEmergencies = emergencies.filter(e => e. status !== "completed");
      } else if (emergencyStatusFilter === "completed") {
        // Show only completed emergencies
        filteredEmergencies = emergencies.filter(e => e.status === "completed");
      } else {
        // Show specific status
        filteredEmergencies = emergencies.filter(e => (e.status || "pending") === emergencyStatusFilter);
      }

      return (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            <div className="space-y-4 p-4">
              {filteredEmergencies.map((emergency) => (
                <div 
                  key={emergency._id} 
                  className={`border-2 rounded-lg p-4 space-y-3 ${
                    emergency.status === 'completed' 
                      ? 'bg-green-50 border-green-200' 
                      :  'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{emergency.name}</h3>
                      <p className="text-sm text-gray-600">{emergency.phone}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        EMERGENCY
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (emergency.status || "pending") === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : (emergency.status || "pending") === "assigned"
                            ? "bg-blue-100 text-blue-800"
                            :  (emergency.status || "pending") === "in-progress"
                            ? "bg-purple-100 text-purple-800"
                            : (emergency.status || "pending") === "completed"
                            ? "bg-green-100 text-green-800"
                            :  "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {(emergency.status || "pending").toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Bike Model</p>
                      <p className="text-sm font-medium">{emergency.bikeModel}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Issue</p>
                      <p className="text-sm text-gray-600">{emergency. issueDescription}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm text-gray-600 truncate">{emergency.location}</p>
                    </div>
                    
                    {/* ✅ SHOW BOOKING TIME */}
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700">⏰ Booking Time</p>
                      <p className="text-sm text-blue-900">{formatDateTime(emergency.createdAt)}</p>
                    </div>
                    
                    {/* ✅ SHOW COMPLETED TIME (if completed) */}
                    {emergency.status === 'completed' && emergency.completedAt && (
                      <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs font-semibold text-green-700">✅ Completed Time</p>
                        <p className="text-sm text-green-900">{formatDateTime(emergency.completedAt)}</p>
                      </div>
                    )}
                    
                    {emergency.assignedMechanic && (
                      <div>
                        <p className="text-xs text-gray-500">Assigned Mechanic</p>
                        <p className="text-sm font-medium text-blue-600">
                          {mechanics.find(m => m._id === emergency.assignedMechanic)?.name || "Unknown"}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Show assign button only for non-completed emergencies */}
                  {emergency.status !== 'completed' && ! emergency.assignedMechanic && (
                    <div className="pt-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSelectedTask({ ...emergency, taskType: "emergency" });
                          setShowAssignModal(true);
                          setError(null);
                        }}
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
                      >
                        Assign Mechanic
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Details
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamps
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Mechanic
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmergencies.map((emergency) => (
                  <tr 
                    key={emergency._id} 
                    className={`hover:bg-gray-50 ${
                      emergency.status === 'completed' ?  'bg-green-50' : ''
                    }`}
                  >
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-gray-900">{emergency.name}</div>
                        <div className="text-sm text-gray-600">{emergency.phone}</div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{emergency.bikeModel}</div>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {emergency.issueDescription}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {emergency.location}
                      </div>
                    </td>
                    {/* ✅ NEW COLUMN:  Timestamps */}
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">⏰ Booked</p>
                          <p className="text-sm text-gray-900">{formatDateTime(emergency.createdAt)}</p>
                        </div>
                        {emergency.status === 'completed' && emergency.completedAt && (
                          <div>
                            <p className="text-xs text-green-600 font-semibold">✅ Completed</p>
                            <p className="text-sm text-green-700">{formatDateTime(emergency.completedAt)}</p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (emergency.status || "pending") === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            :  (emergency.status || "pending") === "assigned"
                            ?  "bg-blue-100 text-blue-800"
                            : (emergency.status || "pending") === "in-progress"
                            ? "bg-purple-100 text-purple-800"
                            : (emergency.status || "pending") === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {(emergency.status || "pending").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {emergency.assignedMechanic ?  (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {mechanics.find((m) => m._id === emergency.assignedMechanic)?.name || "Unknown"}
                          </div>
                          <div className="text-gray-500">Assigned</div>
                        </div>
                      ) : (
                        <span className="text-sm text-red-600 font-medium">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {emergency.status !== 'completed' && ! emergency.assignedMechanic && (
                        <button
                          onClick={() => {
                            setSelectedTask({ ...emergency, taskType: "emergency" });
                            setShowAssignModal(true);
                            setError(null);
                          }}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                        >
                          Assign Mechanic
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredEmergencies.length === 0 && ! loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {emergencyStatusFilter === "pending" ? "⏳" : 
                 emergencyStatusFilter === "assigned" ? "👨‍🔧" : 
                 emergencyStatusFilter === "in-progress" ? "🔧" : 
                 emergencyStatusFilter === "completed" ? "✅" : "📋"}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No {emergencyStatusFilter !== "all" ?  emergencyStatusFilter. charAt(0).toUpperCase() + emergencyStatusFilter.slice(1).replace("-", " ") : "Active"} Emergencies
              </h3>
              <p className="text-gray-600">
                {emergencyStatusFilter === "all" 
                  ? "No active emergency requests"
                  : emergencyStatusFilter === "completed"
                  ? "No completed emergencies yet"
                  : `No ${emergencyStatusFilter.replace("-", " ")} emergencies found`}
              </p>
            </div>
          )}
        </>
      );
    })()}
  </div>
)}

        {/* INQUIRIES TAB - COMPLETE IMPLEMENTATION */}
{activeTab === "inquiries" && (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
    
    {/* Status Filter Sub-tabs */}
    <div className="border-b border-gray-200 bg-gray-50 p-3 sm:p-4">
      <div className="flex flex-wrap gap-2">
        {[
          { id:  "all", label: "All Inquiries", color: "gray" },
          { id: STATUS.PENDING, label: "Pending", color: "yellow" },
          { id: STATUS. CONTACTED, label: "Contacted", color: "blue" },
          { id: STATUS.QUOTED, label: "Quoted", color: "purple" },
          { id: STATUS.COMPLETED, label: "Completed", color: "green" },
          { id: STATUS. CANCELLED, label: "Cancelled", color: "red" }
        ].map((filter) => {
          const count = filter.id === "all" 
            ? inquiries.length 
            : inquiries.filter(i => i.status === filter.id).length;
          
          return (
            <button
              key={filter.id}
              onClick={() => setInquiryStatusFilter(filter.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                inquiryStatusFilter === filter.id
                  ? filter. id === STATUS.PENDING
                    ? "bg-yellow-600 text-white"
                    : filter. id === STATUS.CONTACTED
                    ? "bg-blue-600 text-white"
                    : filter.id === STATUS. QUOTED
                    ? "bg-purple-600 text-white"
                    : filter.id === STATUS.COMPLETED
                    ?  "bg-green-600 text-white"
                    : filter.id === STATUS.CANCELLED
                    ? "bg-red-600 text-white"
                    : "bg-green-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {filter.label} ({count})
            </button>
          );
        })}
      </div>
    </div>

    {(() => {
      // Filter inquiries based on selected status
      const filteredInquiries = inquiryStatusFilter === "all"
        ? inquiries
        : inquiries.filter(i => i. status === inquiryStatusFilter);

      return (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            <div className="space-y-4 p-4">
              {filteredInquiries.map((inquiry) => (
                <div key={inquiry._id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{inquiry.name}</h3>
                      <p className="text-sm text-gray-600">{inquiry.phone}</p>
                      <p className="text-sm text-gray-500 truncate">{inquiry.email}</p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        inquiry.status === STATUS.PENDING
                          ? "bg-yellow-100 text-yellow-800"
                          : inquiry.status === STATUS.CONTACTED
                          ?  "bg-blue-100 text-blue-800"
                          : inquiry.status === STATUS. QUOTED
                          ? "bg-purple-100 text-purple-800"
                          : inquiry. status === STATUS.COMPLETED
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {inquiry.status?. toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Cart Items</p>
                      <p className="text-sm font-medium">{inquiry.itemCount || inquiry.cartItems?. length || 0} items</p>
                      <div className="text-xs text-gray-600 space-y-1 mt-1">
                        {inquiry.cartItems && inquiry.cartItems.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="truncate mr-2">{item.name}</span>
                            <span>x{item.quantity}</span>
                          </div>
                        ))}
                        {inquiry.cartItems && inquiry.cartItems.length > 2 && (
                          <div className="text-gray-500">+{inquiry.cartItems.length - 2} more items... </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="text-lg font-bold text-green-600">₹{inquiry.totalAmount}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm text-gray-600">{formatDateTime(inquiry.createdAt)}</p>
                    </div>
                    
                    {inquiry.address && (
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm text-gray-600 truncate">{inquiry.address}</p>
                      </div>
                    )}
                    
                    {inquiry.message && (
                      <div>
                        <p className="text-xs text-gray-500">Message</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{inquiry.message}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <select
                      value={inquiry.status}
                      onChange={(e) => updateInquiryStatus(inquiry._id, e.target.value)}
                      disabled={loading}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    >
                      <option value={STATUS.PENDING}>Pending</option>
                      <option value={STATUS.CONTACTED}>Contacted</option>
                      <option value={STATUS.QUOTED}>Quoted</option>
                      <option value={STATUS.COMPLETED}>Completed</option>
                      <option value={STATUS. CANCELLED}>Cancelled</option>
                    </select>
                    <button
                      onClick={() => {
                        const details = `
📦 CART INQUIRY DETAILS

👤 Customer: ${inquiry.name}
📞 Phone: ${inquiry.phone}
📧 Email: ${inquiry.email}
📍 Address: ${inquiry.address || "Not provided"}
${inquiry.message ? "💬 Message: " + inquiry. message : ""}

🛒 Cart Items:
${inquiry. cartItems?.map(item => `- ${item.name} (${item.brand || "N/A"}) x${item.quantity} = ₹${item.price}`).join("\n") || "No items"}

💰 Total:  ₹${inquiry.totalAmount}
📊 Status: ${inquiry.status?. toUpperCase()}
📅 Date: ${formatDateTime(inquiry.createdAt)}
                        `.trim();
                        setViewDetails({ show: true, content: details, title: "Contact Form Details" });
                      }}
                      className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-1"
                    >
                      View Full Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cart Items
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry._id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-gray-900">{inquiry.name}</div>
                        <div className="text-sm text-gray-600">{inquiry.phone}</div>
                        <div className="text-sm text-gray-500">{inquiry.email}</div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {inquiry.itemCount || inquiry.cartItems?.length || 0} items
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          {inquiry.cartItems && inquiry.cartItems.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="truncate mr-2">{item.name}</span>
                              <span>x{item.quantity}</span>
                            </div>
                          ))}
                          {inquiry.cartItems && inquiry.cartItems.length > 3 && (
                            <div className="text-gray-500">+{inquiry.cartItems.length - 3} more items...</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-green-600">₹{inquiry.totalAmount}</div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <select
                        value={inquiry.status}
                        onChange={(e) => updateInquiryStatus(inquiry._id, e.target. value)}
                        disabled={loading}
                        className={`text-sm rounded-full px-3 py-1 font-semibold border-0 focus:ring-2 focus:ring-green-500 ${
                          inquiry.status === STATUS.PENDING
                            ? "bg-yellow-100 text-yellow-800"
                            : inquiry.status === STATUS.CONTACTED
                            ?  "bg-blue-100 text-blue-800"
                            : inquiry.status === STATUS. QUOTED
                            ? "bg-purple-100 text-purple-800"
                            : inquiry. status === STATUS.COMPLETED
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <option value={STATUS.PENDING}>Pending</option>
                        <option value={STATUS.CONTACTED}>Contacted</option>
                        <option value={STATUS.QUOTED}>Quoted</option>
                        <option value={STATUS.COMPLETED}>Completed</option>
                        <option value={STATUS. CANCELLED}>Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(inquiry.createdAt)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          const details = `
📦 CART INQUIRY DETAILS

👤 Customer: ${inquiry.name}
📞 Phone: ${inquiry.phone}
📧 Email: ${inquiry.email}
📍 Address: ${inquiry.address || "Not provided"}
${inquiry.message ? "💬 Message: " + inquiry.message : ""}

🛒 Cart Items:
${inquiry.cartItems?. map(item => `- ${item.name} (${item.brand || "N/A"}) x${item.quantity} = ₹${item.price}`).join("\n") || "No items"}

💰 Total: ₹${inquiry.totalAmount}
📊 Status: ${inquiry. status?.toUpperCase()}
📅 Date: ${formatDateTime(inquiry.createdAt)}
                          `.trim();
                          setViewDetails({ show: true, content: details, title: "Cart Inquiry Details" });
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredInquiries.length === 0 && ! loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {inquiryStatusFilter === STATUS.PENDING ?  "⏳" : 
                 inquiryStatusFilter === STATUS.CONTACTED ? "📞" : 
                 inquiryStatusFilter === STATUS. QUOTED ? "💰" : 
                 inquiryStatusFilter === STATUS.COMPLETED ? "✅" : 
                 inquiryStatusFilter === STATUS.CANCELLED ? "❌" : "🛒"}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No {inquiryStatusFilter !== "all" ? inquiryStatusFilter.charAt(0).toUpperCase() + inquiryStatusFilter. slice(1) : ""} Inquiries
              </h3>
              <p className="text-gray-600">
                {inquiryStatusFilter === "all" 
                  ? "No cart inquiries found"
                  : `No ${inquiryStatusFilter} cart inquiries found`}
              </p>
            </div>
          )}
        </>
      );
    })()}
  </div>
)}

        {/* CONTACT FORMS TAB */}
{/* CONTACT FORMS TAB */}
{activeTab === "contactForms" && (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
    
    {/* Status Filter Sub-tabs */}
    <div className="border-b border-gray-200 bg-gray-50 p-3 sm:p-4">
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "All Forms", color: "gray" },
          { id: "pending", label: "Pending", color: "yellow" },
          { id: "contacted", label: "Contacted", color: "blue" },
          { id: "resolved", label: "Resolved", color: "green" },
          { id: "closed", label: "Closed", color: "gray" }
        ].map((filter) => {
          const count = filter.id === "all" 
            ? contactForms.length 
            :  contactForms.filter(f => f.status === filter.id).length;
          
          return (
            <button
              key={filter.id}
              onClick={() => setContactFormStatusFilter(filter.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                contactFormStatusFilter === filter.id
                  ? filter.id === "pending"
                    ? "bg-yellow-600 text-white"
                    : filter.id === "contacted"
                    ? "bg-blue-600 text-white"
                    : filter.id === "resolved"
                    ? "bg-green-600 text-white"
                    : filter.id === "closed"
                    ? "bg-gray-600 text-white"
                    : "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {filter.label} ({count})
            </button>
          );
        })}
      </div>
    </div>

    {(() => {
      // Filter contact forms based on selected status
      const filteredForms = contactFormStatusFilter === "all"
        ? contactForms
        : contactForms.filter(f => f.status === contactFormStatusFilter);

      return (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            <div className="space-y-4 p-4">
              {filteredForms.map((form) => (
                <div key={form._id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{form.name}</h3>
                      <p className="text-sm text-gray-600">{form.phone}</p>
                      <p className="text-sm text-gray-500 truncate">{form.email}</p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        form.status === 'pending'
                          ? "bg-yellow-100 text-yellow-800"
                          :  form.status === 'contacted'
                          ? "bg-blue-100 text-blue-800"
                          : form.status === 'resolved'
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {form.status?. toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Form Type</p>
                      <p className="text-sm font-medium text-gray-700 capitalize">
                        {form.formType}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Message</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{form.message}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="text-sm text-gray-600">{formatDateTime(form. createdAt)}</p>
                    </div>
                    
                    {form.serviceType && (
                      <div>
                        <p className="text-xs text-gray-500">Service Type</p>
                        <p className="text-sm text-gray-600">{form.serviceType}</p>
                      </div>
                    )}
                    
                    {form.rating && (
                      <div>
                        <p className="text-xs text-gray-500">Rating</p>
                        <p className="text-sm text-gray-600">{'⭐'.repeat(form. rating)}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs text-gray-500">Email Status</p>
                      {form.emailSent ? (
                        <span className="text-green-600 font-semibold text-sm">✅ Sent</span>
                      ) : (
                        <span className="text-red-600 text-sm">❌ Not Sent</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <select
                      value={form.status}
                      onChange={(e) => updateContactFormStatus(form._id, e.target.value)}
                      disabled={loading}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    
                    <button
                      onClick={() => {
                        const details = `
📋 CONTACT FORM DETAILS

👤 Customer Information:
Name: ${form.name}
Phone: ${form.phone}
Email: ${form.email}

📝 Form Details:
Type: ${form.formType}
Status: ${form.status}
Message: ${form.message}

${form.serviceType ? `🔧 Service Type: ${form.serviceType}` : ''}
${form.vehicleModel ? `🏍️ Vehicle:  ${form.vehicleModel}` : ''}
${form.location ? `📍 Location: ${form.location}` : ''}
${form.rating ? `⭐ Rating: ${'⭐'.repeat(form.rating)}` : ''}

📧 Email Status: ${form.emailSent ? '✅ Sent' : '❌ Not Sent'}
📅 Submitted: ${formatDateTime(form.createdAt)}
🆔 Form ID: ${form._id}
                        `.trim();
                        setViewDetails({ show: true, content: details, title: "Contact Form Details" });
                      }}
                      className="w-full text-sm text-indigo-600 hover:text-indigo-800 font-medium py-1"
                    >
                      View Full Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form Type
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredForms.map((form) => (
                  <tr key={form._id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-gray-900">{form.name}</div>
                        <div className="text-sm text-gray-600">{form.phone}</div>
                        <div className="text-sm text-gray-500">{form.email}</div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 capitalize">
                        {form.formType}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-600 line-clamp-2">{form.message}</p>
                        {form.serviceType && (
                          <p className="text-xs text-gray-500 mt-1">🔧 Service: {form. serviceType}</p>
                        )}
                        {form.vehicleModel && (
                          <p className="text-xs text-gray-500 mt-1">🏍️ Vehicle: {form.vehicleModel}</p>
                        )}
                        {form.emergencyType && (
                          <p className="text-xs text-red-600 mt-1 font-medium">🚨 Emergency: {form. emergencyType}</p>
                        )}
                        {form.preferredDateTime && (
                          <p className="text-xs text-blue-600 mt-1">📅 Date: {form.preferredDateTime}</p>
                        )}
                        {form.rating && (
                          <p className="text-xs text-gray-500 mt-1">⭐ Rating: {'⭐'. repeat(form.rating)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <select
                        value={form.status}
                        onChange={(e) => updateContactFormStatus(form._id, e.target.value)}
                        disabled={loading}
                        className={`text-sm rounded-full px-3 py-1 font-semibold border-0 focus:ring-2 focus:ring-indigo-500 ${
                          form.status === 'pending'
                            ? "bg-yellow-100 text-yellow-800"
                            :  form.status === 'contacted'
                            ? "bg-blue-100 text-blue-800"
                            : form.status === 'resolved'
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {form.emailSent ? (
                        <span className="text-green-600 font-semibold">✅ Sent</span>
                      ) : (
                        <span className="text-red-600">❌ Not Sent</span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(form.createdAt)}<br/>
                      {new Date(form.createdAt).toLocaleTimeString('en-IN')}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      <button
  onClick={() => {
    const details = `
📋 CONTACT FORM DETAILS

👤 Customer Information:
Name: ${form.name}
Phone: ${form.phone}
Email: ${form.email}

📝 Form Details:
Type:  ${form.formType}
Status: ${form.status}
Message: ${form.message}

${form.serviceType ? `🔧 Service Type: ${form. serviceType}` : ''}
${form.vehicleModel ? `🏍️ Vehicle: ${form.vehicleModel}` : ''}
${form.preferredDateTime ? `📅 Preferred Date & Time: ${form.preferredDateTime}` : ''}
${form.location ? `📍 Location: ${form.location}` : ''}
${form.emergencyType ? `🚨 Emergency Type: ${form.emergencyType}` : ''}
${form.rating ? `⭐ Rating: ${'⭐'.repeat(form.rating)}` : ''}

📧 Email Status:  ${form.emailSent ? '✅ Sent' : '❌ Not Sent'}
📅 Submitted: ${formatDateTime(form.createdAt)}
🆔 Form ID: ${form._id}
                          `.trim();
                          setViewDetails({ show: true, content: details, title: "Contact Form Details" });
                        }}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredForms.length === 0 && ! loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {contactFormStatusFilter === "pending" ?  "⏳" : 
                 contactFormStatusFilter === "contacted" ? "📞" : 
                 contactFormStatusFilter === "resolved" ? "✅" : 
                 contactFormStatusFilter === "closed" ?  "🔒" : "📬"}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No {contactFormStatusFilter !== "all" ? contactFormStatusFilter. charAt(0).toUpperCase() + contactFormStatusFilter.slice(1) : ""} Forms
              </h3>
              <p className="text-gray-600">
                {contactFormStatusFilter === "all" 
                  ? "No contact form submissions yet"
                  : `No ${contactFormStatusFilter} contact forms found`}
              </p>
            </div>
          )}
        </>
      );
    })()}
  </div>
)}
        {/* AllBookings TAB - COMPLETE IMPLEMENTATION */}
        {activeTab === "AllBookings" && (
          <AllBookingsTable
            appointments={appointments}
            emergencies={emergencies}
            onViewBill={(r) => {
              const details = `Booking ID: BK-${(r._id || "").slice(-4).toUpperCase()}
Customer: ${r.name}
Mobile: ${r.phone}
Vehicle: ${r.bikeModel || "—"}
Service Type: ${r.isEmergency ? "Emergency Service" : r.serviceType}
Address: ${r.address}
Status: ${(r.status || "").toUpperCase()}
Bill Amount: ₹${r.cost || 0}
Payment Status: ${r.status === "cancelled" ? "—" : r.status === "completed" ? (r.cost ? "Paid" : "Pending") : "Pending"}`;
              setViewDetails({ show: true, content: details, title: "Booking Bill" });
            }}
          />
        )}

        {/* FLEET MAP TAB */}
        {activeTab === "fleetMap" && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Fleet Map</h3>
              <p className="text-sm text-gray-500">
                {mechanics.filter((m) => m.availability !== "offline").length} active of {mechanics.length} mechanics
              </p>
            </div>
            <FleetMapView mechanics={mechanics} />
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: AVAILABILITY_MARKER_COLOR.available }} />
                Online
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: AVAILABILITY_MARKER_COLOR.busy }} />
                On Job
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: AVAILABILITY_MARKER_COLOR.offline }} />
                Offline
              </div>
            </div>
          </div>
        )}

        {/* BOOKINGS MAP TAB */}
        {activeTab === "bookingsMap" && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bookings Map</h3>
              <p className="text-sm text-gray-500">{bookingsByLocation.totalBookings} total bookings</p>
            </div>
            <BookingsMapView appointments={appointments} />

            <h4 className="text-sm font-semibold text-gray-700 mt-6 mb-3 uppercase tracking-wide">
              Bookings by Area
            </h4>
            <div className="space-y-2">
              {(bookingsByLocation.locations || []).map((loc, index) => {
                const maxCount = Math.max(1, ...bookingsByLocation.locations.map((l) => l.count));
                return (
                  <div key={`${loc.address}-${index}`} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800 truncate pr-2">
                        #{index + 1} {loc.address}
                      </span>
                      <span className="font-semibold text-blue-700">{loc.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(loc.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!bookingsByLocation.locations || bookingsByLocation.locations.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No bookings with an address on file yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Create Mechanic Modal */}
       {showCreateMechanicModal && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-4 mx-2 sm:mx-4 md:mx-auto p-4 sm:p-6 border w-full sm:w-11/12 lg:w-4/5 xl:w-3/4 shadow-lg rounded-xl bg-white mb-8">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
        <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">👤</span>
        <h3 className="text-lg font-bold text-gray-900">Add New Mechanic</h3>
      </div>

      <form onSubmit={handleCreateMechanic}>
        <div className="space-y-6">

          {/* 1. BASIC DETAILS */}
          <fieldset>
            <legend className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">1. Basic Details</legend>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Field label="Full Name" required>
                <input required value={newMechanic.name} onChange={(e) => setNewMechanic({ ...newMechanic, name: e.target.value })} className={inputCls} placeholder="Enter full name" />
              </Field>
              <Field label="Mobile Number (Login ID)" required>
                <input required pattern="[0-9]{10}" maxLength="10" value={newMechanic.phone} onChange={(e) => setNewMechanic({ ...newMechanic, phone: e.target.value.replace(/\D/g, "") })} className={inputCls} placeholder="Enter mobile number" />
              </Field>
              <Field label="Email ID (Optional)">
                <input type="email" value={newMechanic.email} onChange={(e) => setNewMechanic({ ...newMechanic, email: e.target.value })} className={inputCls} placeholder="Enter email address" />
              </Field>
              <Field label="Password" required>
                <input type="password" required minLength="6" value={newMechanic.password} onChange={(e) => setNewMechanic({ ...newMechanic, password: e.target.value })} className={inputCls} placeholder="Min 6 characters" />
              </Field>
              <Field label="Date of Birth">
                <input type="date" value={newMechanic.dateOfBirth} onChange={(e) => setNewMechanic({ ...newMechanic, dateOfBirth: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Gender">
                <select value={newMechanic.gender} onChange={(e) => setNewMechanic({ ...newMechanic, gender: e.target.value })} className={inputCls}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Profile Photo">
                <input type="file" accept="image/*" onChange={(e) => setNewMechanicFiles({ ...newMechanicFiles, photo: e.target.files[0] })} className={fileCls} />
              </Field>
            </div>
          </fieldset>

          {/* 2. ADDRESS DETAILS */}
          <fieldset>
            <legend className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">2. Address Details</legend>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2">
                <Field label="Current Address">
                  <textarea rows={1} value={newMechanic.currentAddress} onChange={(e) => setNewMechanic({ ...newMechanic, currentAddress: e.target.value })} className={inputCls} placeholder="Enter current address" />
                </Field>
              </div>
              <Field label="City" required>
                <input required value={newMechanic.city} onChange={(e) => setNewMechanic({ ...newMechanic, city: e.target.value })} className={inputCls} placeholder="Enter city" />
              </Field>
              <Field label="State">
                <input value={newMechanic.state} onChange={(e) => setNewMechanic({ ...newMechanic, state: e.target.value })} className={inputCls} placeholder="Enter state" />
              </Field>
              <Field label="PIN Code">
                <input value={newMechanic.pinCode} onChange={(e) => setNewMechanic({ ...newMechanic, pinCode: e.target.value })} className={inputCls} placeholder="Enter PIN code" />
              </Field>
            </div>
          </fieldset>

          {/* 3. KYC DETAILS */}
          <fieldset>
            <legend className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">3. KYC Details</legend>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label="Aadhaar Number">
                <input value={newMechanic.aadhaarNumber} onChange={(e) => setNewMechanic({ ...newMechanic, aadhaarNumber: e.target.value })} className={inputCls} placeholder="Enter Aadhaar number" maxLength={12} />
              </Field>
              <Field label="Aadhaar Front">
                <input type="file" accept="image/*,application/pdf" onChange={(e) => setNewMechanicFiles({ ...newMechanicFiles, aadhaarFront: e.target.files[0] })} className={fileCls} />
              </Field>
              <Field label="Aadhaar Back">
                <input type="file" accept="image/*,application/pdf" onChange={(e) => setNewMechanicFiles({ ...newMechanicFiles, aadhaarBack: e.target.files[0] })} className={fileCls} />
              </Field>
            </div>
          </fieldset>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* 4. WORK DETAILS */}
            <fieldset>
              <legend className="text-sm font-bold text-red-600 mb-3">4. Work Details</legend>
              <div className="space-y-3">
                <Field label="Experience (Years)">
                  <input type="number" min="0" max="50" value={newMechanic.experience} onChange={(e) => setNewMechanic({ ...newMechanic, experience: parseInt(e.target.value) || 0 })} className={inputCls} />
                </Field>
                <Field label="Vehicle Type" required>
                  <select required value={newMechanic.vehicleType} onChange={(e) => setNewMechanic({ ...newMechanic, vehicleType: e.target.value })} className={inputCls}>
                    <option value="">-- Select Vehicle Type --</option>
                    <option value="two-wheeler">Two Wheeler</option>
                    <option value="three-wheeler">Three Wheeler</option>
                  </select>
                </Field>
                <Field label="Specialization" required>
                  <select
                    required
                    value={Array.isArray(newMechanic.specialization) ? newMechanic.specialization[0] || "" : newMechanic.specialization || ""}
                    onChange={(e) => setNewMechanic({ ...newMechanic, specialization: e.target.value ? [e.target.value] : [] })}
                    className={inputCls}
                  >
                    <option value="">-- Choose an option --</option>
                    <option value="general-service">General Service</option>
                    <option value="bike-repair">Bike Repair</option>
                    <option value="emergency-repair">Emergency Repair</option>
                    <option value="doorstep-service">Doorstep Service</option>
                    <option value="parts-replacement">Parts Replacement</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </Field>
              </div>
            </fieldset>

            {/* 5. SERVICE AREA */}
            <fieldset>
              <legend className="text-sm font-bold text-red-600 mb-3">5. Service Area</legend>
              <div className="space-y-3">
                <Field label="City">
                  <input value={newMechanic.city} onChange={(e) => setNewMechanic({ ...newMechanic, city: e.target.value })} className={inputCls} placeholder="Same as address city" />
                </Field>
                <Field label="Area / Locality">
                  <input value={newMechanic.serviceAreaLocality} onChange={(e) => setNewMechanic({ ...newMechanic, serviceAreaLocality: e.target.value })} className={inputCls} placeholder="Enter area or locality" />
                </Field>
              </div>
            </fieldset>

            {/* 6. BANK DETAILS */}
            <fieldset>
              <legend className="text-sm font-bold text-red-600 mb-3">6. Bank Details</legend>
              <div className="space-y-3">
                <Field label="Account Holder Name">
                  <input value={newMechanic.accountHolderName} onChange={(e) => setNewMechanic({ ...newMechanic, accountHolderName: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Bank Name">
                  <input value={newMechanic.bankName} onChange={(e) => setNewMechanic({ ...newMechanic, bankName: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Account Number">
                  <input value={newMechanic.accountNumber} onChange={(e) => setNewMechanic({ ...newMechanic, accountNumber: e.target.value })} className={inputCls} />
                </Field>
                <Field label="IFSC Code">
                  <input value={newMechanic.ifscCode} onChange={(e) => setNewMechanic({ ...newMechanic, ifscCode: e.target.value.toUpperCase() })} className={inputCls} />
                </Field>
              </div>
            </fieldset>
          </div>

          {/* 7 & 8. LOGIN + STATUS */}
          <div className="grid sm:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
            <fieldset>
              <legend className="text-sm font-bold text-red-600 mb-3">7. Login Details</legend>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Login Mobile Number">
                  <input value={newMechanic.phone} disabled className={`${inputCls} bg-gray-50 text-gray-500`} />
                </Field>
                <Field label="Password">
                  <input type="password" value={newMechanic.password} disabled className={`${inputCls} bg-gray-50 text-gray-500`} />
                </Field>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-bold text-red-600 mb-3">8. Status</legend>
              <div className="flex items-center gap-6 h-10">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="radio" checked={newMechanic.isActive === true} onChange={() => setNewMechanic({ ...newMechanic, isActive: true })} />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="radio" checked={newMechanic.isActive === false} onChange={() => setNewMechanic({ ...newMechanic, isActive: false })} />
                  Inactive
                </label>
              </div>
            </fieldset>
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowCreateMechanicModal(false)}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "💾 Save Mechanic"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}


        {/* Enhanced Assign Modal */}
        <EnhancedAssignModal />

        {/* --- NEW: TOAST NOTIFICATION COMPONENT --- */}
        {notification && (
          <div className={`fixed top-5 right-5 z-[100] flex items-center p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-xl border-l-4 transition-all duration-300 transform translate-y-0 ${
            notification.type === "success" ? "border-green-500" : "border-red-500"
          }`}>
            <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${
              notification.type === "success" ? "text-green-500 bg-green-100" : "text-red-500 bg-red-100"
            }`}>
              {notification.type === "success" ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              )}
            </div>
            <div className="ml-3 text-sm font-semibold text-gray-800">{notification.message}</div>
            <button 
              onClick={() => setNotification(null)}
              className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>
        )}

        {/* --- NEW: DETAILS MODAL (Replacement for Alert View) --- */}
        {viewDetails.show && (
          <div className="fixed inset-0 bg-black/40 bg-opacity-50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100">
              {/* Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">{viewDetails.title}</h3>
                <button 
                  onClick={() => setViewDetails({ ...viewDetails, show: false })}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              {/* Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {viewDetails.content}
                </pre>
              </div>
              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 flex justify-end">
                <button
                  onClick={() => setViewDetails({ ...viewDetails, show: false })}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm";
const fileCls = "w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:text-sm file:font-medium hover:file:bg-gray-50";

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function DashStat({ icon, label, sub, value, color, small, onClick }) {
  const bgTint = color ? color.replace("text-", "bg-").replace("-600", "-100") : "bg-gray-100";
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`bg-white rounded-lg shadow border border-gray-100 flex items-center gap-3 text-left w-full ${
        small ? "p-3" : "p-4"
      } ${onClick ? "hover:shadow-md hover:border-gray-200 transition-shadow cursor-pointer" : ""}`}
    >
      {icon && (
        <span
          className={`flex-shrink-0 flex items-center justify-center rounded-full ${bgTint} ${
            small ? "w-8 h-8 text-base" : "w-10 h-10 text-lg"
          }`}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <p className={`font-bold ${color} ${small ? "text-lg" : "text-2xl"} leading-tight`}>{value}</p>
        <p className="text-xs font-medium text-gray-600 leading-snug">{label}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </span>
    </Wrapper>
  );
}

export default AdminDashboard;