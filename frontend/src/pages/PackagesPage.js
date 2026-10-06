import React, { useEffect, useState } from "react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Packages from "@/components/site/Packages";
import { publicApi } from "@/lib/api";
import SEO from "@/components/site/SEO";

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    publicApi.getPackages().then(setPackages);
    publicApi.getSiteSettings().then(setSettings);
  }, []);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://constructons.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Packages",
        item: "https://constructons.com/packages",
      },
    ],
  };

  return (
    <>
      <SEO
        title="Construction Packages & Pricing Plans"
        description="Explore transparent house construction packages in India starting from ₹1,499/sqft. Compare standard, premium, and luxury building plans with complete material specifications and zero hidden costs."
        canonical="/packages"
        keywords="home construction packages, house construction cost per sq ft, construction price per sqft India, building packages, turnkey construction rates, house building cost"
        structuredData={breadcrumbSchema}
      />
      
      <Header />
      <Packages packages={packages} />
      <Footer settings={settings} />
    </>
  );
}