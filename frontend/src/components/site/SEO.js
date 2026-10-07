import React from "react";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://[Your Brand]s.com";
const DEFAULT_TITLE = "[Your Brand]s | AI-Powered Home Construction Platform";
const DEFAULT_DESC =
  "[Your Brand]s is India's premium home construction platform. Get transparent packages starting from ₹1,499/sqft, real-time live site tracking, and AI-powered design tools.";
const DEFAULT_IMAGE = `${SITE_URL}/icon.svg`;

export default function SEO({
  title,
  description,
  canonical = "",
  image,
  type = "website",
  noindex = false,
  keywords = "",
  structuredData,
  children,
}) {
  const fullTitle = title ? `${title} | [Your Brand]s` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESC;
  const ogImage = image || DEFAULT_IMAGE;
  const canonicalUrl = canonical
    ? `${SITE_URL}${canonical.startsWith("/") ? canonical : `/${canonical}`}`
    : SITE_URL;

  return (
    <Helmet>
      {/* Primary Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="[Your Brand]s" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {children}
    </Helmet>
  );
}

// Global Organization Schema for Home Page
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "[Your Brand]s",
  url: "https://[Your Brand]s.com",
  logo: "https://[Your Brand]s.com/icon.svg",
  description: DEFAULT_DESC,
  address: {
    "@type": "PostalAddress",
    addressCountry: "IN",
  },
  sameAs: [],
};