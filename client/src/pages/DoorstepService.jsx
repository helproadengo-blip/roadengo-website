import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiService, SERVICE_TYPES } from "../routing/apiClient";

const DoorstepService = ({ onBack }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [showVehiclePopup, setShowVehiclePopup] = useState(false);
  const [showModelPopup, setShowModelPopup] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState(""); // ADDED: State for location errors
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    bikeModel: "",
    vehicleType: "",
    vehicleModel: "",
    serviceType: "",
    additionalNotes: ""
  });

    // Build address string from Nominatim response
  const formatAddressFromNominatim = (data) => {
    if (!data) return "";
    const a = data.address || {};
    const parts = [];

    if (a.house_number) parts.push(a.house_number);
    if (a.road) parts.push(a.road);
    if (a.neighbourhood) parts.push(a.neighbourhood);
    if (a.suburb) parts.push(a.suburb);
    if (a.city || a.town || a.village)
      parts.push(a.city || a.town || a.village);
    if (a.state_district) parts.push(a.state_district);
    if (a.state) parts.push(a.state);
    if (a.postcode) parts.push(a.postcode);
    if (a.country) parts.push(a.country);

    return parts.join(", ") || data.display_name || "";
  };
  
  const fetchCurrentLocation = () => {
    setLocationError(""); // Reset error state
    
    if (!navigator.geolocation) {
      setLocationError("❌ Geolocation is not supported by this browser.");
      return;
    }

    setIsFetchingLocation(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;

          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`;
          const response = await fetch(url, {
            headers: { Accept: "application/json" ,
              "User-Agent": "RoadengoApp/1.0"
            },
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = await response.json();
          const mainAddress =
            formatAddressFromNominatim(data) || "Address not found";

          const finalLocation = `${mainAddress}

${latitude.toFixed(6)}, ${longitude.toFixed(6)}
${accuracy ? `${Math.round(accuracy)}m` : "Unknown"}`;

          setFormData((prev) => ({ ...prev, address: finalLocation }));
          // Removed success alert to be less annoying
        } catch (err) {
          console.error("Geocoding failed:", err);
          const { latitude, longitude, accuracy } = position.coords;

          const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}
${accuracy ? `${Math.round(accuracy)}m` : "Unknown"}
Address lookup failed`;

          setFormData((prev) => ({ ...prev, address: fallback }));
          setLocationError("⚠️ Got coordinates but server failed to fetch address details.");
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let msg = "⚠️ Unable to fetch location";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "🔒 Location permission denied. Please enable location access in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "📡 Location unavailable. Please check if your device GPS is turned on.";
        } else if (error.code === error.TIMEOUT) {
          msg = "⏳ Location request timed out. Please try again.";
        }
        setLocationError(msg); // Set error state instead of alert
        setIsFetchingLocation(false);
      },
      options
    );
  };

  // Detect the customer's location as soon as the page opens, so the address
  // field is pre-filled instead of waiting for them to find the button. The
  // button stays for retrying / correcting.
  useEffect(() => {
    fetchCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vehicle brands with models — customer picks Brand first, then Model,
  // matching the client's mockup flow ("Select Your Vehicle Brand" →
  // "Select Your Vehicle Model").
  const vehicleTypes = {
    honda: { name: "Honda", icon: "🅗", models: ["Activa 5G", "Activa 6G", "Activa i", "Aviator", "CB300R", "CB Shine SP", "CB Trigger", "CB Twister", "Other"] },
    bajaj: { name: "Bajaj", icon: "🅑", models: ["Pulsar 150", "Pulsar NS200", "Platina", "CT 100", "Avenger", "Chetak Electric", "Other"] },
    hero: { name: "Hero", icon: "🅗", models: ["Splendor Plus", "HF Deluxe", "Passion Pro", "Glamour", "Xtreme 160R", "Destini 125", "Other"] },
    tvs: { name: "TVS", icon: "🅣", models: ["Jupiter", "Apache RTR 160", "Ntorq 125", "Star City Plus", "Raider 125", "iQube Electric", "Other"] },
    yamaha: { name: "Yamaha", icon: "🅨", models: ["FZ-S", "R15", "Fascino 125", "Ray ZR", "MT-15", "Other"] },
    "royal-enfield": { name: "Royal Enfield", icon: "🅡", models: ["Classic 350", "Bullet 350", "Hunter 350", "Meteor 350", "Other"] },
    suzuki: { name: "Suzuki", icon: "🅢", models: ["Access 125", "Burgman Street", "Gixxer", "Avenis", "Other"] },
    ktm: { name: "KTM", icon: "🅚", models: ["Duke 200", "Duke 390", "RC 200", "Other"] },
    vespa: { name: "Vespa", icon: "🅥", models: ["VXL", "SXL", "Elegante", "Other"] },
    mahindra: { name: "Mahindra", icon: "🅜", models: ["Treo", "Alfa", "e2o", "Other"] },
    other: { name: "Other Brand", icon: "🏍️", models: ["Other"] },
  };

  // Default time slots - fallback when API fails
  const defaultTimeSlots = [
    "09:00", "10:00", "11:00", "12:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const serviceTypes = [
    { value: SERVICE_TYPES.GENERAL_SERVICE, label: "General Service", icon: "🔧", desc: "Complete vehicle checkup" },
    { value: SERVICE_TYPES.OIL_CHANGE, label: "Oil Change", icon: "🛢️", desc: "Engine oil replacement" },
    { value: SERVICE_TYPES.BRAKE_SERVICE, label: "Brake Service", icon: "🛑", desc: "Brake pads & fluid check" },
    { value: SERVICE_TYPES.CHAIN_CLEANING, label: "Chain Cleaning", icon: "⛓️", desc: "Chain lubrication & cleaning" },
    { value: SERVICE_TYPES.COMPLETE_OVERHAUL, label: "Complete Overhaul", icon: "🔄", desc: "Full vehicle restoration" },
    { value: SERVICE_TYPES.MAINTENANCE, label: "Regular Maintenance", icon: "⚙️", desc: "Routine maintenance" },
    { value: SERVICE_TYPES.INSPECTION, label: "Inspection", icon: "🔍", desc: "Safety inspection" }
  ];

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  // Enhanced error handling for API calls
  const fetchAvailableSlots = async (date) => {
    try {
      setApiError(null);
      
      if (!apiService || typeof apiService.getAvailableSlots !== 'function') {
        console.warn('API service not available, using default slots');
        setAvailableSlots(defaultTimeSlots);
        setIsOfflineMode(true);
        return;
      }

      const response = await apiService.getAvailableSlots(date);
      
      if (response && response.data && response.data.slots) {
        setAvailableSlots(response.data.slots);
        setIsOfflineMode(false);
      } else {
        console.warn('API returned empty slots, using default');
        setAvailableSlots(defaultTimeSlots);
        setIsOfflineMode(true);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setApiError('🌐 Network connection issue. Using offline mode.');
        setIsOfflineMode(true);
      } else if (error.response?.status === 500) {
        setApiError('⚠️ Server temporarily unavailable. Using default slots.');
        setIsOfflineMode(true);
      } else if (error.response?.status === 404) {
        setApiError('📅 Slot data not found. Using default availability.');
        setIsOfflineMode(true);
      } else {
        setApiError('⚠️ Unable to load live slots. Using default times.');
        setIsOfflineMode(true);
      }
      
      setAvailableSlots(defaultTimeSlots);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name too short";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address required";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Address too short";
    }

    if (!formData.vehicleType || !formData.vehicleModel) {
      newErrors.bikeModel = "Vehicle type and model required";
    }

    if (!formData.serviceType) {
      newErrors.serviceType = "Service type required";
    }

    if (!selectedDate) {
      newErrors.date = "Date required";
    }

    if (!selectedTime) {
      newErrors.time = "Time slot required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const handleVehicleTypeSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      vehicleType: type,
      vehicleModel: "",
      bikeModel: `${vehicleTypes[type].name}`
    }));
    setShowVehiclePopup(false);
    
    if (errors.bikeModel) {
      setErrors(prev => ({ ...prev, bikeModel: "" }));
    }
  };

  const handleVehicleModelSelect = (model) => {
    setFormData(prev => ({
      ...prev,
      vehicleModel: model,
      bikeModel: `${vehicleTypes[prev.vehicleType].name} - ${model}`
    }));
    setShowModelPopup(false);
    
    if (errors.bikeModel) {
      setErrors(prev => ({ ...prev, bikeModel: "" }));
    }
  };

  // Enhanced submit with better error handling
  const handleSubmit = async (e) => {
    console.log(isSubmitting);
    console.log('Submitting');

    e.preventDefault();
  
    if (!validateForm()) {
      return;
    }
console.log(isSubmitting);
    setIsSubmitting(true);
    console.log(isSubmitting);
    
    const appointmentData = {
      ...formData,
      serviceDate: selectedDate,
      serviceTime: selectedTime,
      serviceCategory: "doorstep",
      status: "pending",
      requestTime: new Date().toISOString(),
      isOfflineBooking: isOfflineMode
    };

    try {
      if (!apiService || typeof apiService.createAppointment !== 'function') {
        localStorage.setItem('pendingBooking', JSON.stringify(appointmentData));
        setSuccessMessage(`✅ Booking saved locally!
        
📱 Your appointment will be confirmed once we're back online.
📅 Date: ${selectedDate}
🕒 Time: ${selectedTime}
🔧 Service: ${serviceTypes.find(s => s.value === formData.serviceType)?.label}

📞 We'll call you for confirmation within 2 hours.`);
        
        resetForm();
        return;
      }

      const response = await apiService.createAppointment(appointmentData);
      
      if (response && response.data) {
        setSuccessMessage(`✅ Appointment booked successfully!
        
🆔 Booking ID: ${response.data._id || Math.random().toString(36).substr(2, 9)}
📅 Date: ${selectedDate}
🕒 Time: ${selectedTime}
🔧 Service: ${serviceTypes.find(s => s.value === formData.serviceType)?.label}

📞 We'll call you 30 minutes before your appointment.`);
        
        resetForm();
      }
    } catch (error) {
      console.error('Appointment booking error:', error);
      
      let errorMessage = '';
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        localStorage.setItem('pendingBooking', JSON.stringify(appointmentData));
        setSuccessMessage(`📱 Booking saved offline!
        
⚠️ Network connection issue detected.
📅 Date: ${selectedDate}
🕒 Time: ${selectedTime}

📞 We'll confirm your appointment once connection is restored.`);
        resetForm();
        return;
      } else if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = '❌ Invalid booking data. Please check all fields.';
            break;
          case 409:
            errorMessage = '⏰ Selected time slot is no longer available. Please choose another time.';
            setSelectedTime("");
            break;
          case 500:
            errorMessage = '🔧 Server temporarily unavailable. Your booking has been saved and we\'ll confirm it shortly.';
            localStorage.setItem('pendingBooking', JSON.stringify(appointmentData));
            break;
          default:
            errorMessage = '⚠️ Booking failed. Please try again or call us directly.';
        }
      } else {
        errorMessage = '🌐 Connection error. Booking saved locally for confirmation.';
        localStorage.setItem('pendingBooking', JSON.stringify(appointmentData));
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      address: "",
      bikeModel: "",
      vehicleType: "",
      vehicleModel: "",
      serviceType: "",
      additionalNotes: ""
    });
    setSelectedDate("");
    setSelectedTime("");
    setCurrentStep(1);

    setTimeout(() => {
      onBack();
    }, 4000);
  };

  const nextStep = () => {
    if (currentStep === 1 && formData.name && formData.phone ) {
      setCurrentStep(2);
    } else if (currentStep === 2 && formData.address && formData.vehicleType && formData.vehicleModel && formData.serviceType) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Vehicle Type Popup
  const VehicleTypePopup = () => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Select Your Vehicle Brand</h3>
            <button
              onClick={() => setShowVehiclePopup(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {Object.entries(vehicleTypes).map(([key, type]) => (
            <button
              key={key}
              onClick={() => handleVehicleTypeSelect(key)}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all text-center flex flex-col items-center gap-2"
            >
              <span className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-700">{type.icon}</span>
              <div className="font-semibold text-gray-900 text-sm">{type.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Vehicle Model Popup
  const VehicleModelPopup = () => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Select Your Vehicle Model</h3>
            <button
              onClick={() => setShowModelPopup(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {vehicleTypes[formData.vehicleType]?.models.map((model) => (
            <button
              key={model}
              onClick={() => handleVehicleModelSelect(model)}
              className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all"
            >
              <div className="font-medium text-gray-900">{model}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Success screen with enhanced navigation
  if (successMessage) {
    return (
      <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-lg text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-xl font-bold text-green-800 mb-3">Booking Confirmed!</h2>
          <div className="bg-green-50 p-3 rounded-lg mb-4">
            <pre className="text-xs text-green-700 whitespace-pre-wrap">{successMessage}</pre>
          </div>
          <p className="text-gray-600 text-sm mb-4">Choose your next action:</p>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
            >
              ← Back to Services
            </button>
            <Link
              to="/booking"
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm text-center flex items-center justify-center font-semibold"
            >
              🏠 New Booking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:container lg:mx-auto">
        
        {/* Enhanced Header with Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors text-sm bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg"
            disabled={isSubmitting}
          >
            ← Back to Services
          </button>
          <Link
            to="/booking"
            className="flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"
          >
            🏠 All Services
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🏠</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight sm:text-3xl lg:text-4xl">
              <span className="text-blue-600">Doorstep Service</span>
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed sm:text-base">
              Professional service at your location
            </p>
            
            {/* Status Indicators */}
            {isOfflineMode && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-xs">
                  📱 Offline Mode: Bookings will be confirmed manually
                </p>
              </div>
            )}
            
            {apiError && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-xs">{apiError}</p>
              </div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-8 h-0.5 transition-all ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Form */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    👤 Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full p-4 border-2 rounded-xl text-sm focus:ring-4 focus:ring-blue-200 transition-all ${
                          errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number *"
                        maxLength="10"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          handleInputChange('phone', value);
                        }}
                        className={`w-full p-4 border-2 rounded-xl text-sm focus:ring-4 focus:ring-blue-200 transition-all ${
                          errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                    </div>
                  </div>


                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!formData.name || !formData.phone }
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95 text-base shadow-md"
                  >
                    Next: Service Details →
                  </button>
                </div>
              )}

              {/* Step 2: Service Details */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    🔧 Service Details
                  </h3>
                          <div>
              <label className="block font-semibold text-sm mb-1">
                Current address *
              </label>
              <textarea
                rows="2"
                placeholder="Enter location or use GPS"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={`w-full p-3 border rounded-lg text-sm focus:ring-4 focus:ring-red-200 transition-all resize-none ${
                  errors.address
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 focus:border-red-500"
                }`}
                disabled={isSubmitting || isFetchingLocation}
              />
              {errors.location && (
                <p className="text-red-600 text-xs mt-1">{errors.address}</p>
              )}
              <button
                type="button"
                onClick={fetchCurrentLocation}
                disabled={isFetchingLocation || isSubmitting}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all text-sm font-semibold"
              >
                {isFetchingLocation ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Getting Location...
                  </>
                ) : (
                  <>Use GPS Location</>
                )}
              </button>
              
              {/* ADDED: Location Error Message Display */}
              {locationError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>{locationError}</span>
                </div>
              )}

            </div>
                

                  {/* Vehicle Selection */}
                  <div>
                    <label className="block font-semibold text-sm mb-2">
                      Vehicle Company & Name *
                    </label>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setShowVehiclePopup(true)}
                        disabled={isSubmitting}
                        className={`w-full p-4 border-2 rounded-xl text-left transition-all text-sm hover:shadow-md ${
                          formData.vehicleType
                            ? "border-green-500 bg-green-50"
                            : errors.bikeModel
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 hover:border-blue-300"
                        }`}
                      >
                        {formData.vehicleType ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">
                                {vehicleTypes[formData.vehicleType].icon}
                              </span>
                              <span className="font-medium">
                                {vehicleTypes[formData.vehicleType].name}
                              </span>
                            </div>
                            <span className="text-blue-600 text-xs font-medium">Change</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-gray-500">
                            <span>Select Vehicle Company</span>
                            <span>→</span>
                          </div>
                        )}
                      </button>

                      {formData.vehicleType && (
                        <button
                          type="button"
                          onClick={() => setShowModelPopup(true)}
                          disabled={isSubmitting}
                          className={`w-full p-4 border-2 rounded-xl text-left transition-all text-sm hover:shadow-md ${
                            formData.vehicleModel
                              ? "border-green-500 bg-green-50"
                              : errors.bikeModel
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300 hover:border-blue-300"
                          }`}
                        >
                          {formData.vehicleModel ? (
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {formData.vehicleModel}
                              </span>
                              <span className="text-blue-600 text-xs font-medium">Change</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-gray-500">
                              <span>
                                Select {vehicleTypes[formData.vehicleType].name} Model
                              </span>
                              <span>→</span>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                    {errors.bikeModel && (
                      <p className="text-red-600 text-xs mt-1">{errors.bikeModel}</p>
                    )}
                  </div>

                  {/* Service Type Selection */}
                  <div>
                    <p className="text-sm font-semibold mb-3">Select Service Type *</p>
                    <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                      {serviceTypes.map((service) => (
                        <div
                          key={service.value}
                          onClick={() => handleInputChange('serviceType', service.value)}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                            formData.serviceType === service.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{service.icon}</span>
                            <div>
                              <p className="font-semibold text-sm">{service.label}</p>
                              <p className="text-xs text-gray-600">{service.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.serviceType && <p className="text-red-600 text-xs mt-1">{errors.serviceType}</p>}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-300 transition-all transform hover:scale-[1.02] active:scale-95 text-base"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!formData.address || !formData.vehicleType || !formData.vehicleModel || !formData.serviceType}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95 text-base shadow-md"
                    >
                      Next: Date & Time →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Date & Time */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    📅 Select Date & Time
                  </h3>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Select Date *</label>
                    <input
                      type="date"
                      min={getTodayDate()}
                      max={getMaxDate()}
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedTime("");
                        if (errors.date) {
                          setErrors(prev => ({ ...prev, date: "" }));
                        }
                      }}
                      className={`w-full p-4 border-2 rounded-xl text-sm focus:ring-4 focus:ring-blue-200 transition-all ${
                        errors.date ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                    {errors.date && <p className="text-red-600 text-xs mt-1">{errors.date}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold">Available Time Slots *</p>
                      {isOfflineMode && (
                        <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                          Default Times
                        </span>
                      )}
                    </div>
                    {selectedDate ? (
                      <div className="grid grid-cols-3 gap-3">
                        {availableSlots.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => {
                              setSelectedTime(time);
                              if (errors.time) {
                                setErrors(prev => ({ ...prev, time: "" }));
                              }
                            }}
                            className={`p-3 rounded-xl border-2 transition-all text-sm font-medium hover:shadow-md ${
                              selectedTime === time
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8 text-sm">
                        Please select a date first
                      </p>
                    )}
                    {errors.time && <p className="text-red-600 text-xs mt-1">{errors.time}</p>}
                  </div>

                  <div>
                    <textarea
                      placeholder="Additional Notes (Optional)"
                      rows="3"
                      value={formData.additionalNotes}
                      onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl text-sm focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all resize-none"
                    />
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3 text-sm flex items-center">
                      📋 Booking Summary
                    </h4>
                    <div className="space-y-1 text-blue-800 text-xs">
                      <p><strong>Name:</strong> {formData.name}</p>
                      <p><strong>Phone:</strong> {formData.phone}</p>
                      <p><strong>Vehicle:</strong> {formData.bikeModel}</p>
                      <p><strong>Date:</strong> {selectedDate}</p>
                      <p><strong>Time:</strong> {selectedTime}</p>
                      <p><strong>Service:</strong> {
                        serviceTypes.find(s => s.value === formData.serviceType)?.label
                      }</p>
                      {isOfflineMode && (
                        <p className="text-yellow-700 font-medium">⚡ Offline booking - manual confirmation</p>
                      )}
                    </div>
                  </div>
                   {errors.bikeModel && (
                      <p className="text-red-600 text-xs mt-1">{errors.bikeModel}</p>
                    )}
                    {errors.serviceType && <p className="text-red-600 text-xs mt-1">{errors.serviceType}</p>}
                    {errors.date && <p className="text-red-600 text-xs mt-1">{errors.date}</p>}
                  {errors.time && <p className="text-red-600 text-xs mt-1">{errors.time}</p>}
                    {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-300 transition-all transform hover:scale-[1.02] active:scale-95 text-base"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedDate || !selectedTime}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95 text-base flex items-center justify-center shadow-md"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Booking...
                        </>
                      ) : (
                        '📅 Confirm Booking'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Footer Info */}
            <div className="mt-6 text-center">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    <strong>📞 Confirmation:</strong> We'll call you {isOfflineMode ? 'within 2 hours' : '30 minutes before'}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>🕒 Duration:</strong> Typically 45-90 minutes
                  </p>
                  {isOfflineMode && (
                    <p className="text-xs text-yellow-600">
                      <strong>📱 Offline Mode:</strong> Booking will be manually processed
                    </p>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Link
                    to="/booking"
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    🏠 Browse All Services →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Type Popup */}
      {showVehiclePopup && <VehicleTypePopup />}

      {/* Vehicle Model Popup */}
      {showModelPopup && <VehicleModelPopup />}
    </div>
  );
};

export default DoorstepService;
