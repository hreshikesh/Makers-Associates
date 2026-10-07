import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { publicApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/site/SEO";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [b, setB] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    publicApi.getBlog(slug).then(setB).catch(() => setB({}));
    publicApi.getSiteSettings().then(setSettings);
  }, [slug]);

  const safeHtml = useMemo(() => {
    if (!b?.content_html) return "";
    // Strict allow-list — no <script>, no event handlers, no iframes.
    return DOMPurify.sanitize(b.content_html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["style", "script", "iframe", "object", "embed"],
      FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
    });
  }, [b]);

  const structuredData = useMemo(() => {
    if (!b || !b.id) return null;
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          "headline": b.title,
          "image": b.cover_image || "https://[Your Brand]s.com/icon.svg",
          "author": {
            "@type": "Person",
            "name": b.author || "[Your Brand]s Team"
          },
          "publisher": {
            "@type": "Organization",
            "name": "[Your Brand]s",
            "logo": {
              "@type": "ImageObject",
              "url": "https://[Your Brand]s.com/icon.svg"
            }
          },
          "description": b.excerpt || b.title,
          "mainEntityOfPage": `https://[Your Brand]s.com/blog/${b.slug}`
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://[Your Brand]s.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Blog",
              "item": "https://[Your Brand]s.com/blog"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": b.title,
              "item": `https://[Your Brand]s.com/blog/${b.slug}`
            }
          ]
        }
      ]
    };
  }, [b]);

  if (!b) return <div className="min-h-screen grid place-items-center"><div className="w-8 h-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" /></div>;

  return (
    <>
      <SEO
        title={b.title ? `${b.title}` : "Blog Article"}
        description={b.excerpt || `${b.title} — insights from the [Your Brand]s team on modern home construction.`}
        canonical={`/blog/${b.slug || slug}`}
        image={b.cover_image}
        type="article"
        keywords="home construction article, architecture design guide, building cost insights, house building tips"
        structuredData={structuredData}
      />

      <Header />
      <main className="pt-28 pb-24">
        <div className="container-wide max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-brand-navy/60 hover:text-brand-orange" data-testid="blog-back-link"><ArrowLeft className="w-4 h-4" /> Back to Blog</Link>
          <div className="section-eyebrow mt-6">Article</div>
          <h1 className="mt-2 text-brand-navy font-bold" data-testid="blog-title">{b.title}</h1>
          <div className="mt-3 flex items-center gap-2 text-xs text-brand-navy/60">
            <span>{b.author}</span>
            <span className="divider-dot" />
            <span>{b.read_minutes} min read</span>
          </div>
          <div className="mt-6 rounded-2xl overflow-hidden aspect-[16/9] bg-brand-bg">
            <img src={b.cover_image} alt={b.title} className="w-full h-full object-cover" />
          </div>
          <article
            data-testid="blog-content"
            className="prose prose-slate mt-6 max-w-none text-brand-navy/80"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}