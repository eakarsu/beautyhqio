import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-gray">
          <h1>Terms of Service</h1>
          <p className="text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using BeautyHQ&apos;s services, you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            BeautyHQ provides a cloud-based salon management platform including appointment
            scheduling, client management, point of sale, and related features.
          </p>

          <h2>3. Account Registration</h2>
          <p>To use our services, you must:</p>
          <ul>
            <li>Be at least 18 years old</li>
            <li>Provide accurate registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Be responsible for all activities under your account</li>
          </ul>

          <h2>4. Subscription and Payments</h2>
          <ul>
            <li>Subscription fees are billed monthly or annually in advance</li>
            <li>All fees are non-refundable except as required by law</li>
            <li>We may change pricing with 30 days notice</li>
            <li>You can cancel your subscription at any time</li>
          </ul>

          <h2>5. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Use the service in compliance with all applicable laws</li>
            <li>Not use the service for any illegal or unauthorized purpose</li>
            <li>Not attempt to gain unauthorized access to any systems</li>
            <li>Maintain accurate client records and obtain necessary consents</li>
          </ul>

          <h2>6. Data Ownership</h2>
          <p>
            You retain ownership of all data you input into the service. We do not claim
            any ownership rights to your data. You grant us a license to use your data
            solely to provide the services.
          </p>

          <h2>7. Service Availability</h2>
          <p>
            We strive for 99.9% uptime but do not guarantee uninterrupted service.
            We may perform maintenance with reasonable notice when possible.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, BeautyHQ shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages.
          </p>

          <h2>9. Termination</h2>
          <p>
            We may terminate or suspend your account for violation of these terms.
            Upon termination, you may request export of your data within 30 days.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the service
            after changes constitutes acceptance of the new terms.
          </p>

          <h2>11. Contact</h2>
          <p>
            For questions about these Terms, contact us at:<br />
            Email: legal@beautyhq.io<br />
            Address: 123 Beauty Street, San Francisco, CA 94105
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
