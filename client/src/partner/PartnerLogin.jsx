import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { apiService } from "../routing/apiClient";

/** Garage partners sign in with the mobile number Roadengo registered them with. */
export default function PartnerLogin() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[0-9]{10}$/.test(mobile)) return setError("Enter your 10-digit mobile number.");
    if (!password) return setError("Enter your password.");
    setLoading(true);
    try {
      const res = await apiService.partnerLogin(mobile, password);
      localStorage.setItem("partnerToken", res.data.token);
      localStorage.setItem("partnerData", JSON.stringify(res.data.partner));
      navigate("/partner/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Could not log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#f4f5f7]">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-b from-[#c1121f] to-[#8f0d17] text-white p-12">
        <img src="/images/logo-sidebar.png" alt="RoadEngo" className="w-56" />
        <div>
          <h1 className="text-4xl font-bold leading-tight">Partner Panel</h1>
          <p className="text-white/85 mt-3 text-lg max-w-md">
            Track your garage's bookings, mechanics, payments and spare-part orders in one place.
          </p>
        </div>
        <p className="text-white/60 text-sm">© {new Date().getFullYear()} RoadEngo</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <img src="/images/Admin-Logo.jpeg" alt="RoadEngo" className="w-40 mx-auto lg:hidden mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Partner Login</h2>
          <p className="text-sm text-gray-500 mt-1">Use the mobile number registered with Roadengo.</p>

          <label htmlFor="pl-mobile" className="block text-sm font-semibold text-gray-800 mt-6 mb-1.5">
            Mobile number
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="pl-mobile"
              inputMode="numeric"
              autoComplete="username"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
              placeholder="10-digit mobile"
              className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
            />
          </div>

          <label htmlFor="pl-pass" className="block text-sm font-semibold text-gray-800 mt-4 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="pl-pass"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-red-700 hover:bg-red-800 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl"
          >
            {loading ? "Signing in…" : "Log in"}
          </button>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Don't have a login? Ask Roadengo to set one up for your garage.
          </p>
        </form>
      </div>
    </div>
  );
}
