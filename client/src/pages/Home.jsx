import React from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";

const TRUST_STATS = [
  { icon: "ri-team-fill", value: "10,000+", label: "Happy Customers" },
  { icon: "ri-shield-check-fill", value: "3 Months", label: "Service Warranty" },
  { icon: "ri-price-tag-3-fill", value: "Transparent", label: "Pricing" },
  { icon: "ri-award-fill", value: "Trained &", label: "Verified Experts" },
];

const Home = () => {
  const services = [
    {
      icon: "ri-drop-fill",
      title: "Oil Change",
      color: "text-orange-600",
      bg: "from-orange-50 to-orange-100 group-hover:from-orange-600 group-hover:to-orange-700",
      link: "/doorstep-service",
    },
    {
      icon: "ri-tools-fill",
      title: "General Repair",
      color: "text-red-600",
      bg: "from-red-50 to-red-100 group-hover:from-red-600 group-hover:to-red-700",
      link: "/doorstep-service",
    },
    {
      icon: "ri-disc-fill",
      title: "Puncture Repair",
      color: "text-blue-600",
      bg: "from-blue-50 to-blue-100 group-hover:from-blue-600 group-hover:to-blue-700",
      link: "/doorstep-service",
    },
    {
      icon: "ri-flashlight-fill",
      title: "Battery Service",
      color: "text-amber-600",
      bg: "from-amber-50 to-amber-100 group-hover:from-amber-600 group-hover:to-amber-700",
      link: "/doorstep-service",
    },
    {
      icon: "ri-sparkling-2-fill",
      title: "Spare Parts",
      color: "text-cyan-600",
      bg: "from-cyan-50 to-cyan-100 group-hover:from-cyan-600 group-hover:to-cyan-700",
      link: "/spare-parts",
    },
  ];

  return (
    <div className="bg-white">
      <Hero />

      {/* Section 2: Services */}
      <section className="bg-white py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Left Content - Mobile Mockup */}
            <div className="flex justify-center lg:justify-start order-2 lg:order-1">
              <div className="relative group">
                <div className="relative bg-white p-2 rounded-2xl shadow-2xl">
                  <img
                    src="/images/services.png"
                    className="rounded-xl max-w-full h-auto transform group-hover:scale-[1.02] transition-transform duration-300"
                    alt="Two-Wheeler Services"
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

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 md:gap-6">
                  {services.map((service, index) => (
                    <Link
                      key={index}
                      to={service.link}
                      className="group cursor-pointer flex flex-col items-center text-center"
                    >
                      <div
                        className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${service.bg} rounded-2xl flex items-center justify-center transition-all duration-300 mb-2`}
                      >
                        <i
                          className={`${service.icon} text-2xl md:text-3xl ${service.color} group-hover:text-white transition-colors duration-300`}
                        ></i>
                      </div>
                      <h4 className="font-semibold text-gray-900 text-xs md:text-sm leading-tight group-hover:text-red-700 transition-colors duration-300">
                        {service.title}
                      </h4>
                    </Link>
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
            <div className="md:col-span-3 relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 h-56 sm:h-64">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              ></div>
              {[
                { top: "30%", left: "20%" },
                { top: "20%", left: "48%" },
                { top: "48%", left: "68%" },
                { top: "68%", left: "40%" },
              ].map((pos, i) => (
                <div
                  key={i}
                  className="absolute w-9 h-9 -ml-4 -mt-4 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center"
                  style={pos}
                >
                  <i className="ri-user-fill text-white text-sm"></i>
                </div>
              ))}
            </div>
            <div className="md:col-span-2 space-y-6">
              <div>
                <p className="text-2xl font-bold text-gray-900">4 Mechanics</p>
                <p className="text-green-600 font-semibold">near you</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Avg. Arrival Time</p>
                <p className="text-2xl font-bold text-gray-900">25-30 mins</p>
              </div>
              <Link
                to="/booking"
                className="block text-center bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-full transition-colors"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-red-900 py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {TRUST_STATS.map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-2">
              <i className={`${t.icon} text-2xl text-white`}></i>
              <p className="text-white font-bold">{t.value}</p>
              <p className="text-red-200 text-xs sm:text-sm font-medium">{t.label}</p>
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
    </div>
  );
};

export default Home;
