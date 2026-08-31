// pages/EmergencyAssistance.jsx - FULL CODE WITH ERROR BANNER
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiService } from "../routing/apiClient";

const EmergencyAssistance = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    issueDescription: "",
    vehicleType: "",
    vehicleModel: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ NEW: Error Banner State
  const [topErrorMessage, setTopErrorMessage] = useState("");

  // ✅ Popup States
  const [showVehiclePopup, setShowVehiclePopup] = useState(false);
  const [showModelPopup, setShowModelPopup] = useState(false);

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

  // Helper function (Keeping it as you had it, though unused in GPS logic, avoiding deletion)
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

  // ✅ GPS Location function (Modified to use Error Banner instead of Alert)
  const fetchCurrentLocation = () => {
    setTopErrorMessage(""); // Clear previous errors

    if (!navigator.geolocation) {
      setTopErrorMessage("❌ Geolocation not supported by your browser");
      return;
    }

    setIsFetchingLocation(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Google Maps Geocoding API endpoint
          const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; 
          
          // Use coordinates as default fallback
          let mainAddress = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

          // Only call API if Key exists
          if (GOOGLE_API_KEY) {
             const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
             const response = await fetch(url);
             if (response.ok) {
                const data = await response.json();
                if (data.status === "OK" && data.results && data.results[0]) {
                   mainAddress = data.results[0].formatted_address;
                }
             }
          }

          setFormData((prev) => ({ ...prev, location: mainAddress }));
          console.log("Location detected:", mainAddress);
        } catch (err) {
          console.error("Google geocoding failed:", err);
          // fallback: just show coordinates
          const { latitude, longitude } = position.coords;
          const fallback = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
          setFormData((prev) => ({ ...prev, location: fallback }));
          console.warn("Got coordinates but couldn't fetch address.");
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let msg = "Unable to fetch location";
        
        // Custom Error Messages for Banner
        if (error.code === error.PERMISSION_DENIED) {
          msg = "🚫 Permission Denied! Please enable Location access in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "📡 GPS Signal Lost. Please check your device location settings.";
        } else if (error.code === error.TIMEOUT) {
          msg = "⏳ Location request timed out. Please try again.";
        }
        
        setTopErrorMessage(msg); // Show in Red Box
        setIsFetchingLocation(false);
      },
      options
    );
  };

  // Emergency bookings are time-critical, so grab the location the moment the
  // page opens rather than waiting for the customer to tap the button.
  useEffect(() => {
    fetchCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Handle Vehicle Type Selection
  const handleVehicleTypeSelect = (type) => {
    setFormData((prev) => ({ ...prev, vehicleType: type, vehicleModel: "" }));
    setShowVehiclePopup(false);
    setShowModelPopup(true);
    if (errors.bikeModel) setErrors((prev) => ({ ...prev, bikeModel: "" }));
  };

  // ✅ Handle Vehicle Model Selection
  const handleVehicleModelSelect = (model) => {
    setFormData((prev) => ({ ...prev, vehicleModel: model }));
    setShowModelPopup(false);
    if (errors.bikeModel) setErrors((prev) => ({ ...prev, bikeModel: "" }));
  };

  // ✅ Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name required";
    else if (formData.name.trim().length < 2) newErrors.name = "Name too short";

    if (!formData.phone.trim()) newErrors.phone = "Phone required";
    else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, "")))
      newErrors.phone = "Invalid phone number";

    if (!formData.location.trim()) newErrors.location = "Location required";
    else if (formData.location.trim().length < 10)
      newErrors.location = "Location too short";

    if (!formData.vehicleType) newErrors.bikeModel = "Vehicle type required";
    else if (!formData.vehicleModel.trim())
      newErrors.bikeModel = "Vehicle model required";

    if (!formData.issueDescription.trim())
      newErrors.issueDescription = "Issue description required";
    else if (formData.issueDescription.trim().length < 10)
      newErrors.issueDescription = "Description too short";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    setTopErrorMessage(""); // Hide error when user types
  };

  // ✅ Submit function (Modified to use Error Banner)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTopErrorMessage("");

    if (!validateForm()) {
      setTopErrorMessage("⚠️ Please fill all required fields correctly.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");

    const emergencyData = {
      name: formData.name.trim(),
      phone: formData.phone.replace(/\D/g, ""),
      location: formData.location.trim(),
      bikeModel: `${vehicleTypes[formData.vehicleType]?.name} - ${
        formData.vehicleModel
      }`,
      issueDescription: formData.issueDescription.trim(),
    };

    try {
      const response = await apiService.createEmergency(emergencyData);
      if (response && response.data) {
        const emergency = response.data.emergency || response.data;
        setSuccessMessage(`✅ Emergency request submitted!
Request ID: ${emergency._id || "ER" + Date.now()}
Vehicle: ${vehicleTypes[formData.vehicleType].name} - ${formData.vehicleModel}
📞 We will contact you soon.`);

        setFormData({
          name: "",
          phone: "",
          location: "",
          issueDescription: "",
          vehicleType: "",
          vehicleModel: "",
        });

        setTimeout(() => navigate("/"), 4000);
      }
    } catch (error) {
      console.error("Emergency request error:", error);
      // Show Server Error in Red Box
      setTopErrorMessage("❌ Failed to submit. Please try again or check your internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate("/booking");

  // ✅ Compact Vehicle Type Popup
  const VehicleTypePopup = () => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-sm relative">
        <button
          onClick={() => setShowVehiclePopup(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-lg w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-center mb-4">
          Select Your Vehicle Brand
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(vehicleTypes).map(([key, vehicle]) => (
            <div
              key={key}
              onClick={() => handleVehicleTypeSelect(key)}
              className="p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all text-center flex flex-col items-center gap-1.5"
            >
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-700">{vehicle.icon}</span>
              <h4 className="font-semibold text-sm">{vehicle.name}</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ✅ Compact Vehicle Model Popup
  const VehicleModelPopup = () => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-sm relative max-h-80 overflow-y-auto">
        <button
          onClick={() => setShowModelPopup(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-lg w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-center mb-4">
          Select{" "}
          {formData.vehicleType ? vehicleTypes[formData.vehicleType].name : ""}{" "}
          Model
        </h3>

        <div className="space-y-2">
          {formData.vehicleType &&
            vehicleTypes[formData.vehicleType].models.map((model) => (
              <div
                key={model}
                onClick={() => handleVehicleModelSelect(model)}
                className="p-2 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{model}</span>
                  <span className="text-blue-600 text-sm">→</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  // Success screen with enhanced navigation
  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="bg-white p-6 rounded-xl shadow-xl text-center w-full max-w-md">
          <div className="text-4xl mb-3 animate-bounce">✅</div>
          <h2 className="text-xl font-bold text-green-800 mb-3">
            Request Submitted!
          </h2>
          <pre className="text-green-700 text-sm whitespace-pre-wrap mb-4">
            {successMessage}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/")}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
            >
              ← Go Home
            </button>
            <Link
              to="/booking"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm text-center flex items-center justify-center"
            >
              🏠 New Booking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50 via-white to-orange-50 min-h-screen">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Enhanced Header with Link Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center text-red-600 hover:text-red-800 font-semibold text-sm bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
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

        <div className="max-w-lg mx-auto bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-red-600">
              🚨 Emergency Assistance
            </h1>
            <p className="text-gray-600 text-sm">
              Need help? Fill this form quickly
            </p>
          </div>

          {/* ✅ ERROR MESSAGE BANNER (Added Here) */}
          {topErrorMessage && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-md shadow-sm animate-pulse flex items-start justify-between">
                <div className="flex items-start">
                    <span className="text-lg mr-2">⚠️</span>
                    <span className="text-sm font-medium">{topErrorMessage}</span>
                </div>
                <button onClick={() => setTopErrorMessage("")} className="ml-2 text-red-400 hover:text-red-900 font-bold">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name + Phone in one line */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-sm mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`w-full p-3 border rounded-lg text-sm focus:ring-4 focus:ring-red-200 transition-all ${
                    errors.name
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 focus:border-red-500"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block font-semibold text-sm mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  value={formData.phone}
                  onChange={(e) =>
                    handleInputChange(
                      "phone",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  className={`w-full p-3 border rounded-lg text-sm focus:ring-4 focus:ring-red-200 transition-all ${
                    errors.phone
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 focus:border-red-500"
                  }`}
                  maxLength="10"
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block font-semibold text-sm mb-1">
                Current Location *
              </label>
              <textarea
                rows="2"
                placeholder="Enter location or use GPS"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                className={`w-full p-3 border rounded-lg text-sm focus:ring-4 focus:ring-red-200 transition-all resize-none ${
                  errors.location
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 focus:border-red-500"
                }`}
                disabled={isSubmitting || isFetchingLocation}
              />
              {errors.location && (
                <p className="text-red-600 text-xs mt-1">{errors.location}</p>
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
            </div>

            {/* Vehicle Selection */}
            <div>
              <label className="block font-semibold text-sm mb-1">
                Vehicle Company & Name *
              </label>
              <div className="space-y-2">
                {/* Vehicle Type Button */}
                <button
                  type="button"
                  onClick={() => setShowVehiclePopup(true)}
                  disabled={isSubmitting}
                  className={`w-full p-3 border-2 rounded-lg text-left transition-all text-sm hover:shadow-md ${
                    formData.vehicleType
                      ? "border-green-500 bg-green-50"
                      : errors.bikeModel
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 hover:border-blue-300"
                  }`}
                >
                  {formData.vehicleType ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {vehicleTypes[formData.vehicleType].icon}
                        </span>
                        <span className="font-medium">
                          {vehicleTypes[formData.vehicleType].name}
                        </span>
                      </div>
                      <span className="text-blue-600 text-xs font-medium">
                        Change
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Select Vehicle Company</span>
                      <span>→</span>
                    </div>
                  )}
                </button>

                {/* Vehicle Model Button */}
                {formData.vehicleType && (
                  <button
                    type="button"
                    onClick={() => setShowModelPopup(true)}
                    disabled={isSubmitting}
                    className={`w-full p-3 border-2 rounded-lg text-left transition-all text-sm hover:shadow-md ${
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
                        <span className="text-blue-600 text-xs font-medium">
                          Change
                        </span>
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

            {/* Issue Description */}
            <div>
              <label className="block font-semibold text-sm mb-1">
                Issue Description *
              </label>
              <textarea
                rows="3"
                placeholder="Describe the problem in detail..."
                value={formData.issueDescription}
                onChange={(e) =>
                  handleInputChange("issueDescription", e.target.value)
                }
                className={`w-full p-3 border rounded-lg text-sm focus:ring-4 focus:ring-red-200 transition-all resize-none ${
                  errors.issueDescription
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 focus:border-red-500"
                }`}
                disabled={isSubmitting}
              />
              {errors.issueDescription && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.issueDescription}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Submitting...
                </>
              ) : (
                "🚨 Submit Emergency Request"
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-6 text-center">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">
                <strong>
                  <i className="ri-time-line"></i> Response Time:
                </strong>{" "}
                15 minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popups */}
      {showVehiclePopup && <VehicleTypePopup />}
      {showModelPopup && <VehicleModelPopup />}
    </div>
  );
};

export default EmergencyAssistance;