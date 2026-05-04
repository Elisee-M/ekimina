import { useEffect } from "react";

interface PageSeoParams {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, unknown>;
}

export function usePageSeo(params: PageSeoParams) {
  const { title, description, canonicalPath, ogImage, ogType, jsonLd } = params;

  useEffect(() => {
    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };

    if (description) {
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
      setMeta('meta[name="twitter:description"]', "content", description);
    }

    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[name="twitter:title"]', "content", title);

    if (ogType) {
      setMeta('meta[property="og:type"]', "content", ogType);
    }

    if (ogImage) {
      setMeta('meta[property="og:image"]', "content", ogImage);
      setMeta('meta[name="twitter:image"]', "content", ogImage);
    }

    if (canonicalPath) {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        const url = new URL(canonicalPath, window.location.origin).toString();
        canonical.setAttribute("href", url);
        setMeta('meta[property="og:url"]', "content", url);
      }
    }

    // JSON-LD structured data
    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(scriptEl);
    }

    return () => {
      if (scriptEl) {
        document.head.removeChild(scriptEl);
      }
    };
  }, [title, description, canonicalPath, ogImage, ogType, jsonLd]);
}
