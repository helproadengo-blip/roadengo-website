import React, { useCallback, useEffect, useState } from "react";
import { apiService } from "../routing/apiClient";
import SubscriptionPlanCard from "../components/SubscriptionPlanCard";

const STATUS_STYLE = {
  active: { cls: "bg-green-100 text-green-700", label: "ACTIVE" },
  pending: { cls: "bg-amber-100 text-amber-700", label: "PAYMENT PENDING" },
  expired: { cls: "bg-gray-100 text-gray-600", label: "EXPIRED" },
  cancelled: { cls: "bg-red-100 text-red-700", label: "CANCELLED" },
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const Subscription = () => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null); // { subscription, upiLink }

  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicleNumber: "",
    vehicleModel: "",
    address: "",
  });
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  // "My subscription" — looked up by phone, so it works for guests too.
  const [lookupPhone, setLookupPhone] = useState("");
  const [mine, setMine] = useState([]);
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    apiService
      .getSubscriptionPlans()
      .then((res) => setPlan(res.data?.plans?.[0] || null))
      .catch(() => setError("Could not load the subscription plan. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const loadMine = useCallback(async (phone) => {
    if (!/^[0-9]{10}$/.test(phone)) return;
    setLookingUp(true);
    try {
      const res = await apiService.getSubscriptionsByPhone(phone);
      setMine(res.data || []);
    } catch {
      setMine([]);
    } finally {
      setLookingUp(false);
    }
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        setCoords({ latitude: c.latitude, longitude: c.longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${c.latitude}&lon=${c.longitude}`
          );
          const data = await res.json();
          if (data?.display_name) setForm((f) => ({ ...f, address: data.display_name }));
        } catch {
          /* coordinates alone are still useful */
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Please enter your name.");
    if (!/^[0-9]{10}$/.test(form.phone.trim())) return setError("Enter a 10-digit mobile number.");
    if (!form.vehicleNumber.trim()) return setError("Please enter your vehicle number.");
    if (!form.address.trim()) return setError("Please enter your location.");

    setSubmitting(true);
    try {
      const res = await apiService.createSubscription({
        planCode: plan.code,
        name: form.name.trim(),
        phone: form.phone.trim(),
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        vehicleModel: form.vehicleModel.trim(),
        address: form.address.trim(),
        location: coords,
      });
      setCreated(res.data);
      setShowForm(false);
      setLookupPhone(form.phone.trim());
      loadMine(form.phone.trim());
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create the subscription. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-red-50 via-white to-pink-50 py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Roadengo <span className="text-red-600">Subscription</span>
          </h1>
          <p className="text-lg text-gray-600 mt-4">
            One yearly plan that covers your services, emergency help and doorstep visits.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        {loading ? (
          <p className="text-center text-gray-500 py-16">Loading the plan…</p>
        ) : (
          <SubscriptionPlanCard plan={plan} />
        )}

        {/* Payment link after a successful sign-up */}
        {created && (
          <div className="mt-8 border-2 border-green-600 bg-green-50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-green-800">
              <i className="ri-check-double-line mr-2" />
              Subscription #{created.subscription.subscriptionNumber} created
            </h2>
            <p className="text-green-800 mt-2">
              Pay ₹{created.subscription.price} to activate it. Your plan turns active as soon as we
              confirm the payment.
            </p>
            {created.upiLink && (
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={created.upiLink}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
                >
                  <i className="ri-bank-card-fill" />
                  Pay ₹{created.subscription.price} by UPI
                </a>
                <span className="inline-flex items-center text-sm text-green-900">
                  or pay to <strong className="ml-1">8958445196@ybl</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {error && !showForm && (
          <p className="mt-6 text-center text-red-600 font-medium">{error}</p>
        )}

        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={!plan}
            className="mt-8 w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-lg font-extrabold rounded-2xl py-5 flex items-center justify-center gap-3 transition-colors"
          >
            GET SUBSCRIBED
            <i className="ri-arrow-right-line" />
          </button>
        ) : (
          <form onSubmit={submit} className="mt-8 border border-gray-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900">Your details</h2>

            <div className="grid sm:grid-cols-2 gap-5 mt-6">
              <div>
                <label htmlFor="sub-name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full name
                </label>
                <input
                  id="sub-name"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Your name"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label htmlFor="sub-phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Mobile number
                </label>
                <input
                  id="sub-phone"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) }))
                  }
                  placeholder="10-digit mobile"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label htmlFor="sub-vehicle" className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle number
                </label>
                <input
                  id="sub-vehicle"
                  value={form.vehicleNumber}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleNumber: e.target.value.toUpperCase() }))}
                  placeholder="UK 08 AB 1234"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label htmlFor="sub-model" className="block text-sm font-semibold text-gray-700 mb-2">
                  Bike model <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="sub-model"
                  value={form.vehicleModel}
                  onChange={set("vehicleModel")}
                  placeholder="e.g. Pulsar 150"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="sub-address" className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <textarea
                id="sub-address"
                rows={3}
                value={form.address}
                onChange={set("address")}
                placeholder="House / street / area"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="mt-3 inline-flex items-center gap-2 text-red-600 font-semibold hover:text-red-700"
              >
                <i className="ri-focus-3-line" />
                {locating ? "Finding you…" : "Use my current location"}
              </button>
            </div>

            {error && <p className="mt-5 text-red-600 font-medium">{error}</p>}

            <div className="mt-7 flex flex-wrap gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 min-w-[220px] bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-lg font-extrabold rounded-2xl py-4 transition-colors"
              >
                {submitting ? "Please wait…" : `PAY ₹${plan?.price} & SUBSCRIBE`}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-8 py-4 rounded-2xl border border-gray-300 font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* My subscription */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">My subscription</h2>
          <p className="text-gray-600 mt-2">
            Enter the mobile number you subscribed with to see your plan and its status.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <input
              aria-label="Mobile number"
              inputMode="numeric"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
              placeholder="10-digit mobile"
              className="flex-1 min-w-[220px] border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="button"
              onClick={() => loadMine(lookupPhone)}
              disabled={lookingUp || lookupPhone.length !== 10}
              className="bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-bold px-7 rounded-xl transition-colors"
            >
              {lookingUp ? "Checking…" : "Check"}
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {mine.map((s) => {
              const st = STATUS_STYLE[s.status] || STATUS_STYLE.cancelled;
              return (
                <div key={s._id} className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{s.planName}</p>
                      <p className="text-sm text-gray-500">
                        #{s.subscriptionNumber} · {s.vehicleNumber}
                      </p>
                    </div>
                    <span className={`text-[11px] font-extrabold rounded-lg px-3 py-1.5 ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="mt-4 grid sm:grid-cols-2 gap-y-2 text-sm">
                    <p className="text-gray-500">
                      Amount <span className="font-bold text-gray-900 ml-2">₹{s.price}</span>
                    </p>
                    {s.status === "active" && (
                      <p className="text-gray-500">
                        Valid till <span className="font-bold text-gray-900 ml-2">{formatDate(s.expiresAt)}</span>
                      </p>
                    )}
                  </div>
                  {s.status === "pending" && s.upiLink && (
                    <a
                      href={s.upiLink}
                      className="mt-4 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
                    >
                      <i className="ri-bank-card-fill" />
                      Pay ₹{s.price} now
                    </a>
                  )}
                </div>
              );
            })}
            {!lookingUp && lookupPhone.length === 10 && mine.length === 0 && (
              <p className="text-gray-500">No subscription found for this number.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Subscription;
