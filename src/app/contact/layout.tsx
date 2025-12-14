import { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Contact Us - Get in Touch with BeautyHQ",
  description:
    "Have questions about BeautyHQ? Contact our team for sales inquiries, support, or partnership opportunities. We respond within 24-48 hours.",
  path: "/contact",
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
