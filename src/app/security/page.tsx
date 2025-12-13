import { Button } from "@/components/ui/button";
import { Shield, Lock, Server, CheckCircle } from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-6">
          <Shield className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Security at BeautyHQ
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your data security is our top priority. Learn about the measures
          we take to protect your business and client information.
        </p>
      </section>

      {/* Security Features */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6">
            <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Data Encryption</h3>
            <p className="text-gray-600">
              All data is encrypted in transit (TLS 1.3) and at rest (AES-256).
            </p>
          </div>

          <div className="text-center p-6">
            <div className="p-4 bg-purple-100 rounded-full w-fit mx-auto mb-4">
              <Server className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Secure Infrastructure</h3>
            <p className="text-gray-600">
              Hosted on AWS with SOC 2 Type II certified data centers.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Regular Audits</h3>
            <p className="text-gray-600">
              Third-party security audits and penetration testing quarterly.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Compliance & Certifications</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white p-6 rounded-xl flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold">SOC 2 Type II</h3>
                <p className="text-gray-600">Audited controls for security, availability, and confidentiality.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold">GDPR Compliant</h3>
                <p className="text-gray-600">Full compliance with European data protection regulations.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold">PCI DSS Level 1</h3>
                <p className="text-gray-600">Highest level of payment card security through Stripe.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold">CCPA Compliant</h3>
                <p className="text-gray-600">California Consumer Privacy Act compliance.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Security Questions?</h2>
        <p className="text-gray-600 mb-8">
          Contact our security team at security@beautyhq.io
        </p>
        <Button variant="outline" asChild>
          <Link href="/contact">Contact Us</Link>
        </Button>
      </section>

      <PublicFooter />
    </div>
  );
}
