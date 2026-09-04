import React from "react";

const BENEFIT_ICONS = {
  service: "ri-tools-fill",
  emergency: "ri-alarm-warning-fill",
  validity: "ri-calendar-check-fill",
  location: "ri-map-pin-fill",
};

/**
 * The "Ride Worry-Free" plan card. Shown on the home page and again at the top
 * of the subscription page, so the two never drift apart.
 */
const SubscriptionPlanCard = ({ plan }) => {
  if (!plan) return null;

  return (
    <div className="bg-[#101012] rounded-3xl p-6 sm:p-8 text-white">
      <span className="inline-flex items-center gap-2 bg-[#dcae52] text-[#2a1c05] rounded-lg px-3 py-1.5 text-xs font-extrabold tracking-wide">
        <i className="ri-shield-check-fill" />
        SUBSCRIPTION PLAN
      </span>

      <h3 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight">
        RIDE <span className="text-[#f0353c]">WORRY-FREE</span>
      </h3>
      <p className="text-gray-300 mt-1">{plan.tagline}</p>

      <div className="mt-7 flex flex-col md:flex-row md:items-start gap-7">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {plan.benefits.map((b) => (
            <div key={b.line1} className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <i className={`${BENEFIT_ICONS[b.icon] || "ri-check-line"} text-red-600 text-lg`} />
              </span>
              <span className="text-xs font-bold leading-tight">
                {b.line1}
                <br />
                {b.line2}
              </span>
            </div>
          ))}
        </div>

        <div className="w-full md:w-44 bg-white rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
          <p className="bg-red-600 text-white text-xs font-extrabold tracking-wide text-center py-2">
            SPECIAL OFFER
          </p>
          <div className="text-center px-3 pb-4 pt-3">
            <p className="text-[11px] font-bold text-gray-600 tracking-wide">WORTH</p>
            <p className="text-xl font-extrabold text-gray-900 line-through">₹{plan.worth}</p>
            <p className="inline-block bg-red-600 text-white text-[11px] font-extrabold rounded-full px-3 py-1 my-2">
              NOW ONLY
            </p>
            <p className="text-4xl font-extrabold text-red-600 leading-none">₹{plan.price}</p>
            <p className="mt-3 bg-[#dcae52] text-[#2a1c05] text-[11px] font-extrabold rounded py-1">
              SAVE ₹{plan.worth - plan.price}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-7 border border-white/15 rounded-2xl grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/15">
        {plan.perks.map((p) => (
          <p key={p} className="text-center text-sm py-3 px-2">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlanCard;
