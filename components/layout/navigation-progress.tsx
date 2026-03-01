"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPathname = useRef(pathname);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Demarrer la barre de progression au clic sur un lien interne
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest("a");
      if (!link || !link.href) return;

      try {
        const url = new URL(link.href, window.location.origin);
        if (
          url.origin === window.location.origin &&
          url.pathname !== window.location.pathname
        ) {
          setLoading(true);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setLoading(false), 5000);
        }
      } catch {
        // URL invalide, ignorer
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Quand le pathname change, la navigation est terminee
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      setLoading(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full bg-brand rounded-r-full"
        style={{
          animation: "nav-progress 2s ease-out forwards",
        }}
      />
    </div>
  );
}
