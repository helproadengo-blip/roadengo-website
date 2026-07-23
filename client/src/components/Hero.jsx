import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const SLIDES = [
  {
    id: "doorstep",
    eyebrow: "EXPERT BIKE REPAIR",
    highlight: "AT YOUR DOORSTEP",
    features: ["Verified Mechanics", "On-time Service", "Best Price Guaranteed"],
    price: "Starting at ₹199",
    image: "/images/hero-img.png",
    to: "/doorstep-service",
  },
  {
    id: "emergency",
    eyebrow: "24/7 EMERGENCY",
    highlight: "ROADSIDE ASSISTANCE",
    features: ["15-30 min arrival", "GPS live tracking", "Trained experts"],
    price: "Starting at ₹349",
    icon: "ri-flashlight-fill",
    to: "/emergency-assistance",
  },
  {
    id: "parts",
    eyebrow: "GENUINE SPARE PARTS",
    highlight: "FITTED AT HOME",
    features: ["100% genuine parts", "Free installation", "Transparent billing"],
    price: "Get a Free Quote",
    icon: "ri-tools-fill",
    to: "/spare-parts",
  },
];

const Hero = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[index];

  return (
    <section className="bg-gradient-to-br from-red-50 via-white to-pink-50 py-10 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl w-full mx-auto">
        {/* Badge + Heading (static, above the carousel) */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center px-4 py-2 bg-red-100 rounded-full text-red-700 font-medium text-sm mb-6">
            <i className="ri-shield-check-line mr-2"></i>
            Trusted by 10,000+ Mechanics
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Professional <span className="text-red-600">Bike Services</span> At Your Doorstep
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mt-6 font-light">
            Expert mechanics, genuine parts, and transparent pricing.
            <span className="font-medium text-gray-800"> Available 24/7 for all your two &amp; three-wheeler needs.</span>
          </p>
        </div>

        {/* Carousel Card */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-[#171717] min-h-[360px] sm:min-h-[420px]">
          <div className="grid lg:grid-cols-2 items-center h-full">
            <div className="p-8 sm:p-12 lg:p-16 order-2 lg:order-1">
              <p className="text-white font-extrabold text-xl sm:text-2xl tracking-wide">{slide.eyebrow}</p>
              <p className="text-red-500 font-extrabold text-2xl sm:text-3xl mt-1">{slide.highlight}</p>
              <div className="mt-6 space-y-2">
                {slide.features.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                      <i className="ri-check-line text-white text-xs"></i>
                    </span>
                    <span className="text-gray-200 text-sm sm:text-base">{f}</span>
                  </div>
                ))}
              </div>
              <Link
                to={slide.to}
                className="inline-block mt-8 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-full transition-colors"
              >
                {slide.price}
              </Link>
            </div>
            <div className="order-1 lg:order-2 h-56 lg:h-full relative">
              {slide.image ? (
                <img src={slide.image} alt={slide.highlight} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className={`${slide.icon} text-[180px] text-white/10`}></i>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-red-600" : "w-2 bg-red-200"}`}
            />
          ))}
        </div>

        {/* Quick CTA row (mirrors app's Book Home Service / Emergency Assistance cards) */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-10 sm:mt-14 max-w-4xl mx-auto">
          <Link
            to="/doorstep-service"
            className="group relative bg-red-600 hover:bg-red-700 transition-colors rounded-2xl p-6 sm:p-8 text-white overflow-hidden"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4">
              <i className="ri-tools-fill text-red-600 text-xl"></i>
            </div>
            <h3 className="text-xl font-bold">Book Home Service</h3>
            <p className="text-red-100 mt-1">We come to you</p>
            <span className="absolute right-6 bottom-6 w-9 h-9 bg-white rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <i className="ri-arrow-right-line text-red-600"></i>
            </span>
          </Link>
          <Link
            to="/emergency-assistance"
            className="group relative bg-red-900 hover:bg-red-950 transition-colors rounded-2xl p-6 sm:p-8 text-white overflow-hidden"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4">
              <i className="ri-alarm-warning-fill text-red-900 text-xl"></i>
            </div>
            <h3 className="text-xl font-bold">Emergency Assistance</h3>
            <p className="text-red-200 mt-1">We'll reach in 30 mins</p>
            <span className="absolute right-6 bottom-6 w-9 h-9 bg-white rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <i className="ri-arrow-right-line text-red-900"></i>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
