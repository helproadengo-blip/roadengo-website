import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import PublicMechanicMap from "../components/PublicMechanicMap";
import BookNowChooser from "../components/BookNowChooser";
import SubscriptionPlanCard from "../components/SubscriptionPlanCard";
import { HOME_SERVICES, TRUST_ITEMS } from "../data/homeServices";
import { apiService } from "../routing/apiClient";

const Home = () => {
  // Real count of mechanics currently online, reported by the map below.
  const [nearbyCount, setNearbyCount] = useState(null);
  const handleCount = useCallback((n) => setNearbyCount(n), []);

  // Book Now always asks general-service vs emergency first, the same way the
  // app does; `chooserService` carries the service the customer tapped.
  const [chooserOpen, setChooserOpen] = useState(false);
  const [chooserService, setChooserService] = useState(null);

  const [plan, setPlan] = useState(null);

  useEffect(() => {
    apiService
      .getSubscriptionPlans()
      .then((res) => setPlan(res.data?.plans?.[0] || null))
      .catch(() => setPlan(null));
  }, []);

  const openChooser = (service) => {
    setChooserService(service?.serviceType || null);
    setChooserOpen(true);
  };


  return (
    <div className="bg-white">
      <Hero />

      {/* Book your service — the single primary action, before anything else */}
      <section className="bg-white pt-10 px-4">
        <div className="max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => openChooser(null)}
            className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.99] transition-all text-white rounded-2xl px-6 py-6 flex items-center gap-5 shadow-lg shadow-red-600/25"
          >
            <span className="w-12 h-12 rounded-xl border-2 border-white/85 flex items-center justify-center flex-shrink-0">
              <i className="ri-tools-fill text-2xl" />
            </span>
            <span className="flex-1 text-center text-xl sm:text-2xl font-extrabold tracking-wide">
              BOOK YOUR SERVICE
            </span>
          </button>
        </div>
      </section>

      {/* Section 2: Services */}
      <section className="bg-white py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Left Content - Mobile Mockup */}
            <div className="flex justify-center lg:justify-start order-2 lg:order-1">
              <div className="relative group">
                <div className="relative bg-white p-2 rounded-2xl shadow-2xl">
                  <img
                    src="/images/hero-mechanic.png"
                    className="rounded-xl max-w-full h-auto transform group-hover:scale-[1.02] transition-transform duration-300"
                    alt="Roadengo mechanic servicing a bike at the customer's doorstep"
                  />
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="order-1 lg:order-2 space-y-8">
              {/* Header Section */}
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-red-50 rounded-full">
                  <span className="text-red-600 font-semibold text-sm">
                    🏠 At Your Doorstep
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight">
                  Two-Wheeler Services at{" "}
                  <span className="text-red-600 relative">
                    Home
                    <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
                  </span>
                </h2>

                <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl">
                  Get professional periodic bike service at your convenience.
                  From engine repair to battery replacement, wheel and tyre care
                  - we bring quality service to your doorstep at unbeatable
                  prices.
                </p>
              </div>

              {/* Services Grid */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                    </span>
                    Our Services
                  </h3>
                  <Link to="/services" className="text-red-600 font-semibold text-sm hover:text-red-800">
                    View All ›
                  </Link>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {HOME_SERVICES.map((service) => (
                    <button
                      key={service.key}
                      type="button"
                      onClick={() => openChooser(service)}
                      className="group border border-gray-200 hover:border-red-600 hover:bg-red-50 rounded-xl py-3 px-1 flex flex-col items-center text-center gap-2 transition-colors"
                    >
                      <img src={service.icon} alt="" aria-hidden="true" className="w-12 h-12 object-contain" />
                      <span className="font-bold text-gray-900 text-[11px] sm:text-xs leading-tight">
                        {service.line1}
                        <br />
                        {service.line2}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Mechanic Near You */}
      <section className="bg-gray-50 py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Live Mechanic Near You</h2>
            <Link to="/booking" className="text-red-600 font-semibold text-sm hover:text-red-800 hidden sm:block">
              View on Map ›
            </Link>
          </div>
          <div className="grid md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-3 rounded-2xl overflow-hidden h-56 sm:h-64">
              <PublicMechanicMap onCount={handleCount} />
            </div>
            <div className="md:col-span-2 space-y-6">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {nearbyCount === null
                    ? "Checking…"
                    : `${nearbyCount} ${nearbyCount === 1 ? "Mechanic" : "Mechanics"}`}
                </p>
                <p className="text-green-600 font-semibold">
                  {nearbyCount ? "online near you" : "none online right now"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Avg. Arrival Time</p>
                <p className="text-2xl font-bold text-gray-900">25-30 mins</p>
              </div>
              <button
                type="button"
                onClick={() => openChooser(null)}
                className="w-full text-center bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-full transition-colors"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription */}
      {plan && (
        <section className="bg-white py-16 md:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <SubscriptionPlanCard plan={plan} />

            <div className="mt-6 border border-gray-200 rounded-2xl p-5 sm:p-6 flex flex-wrap items-center gap-5">
              <span className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <i className="ri-shield-check-line text-red-600 text-2xl" />
              </span>
              <p className="flex-1 min-w-[220px] font-extrabold text-gray-900 leading-snug">
                MORE CARE. MORE SAVINGS.{" "}
                <span className="text-red-600">ZERO WORRIES.</span>
              </p>
              <Link
                to="/subscription"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3 rounded-xl transition-colors"
              >
                GET SUBSCRIBED
                <i className="ri-arrow-right-line" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trust bar */}
      <section className="bg-white pb-16 md:pb-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {TRUST_ITEMS.map((t) => (
            <div
              key={t.value}
              className="border border-gray-200 rounded-2xl py-5 px-3 flex flex-col items-center text-center"
            >
              <img src={t.icon} alt="" aria-hidden="true" className="w-12 h-12 object-contain" />
              <p className="text-red-600 font-extrabold text-sm mt-3">{t.value}</p>
              <p className="text-gray-800 text-xs sm:text-sm mt-1 leading-tight">{t.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: How it Works */}
      <section className="min-h-screen bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-red-100 max-w-2xl mx-auto leading-relaxed">
              Simple 3-step process to get your bike serviced or repaired
            </p>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: "1",
                  title: "Book Service",
                  desc: "select required service",
                  image: "/images/booking.png",
                },
                {
                  step: "2",
                  title: "Get Assistance",
                  desc: "Mechanic arrives at your location",
                  image: "/images/hero-img.png",
                },
                {
                  step: "3",
                  title: "Ride Safe",
                  desc: "continue your journey",
                  image: "/images/safe-ride.png",
                },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-2xl ">
                    {/* Step Number Circle */}
                    <div className="w-16 h-16 bg-white text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10">
                      {item.step}
                    </div>

                    {/* Image */}
                    <div className="mb-6 overflow-hidden rounded-xl">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-40 sm:h-48 object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-xl sm:text-2xl font-bold mb-4 group-hover:text-red-100 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-red-100 text-sm sm:text-base leading-relaxed group-hover:text-white transition-colors duration-300">
                        {item.desc}
                      </p>
                    </div>

                    {/* Hover arrow indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <i className="ri-arrow-right-up-line text-white text-xl"></i>
                    </div>
                  </div>

                  {/* Connection Arrow - Only show between cards on desktop */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 -right-6 lg:-right-8 z-20">
                      <div className="flex items-center">
                        <div className="w-8 lg:w-12 h-0.5 bg-white/60"></div>
                        <i className="ri-arrow-right-line text-white/60 text-xl ml-1"></i>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Flow Indicators */}
            <div className="md:hidden flex justify-center mt-6 space-x-2">
              {[1, 2, 3].map((dot, i) => (
                <div key={i} className="w-2 h-2 bg-white/40 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Testimonials */}
      <section className="min-h-screen bg-white flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              What Our <span className="text-red-600">Customers Say</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              Real feedback from satisfied customers who trust our doorstep bike
              service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Priya Sharma",
                location: "Mumbai",
                rating: 5,
                comment:
                  "Amazing service! They came to my office and fixed my bike in 30 minutes. Very professional and transparent pricing.",
              },
              {
                name: "Rohit Verma",
                location: "Delhi",
                rating: 5,
                comment:
                  "Called them for roadside assistance at 2 AM. They reached in 15 minutes and got my bike running. Highly recommend!",
              },
              {
                name: "Anita Patel",
                location: "Bangalore",
                rating: 5,
                comment:
                  "Regular customer for 2 years. Always on time, genuine parts, and fair pricing. Best bike service in the city!",
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-red-50 to-white p-6 sm:p-8 rounded-2xl border border-red-100 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {testimonial.location}
                    </p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed italic">
                  "{testimonial.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BookNowChooser
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        serviceType={chooserService}
      />
    </div>
  );
};

export default Home;
