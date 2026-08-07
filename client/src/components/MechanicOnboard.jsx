import React, { useState } from "react";
import axios from "axios";
import { Info, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MechanicOnboard = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    vehicleType: "",
    specialization: "",
    experience: "",
    city: "",
  });

  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/mechanics/register`,
        formData
      );

      console.log("API Response:", response.data);

      alert("Mechanic Registered Successfully!");
      navigate("/mechanic/login"); // change if needed
    } catch (error) {
      console.error("Error registering mechanic:", error);

      alert(
        error.response?.data?.message ||
          "Something went wrong. Please try again!"
      );
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-5">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl w-full max-w-lg rounded-xl p-7 space-y-5"
      >
        <h1 className="text-3xl font-bold text-center text-red-700">
          Mechanic Onboarding
        </h1>

        {/* Name */}
        <div>
          <label className="font-medium">Name</label>
          <input
            type="text"
            name="name"
            required
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>

        {/* Email */}
        <div>
          <label className="font-medium">Email</label>
          <input
            type="email"
            name="email"
            required
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="font-medium">Phone</label>
          <input
            type="tel"
            name="phone"
            required
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>

        {/* Password */}
        <div>
          <label className="font-medium">Password</label>
          <input
            type="password"
            name="password"
            required
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>

        {/* Vehicle Type */}
        <div>
          <label className="font-medium">Vehicle Type</label>
          <div className="relative">
            <select
              name="vehicleType"
              required
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded-md appearance-none"
            >
              <option value="">Select Type</option>
              <option value="two-wheeler">Two Wheeler</option>
              <option value="three-wheeler">Three Wheeler</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* Specialization */}
        <div>
          <label className="font-medium flex items-center gap-2">
            Specialization
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Info size={18} />
            </button>
          </label>

          {showInfo && (
            <div className="bg-blue-100 text-sm p-3 rounded-md mt-1">
              <p>
                <strong>Emergency Repair:</strong> Quick fix services for
                breakdowns on the road.
              </p>
              <p>
                <strong>Regular Service:</strong> Scheduled maintenance and
                servicing.
              </p>
            </div>
          )}

          <div className="relative">
            <select
              name="specialization"
              required
              onChange={handleChange}
              className="w-full mt-2 px-3 py-2 border rounded-md appearance-none"
            >
              <option value="">Select Specialization</option>
              <option value="emergency-repair">Emergency Repair</option>
              <option value="general-service">Regular Service</option>
            </select>
            <ChevronDown className="absolute right-3 top-4 w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className="font-medium">Experience (years)</label>
          <input
            type="number"
            name="experience"
            required
            min="0"
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>

        {/* City */}
        <div>
          <label className="font-medium">City</label>
          <input
            type="text"
            name="city"
            required
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-700 text-white py-3 rounded-md font-semibold hover:bg-red-800 transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default MechanicOnboard;
