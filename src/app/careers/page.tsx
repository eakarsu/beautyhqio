import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Briefcase, ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function CareersPage() {
  const jobs = [
    {
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "San Francisco, CA (Hybrid)",
      type: "Full-time",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "AI/ML Engineer",
      department: "Engineering",
      location: "San Francisco, CA",
      type: "Full-time",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Join Our Team
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Help us build the future of beauty and wellness technology.
          We&apos;re looking for passionate people to join our mission.
        </p>
      </section>

      {/* Open Positions */}
      <section className="container mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {jobs.map((job, index) => (
            <Card key={index} className="hover:border-rose-200 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription className="mt-1">{job.department}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    Apply <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-4 mt-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" /> {job.type}
                  </span>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Join BeautyHQ?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Competitive Compensation</h3>
              <p className="text-gray-600">Top-tier salary, equity, and benefits package.</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Flexible Work</h3>
              <p className="text-gray-600">Remote-first culture with optional office space.</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Growth Opportunities</h3>
              <p className="text-gray-600">Learning budget and career development support.</p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
