import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-gray">
          <h1>Privacy Policy</h1>
          <p className="text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Introduction</h2>
          <p>
            BeautyHQ (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our salon management platform.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Personal Information</h3>
          <p>We may collect personal information that you provide directly to us, including:</p>
          <ul>
            <li>Name, email address, and phone number</li>
            <li>Business information (salon name, address, etc.)</li>
            <li>Payment and billing information</li>
            <li>Client data you input into the system</li>
          </ul>

          <h3>Automatically Collected Information</h3>
          <p>When you use our service, we automatically collect:</p>
          <ul>
            <li>Device information and browser type</li>
            <li>IP address and location data</li>
            <li>Usage patterns and preferences</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and maintain our services</li>
            <li>Process transactions and send related information</li>
            <li>Send administrative messages and updates</li>
            <li>Respond to your comments and questions</li>
            <li>Improve our services and develop new features</li>
            <li>Protect against fraudulent or illegal activity</li>
          </ul>

          <h2>4. Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share your information with:
          </p>
          <ul>
            <li>Service providers who assist in our operations</li>
            <li>Payment processors for transaction handling</li>
            <li>Legal authorities when required by law</li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures including encryption,
            secure servers, and regular security audits to protect your data.
          </p>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Opt out of marketing communications</li>
          </ul>

          <h2>7. Cookies</h2>
          <p>
            We use cookies and similar technologies to improve your experience,
            analyze usage, and assist in our marketing efforts.
          </p>

          <h2>8. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p>
            Email: privacy@beautyhq.io<br />
            Address: 123 Beauty Street, San Francisco, CA 94105
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
