import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://beautyhq.io";
const SITE_NAME = "BeautyHQ";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BeautyHQ - AI-Powered Salon & Spa Management Software",
    template: "%s | BeautyHQ",
  },
  description:
    "The complete AI-powered platform for beauty and wellness businesses. Smart scheduling, client management, POS, marketing automation, and more. Start your free trial today.",
  keywords: [
    "salon software",
    "spa management",
    "beauty business software",
    "appointment scheduling",
    "salon booking system",
    "spa booking software",
    "beauty salon POS",
    "client management",
    "salon marketing",
    "AI salon software",
    "wellness business management",
    "hair salon software",
    "nail salon software",
    "beauty industry software",
    "salon appointment app",
  ],
  authors: [{ name: "BeautyHQ Team" }],
  creator: "BeautyHQ",
  publisher: "BeautyHQ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "BeautyHQ - AI-Powered Salon & Spa Management Software",
    description:
      "The complete AI-powered platform for beauty and wellness businesses. Smart scheduling, client management, POS, marketing automation, and more.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "BeautyHQ - Salon & Spa Management Software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BeautyHQ - AI-Powered Salon & Spa Management Software",
    description:
      "The complete AI-powered platform for beauty and wellness businesses. Start your free trial today.",
    images: [`${SITE_URL}/og-image.png`],
    creator: "@beautyhq",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
    // yandex: "",
    // yahoo: "",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

// Helper to create page-specific metadata
export function createMetadata({
  title,
  description,
  path = "",
  image,
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image || `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

// Structured data helpers
export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "BeautyHQ",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-powered salon and spa management software for beauty and wellness businesses.",
    url: SITE_URL,
    offers: {
      "@type": "Offer",
      price: "29",
      priceCurrency: "USD",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "1247",
      bestRating: "5",
      worstRating: "1",
    },
    author: {
      "@type": "Organization",
      name: "BeautyHQ",
      url: SITE_URL,
    },
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BeautyHQ",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "The complete AI-powered platform for beauty and wellness businesses.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "2807 Hampton Woods Dr",
      addressLocality: "Richmond",
      addressRegion: "VA",
      postalCode: "23233",
      addressCountry: "US",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-804-360-1129",
      contactType: "customer service",
      email: "support@beautyhq.io",
      availableLanguage: ["English"],
    },
    sameAs: [
      "https://twitter.com/beautyhq",
      "https://facebook.com/beautyhq",
      "https://instagram.com/beautyhq",
      "https://linkedin.com/company/beautyhq",
    ],
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateArticleSchema({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  author,
}: {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: { name: string; url?: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Person",
      name: author.name,
      url: author.url || SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "BeautyHQ",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

export function generateProductSchema({
  name,
  description,
  price,
  image,
}: {
  name: string;
  description: string;
  price: number;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: image || `${SITE_URL}/og-image.png`,
    brand: {
      "@type": "Brand",
      name: "BeautyHQ",
    },
    offers: {
      "@type": "Offer",
      price: price.toString(),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/pricing`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "1247",
    },
  };
}
