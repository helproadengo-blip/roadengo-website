import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * "Book Now" never books directly — it first asks whether this is a scheduled
 * general service or a breakdown, because the two go to different flows (and
 * different mechanic queues). Same two choices as the app's home screen.
 */
const BookNowChooser = ({ open, onClose, serviceType }) => {
  const navigate = useNavigate();

  // Escape closes, and the page behind must not scroll while the sheet is up.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const go = (path) => {
    onClose();
    navigate(serviceType ? `${path}?service=${encodeURIComponent(serviceType)}` : path);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-chooser-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="book-chooser-title" className="text-2xl font-extrabold text-gray-900">
              What do you need?
            </h2>
            <p className="text-gray-500 mt-1">Pick a service to continue</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0"
          >
            <i className="ri-close-line text-gray-600 text-xl" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => go("/doorstep-service")}
          className="w-full mt-6 flex items-center gap-4 text-left border-2 border-blue-600 rounded-2xl p-4 hover:bg-blue-50 transition-colors"
        >
          <span className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <i className="ri-home-4-fill text-blue-600 text-2xl" />
          </span>
          <span className="flex-1">
            <span className="block text-lg font-bold text-blue-700">General Service</span>
            <span className="block text-sm text-gray-500">Scheduled service at your doorstep</span>
          </span>
          <i className="ri-arrow-right-s-line text-gray-400 text-2xl" />
        </button>

        <button
          type="button"
          onClick={() => go("/emergency-assistance")}
          className="w-full mt-3 flex items-center gap-4 text-left border-2 border-red-600 rounded-2xl p-4 hover:bg-red-50 transition-colors"
        >
          <span className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <i className="ri-alarm-warning-fill text-red-600 text-2xl" />
          </span>
          <span className="flex-1">
            <span className="block text-lg font-bold text-red-700">Emergency Assistance</span>
            <span className="block text-sm text-gray-500">Broken down? We reach in 30 mins</span>
          </span>
          <i className="ri-arrow-right-s-line text-gray-400 text-2xl" />
        </button>
      </div>
    </div>
  );
};

export default BookNowChooser;
