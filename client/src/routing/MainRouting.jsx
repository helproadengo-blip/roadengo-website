// routing/MainRouting.jsx
import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import Layout from "../layout/Layout";
import About from "../pages/About";
import Contact from "../pages/Contact";
import Booking from "../pages/Booking";
import SpareParts from "../pages/SpareParts";
import Subscription from "../pages/Subscription";
import DoorstepService from "../pages/DoorstepService";
import EmergencyAssistance from "../pages/EmergencyAssistance";
import AdminLogin from "../pages/AdminLogin";
import AdminDashboard from "../pages/AdminDashboard";
import MechanicDashboard from "../pages/MechanicDashboard";
import MechanicLogin from "../pages/MechanicLogin";
import ProtectedRoute from "../components/ProtectedRoute";
import MechanicOnboard from "../components/MechanicOnboard";
import TermsAndConditions from "../pages/TermsAndConditions";
import PrivacyPolicy from "../pages/PrivacyAndPolicy";

const MainRouting = () => {
  return (
    <>
      <Routes>
        {/* Public Routes with Layout */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Booking />} />
          <Route path="/spare-parts" element={<SpareParts />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/doorstep-service" element={<DoorstepService />} />
          <Route path="/emergency-assistance" element={<EmergencyAssistance />} />
          <Route path="/mechanic/Onboarding" element={<MechanicOnboard />} />
        </Route>

        {/* Admin Routes - No Layout */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute userType="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Mechanic Routes - No Layout */}
        <Route path="/mechanic/login" element={<MechanicLogin />} />
        <Route
          path="/mechanic/dashboard"
          element={
            <ProtectedRoute userType="mechanic">
              <MechanicDashboard />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

// Simple 404 Component
const NotFound = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <a href="/" className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors">
        Go Home
      </a>
    </div>
  </div>
);

export default MainRouting;
