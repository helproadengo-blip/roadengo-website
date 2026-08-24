import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Section = ({ n, title, children }) => (
  <>
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
        <span className="bg-red-100 text-red-800 text-sm font-bold px-2 py-1 rounded mr-3">{n}</span>
        {title}
      </h2>
      {children}
    </section>
    <hr className="border-gray-200" />
  </>
);

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const handleLinkClick = (e, path) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      navigate(path);
    }, 300);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden">

        {/* Header Section */}
        <div className="bg-red-800 text-white p-6 sm:p-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-wide">
            Privacy Policy
          </h1>
          <p className="mt-2 text-red-100 text-sm sm:text-base">
            Your privacy is important to us. Here is how we handle your data.
          </p>
          <p className="mt-3 text-red-200 text-xs sm:text-sm">
            Last updated: 21 August 2026
          </p>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-10 space-y-8 text-gray-700 leading-relaxed">

          <Section n="1" title="Introduction">
            <p>
              Welcome to <strong>Roadengo</strong>. We value the trust you place in us and recognize
              the importance of secure transactions and information privacy. This Privacy Policy
              describes how Roadengo collects, uses, shares, and protects your personal information.
            </p>
            <p className="mt-2">
              This policy applies to both the Roadengo website at{" "}
              <strong>www.roadengo.com</strong> and the <strong>Roadengo mobile application</strong>{" "}
              (package name <code className="bg-gray-100 px-1 rounded text-sm">com.roadengo.app</code>),
              which is used by customers to book services and by our mechanics to receive and complete jobs.
            </p>
          </Section>

          <Section n="2" title="Information We Collect">
            <p className="mb-2">We collect the following types of information to provide our services:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Personal Information:</strong> Name, phone number, email address, and physical
                address provided during booking or registration.
              </li>
              <li>
                <strong>Vehicle Information:</strong> Bike brand, model, and service history.
              </li>
              <li>
                <strong>Location Data:</strong> Your booking location, so a mechanic can reach you. If
                you use the app as a <strong>mechanic</strong>, the app shares your device location with
                our dispatch team while you are marked <strong>Online</strong>, so that customers and
                admin can see live job progress.
              </li>
              <li>
                <strong>Photos and Identity Documents (mechanics only):</strong> Mechanics upload a
                profile photograph and images of their Aadhaar card for identity verification (KYC).
                Customers are never asked to upload photos or identity documents.
              </li>
              <li>
                <strong>Booking and Billing Records:</strong> Services requested, parts used, bill
                amounts, job status and ratings you submit.
              </li>
              <li>
                <strong>Device Information:</strong> A push notification token, used only to deliver
                booking alerts and status updates to your device.
              </li>
            </ul>
          </Section>

          <Section n="3" title="App Permissions and Why We Need Them">
            <p className="mb-2">
              The Roadengo mobile app requests the following permissions. You may decline any of them;
              the app will continue to work, but the related feature will be unavailable.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Location (while the app is in use):</strong> To dispatch a mechanic to the
                correct place, to calculate distance to a job, and to show live mechanic position on the
                map. We use <strong>foreground location only</strong> &mdash; the app does{" "}
                <strong>not</strong> track your location in the background or when it is closed.
              </li>
              <li>
                <strong>Photos / Media:</strong> Only so that a mechanic can select a profile photo and
                Aadhaar KYC images from their gallery to upload. The app does not scan, read or upload
                any other photo from your device.
              </li>
              <li>
                <strong>Notifications:</strong> To alert mechanics about new bookings assigned to them,
                and to inform customers about booking and service status.
              </li>
            </ul>
            <p className="mt-2">
              The app does <strong>not</strong> request access to your camera, microphone, contacts,
              call logs or SMS messages.
            </p>
          </Section>

          <Section n="4" title="How We Use Your Information">
            <ul className="list-disc pl-5 space-y-2">
              <li>To connect you with nearby mechanics and service providers.</li>
              <li>To process your service requests and generate your bill.</li>
              <li>To communicate with you regarding booking updates, offers, and support.</li>
              <li>To verify the identity of mechanics who work on our platform.</li>
              <li>To improve our platform, services, and user experience.</li>
            </ul>
          </Section>

          <Section n="5" title="Payments">
            <p>
              Payment for a completed service may be made in cash directly to the mechanic, or online
              using UPI. When you choose to pay online, the payment is completed inside your own UPI
              application (such as Google Pay, PhonePe or Paytm). Roadengo{" "}
              <strong>never collects or stores your card number, bank account details, UPI PIN or any
              other financial credentials</strong>. We only record whether a bill has been marked paid.
            </p>
          </Section>

          <Section n="6" title="Sharing of Information">
            <p>We do not sell your personal data. We may share your information with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Service Partners:</strong> The mechanic assigned to your booking receives your
                name, phone number and service address so they can reach you and complete the job.
              </li>
              <li>
                <strong>Service Providers we rely on:</strong> Google Maps (to display maps and provide
                directions), Expo push notification services (to deliver alerts to your device), and our
                cloud hosting and database providers, who store data on our behalf.
              </li>
              <li>
                <strong>Legal Authorities:</strong> If required by law or to protect the rights and
                safety of Roadengo and its users.
              </li>
            </ul>
          </Section>

          <Section n="7" title="Data Retention">
            <p>
              We retain booking, billing and service records for as long as your account is active, and
              afterwards only for as long as needed to meet legal, tax and accounting obligations.
              Mechanic KYC records are retained for the duration of the mechanic&apos;s association with
              Roadengo. Note that we store only the <strong>last four digits</strong> of a
              mechanic&apos;s Aadhaar number &mdash; the full Aadhaar number is never saved.
            </p>
          </Section>

          <Section n="8" title="Your Rights and How to Delete Your Data">
            <p className="mb-2">You may at any time ask us to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>See what personal information we hold about you.</li>
              <li>Correct information that is wrong or out of date.</li>
              <li>Delete your account and the personal information associated with it.</li>
            </ul>
            <p className="mt-3">
              To make any of these requests, email{" "}
              <strong className="text-gray-900">support@roadengo.com</strong> from your registered email
              address, or call <strong className="text-gray-900">+91 7900900744</strong>, with the
              subject &ldquo;Data Deletion Request&rdquo;. We will action verified requests within{" "}
              <strong>30 days</strong>. Records we are legally required to keep (such as invoices for tax
              purposes) may be retained after deletion of your account.
            </p>
          </Section>

          <Section n="9" title="Data Security">
            <p>
              We implement appropriate technical and organizational security measures to protect your
              data from unauthorized access, loss, or misuse. All data transmitted between the app or
              website and our servers is encrypted in transit using HTTPS. However, no internet
              transmission is completely secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section n="10" title="Children's Privacy">
            <p>
              Roadengo is intended for users aged 18 and above. We do not knowingly collect personal
              information from children. If you believe a child has provided us with personal
              information, please contact us and we will delete it.
            </p>
          </Section>

          <Section n="11" title="Updates to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this
              page along with a revised &ldquo;Last updated&rdquo; date, and your continued use of the
              service constitutes acceptance of the modified terms.
            </p>
          </Section>

          {/* Section 12 — last one, no trailing rule */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <span className="bg-red-100 text-red-800 text-sm font-bold px-2 py-1 rounded mr-3">12</span>
              Contact Us
            </h2>
            <p className="mb-2">
              If you have any questions or concerns regarding this Privacy Policy, please contact us at:
            </p>
            <p className="font-medium text-gray-900">
              📧 support@roadengo.com <br />
              📞 +91 7900900744 <br />
              📍 Lakshar road near Sati Kund, Haridwar, Uttarakhand 249408, India
            </p>
          </section>

        </div>

        {/* Footer / Back Button */}
        <div className="bg-gray-100 p-6 flex justify-center">
          <Link
            onClick={(e) => handleLinkClick(e, "/")}
            className="bg-red-800 hover:bg-red-900 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all transform hover:scale-105"
          >
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
