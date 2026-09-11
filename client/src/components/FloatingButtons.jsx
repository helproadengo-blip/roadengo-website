import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // Import useLocation
import { FaWhatsapp, FaPhoneAlt, FaArrowUp } from "react-icons/fa";

const FloatingButtons = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation(); // Get current route

  // Scroll position check karne ke liye
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Logic: Agar route /admin ya /mechanic se start hota hai to null return karein (hide karein)
  if (["/admin", "/mechanic", "/partner"].some((p) => location.pathname.startsWith(p))) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 items-center">
      
      {/* Call Button */}
      <a
        href="tel:+917900900744"
        className="bg-blue-600 text-white p-3.5 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-110 flex items-center justify-center"
        aria-label="Call Us"
        title="Call Now"
      >
        <FaPhoneAlt className="text-xl" />
      </a>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/917900900744"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 text-white p-3.5 rounded-full shadow-lg hover:bg-green-600 transition-transform hover:scale-110 flex items-center justify-center"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
      >
        <FaWhatsapp className="text-2xl" />
      </a>
    </div>
  );
};

export default FloatingButtons;