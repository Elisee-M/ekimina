import { useEffect } from "react";

export function usePageSeo(params: {
  title: string;
  description?: string;
  canonicalPath?: string;
}) {
  const { title, description, canonicalPath } = params;

  useEffect(() => {
    document.title = title;

    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", description);
    }

    if (canonicalPath) {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        const url = new URL(canonicalPath, window.location.origin).toString();
        canonical.setAttribute("href", url);
      }
    }
  }, [title, description, canonicalPath]);
}
