/**
 * The eight services shown on the home grid, in the order the design lays them
 * out. Kept identical to the app's src/data/homeServices.ts so the website and
 * the app show the same set, in the same order, with the same icons.
 *
 * `serviceType` is what the booking form sends to the API; `emergency` routes
 * the customer down the emergency flow instead of the doorstep one.
 */
export const HOME_SERVICES = [
  { key: "general-service", line1: "General", line2: "Service", icon: "/images/services/general-service.png", serviceType: "general-service" },
  { key: "tyre-puncture", line1: "Tyre", line2: "Puncture", icon: "/images/services/tyre-puncture.png", serviceType: "puncture-repair" },
  { key: "tyre-replacement", line1: "Tyre", line2: "Replacement", icon: "/images/services/tyre-replacement.png", serviceType: "tyre-replace" },
  { key: "starting-problem", line1: "Starting", line2: "Problem", icon: "/images/services/starting-problem.png", serviceType: "starting-problem" },
  { key: "emergency-assistance", line1: "Emergency", line2: "Assistance", icon: "/images/services/emergency-assistance.png", serviceType: "emergency-repair", emergency: true },
  { key: "brake-service", line1: "Brake", line2: "Service", icon: "/images/services/brake-service.png", serviceType: "brake-service" },
  { key: "oil-change", line1: "Oil", line2: "Change", icon: "/images/services/oil-change.png", serviceType: "oil-change" },
  { key: "battery-change", line1: "Battery", line2: "Change", icon: "/images/services/battery-change.png", serviceType: "battery-change" },
];

export const TRUST_ITEMS = [
  { icon: "/images/services/trust-customers.png", value: "10,000+", label: "Happy Customers" },
  { icon: "/images/services/trust-warranty.png", value: "1 MONTH", label: "Service Warranty" },
  { icon: "/images/services/trust-pricing.png", value: "TRANSPARENT", label: "Pricing" },
  { icon: "/images/services/trust-rating.png", value: "4.8 RATING", label: "Trained & Expert Mechanic" },
];
