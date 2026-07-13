"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface ContactUsLabels {
  button: string;
  close: string;
  visitLink: string;
}

/**
 * "Contact us" trigger + modal, admin-configured (title/link/QR code). Reused
 * for both the header (top-right) and footer placements; renders nothing if
 * the admin hasn't enabled the feature or left it fully empty.
 */
export default function ContactUsButton({
  title,
  url,
  qrUrl,
  labels,
  className
}: {
  title: string;
  url: string;
  qrUrl: string;
  labels: ContactUsLabels;
  className: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {labels.button}
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={title || labels.button}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-fg/10 bg-page p-6 text-center shadow-2xl"
            >
              <div className="flex w-full items-start justify-between gap-4">
                <h3 className="text-lg font-semibold">{title || labels.button}</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={labels.close}
                  className="text-fg-subtle transition hover:text-fg"
                >
                  ✕
                </button>
              </div>

              {qrUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt=""
                  className="h-56 w-56 rounded-lg border border-fg/10 bg-white object-contain p-2"
                />
              )}

              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-lg bg-fg px-4 py-2 text-sm font-semibold text-page transition hover:opacity-90"
                >
                  {labels.visitLink}
                </a>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
