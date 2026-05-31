"use client";

import { useEffect, useState } from "react";

export default function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent);

    const isInStandaloneMode =
      // @ts-ignore
      window.navigator.standalone;

    if (isIOS && !isInStandaloneMode) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-xl bg-blue-600 text-white p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm">
          <p className="font-semibold">
            Install SimplyApply on your iPhone
          </p>
          <p className="text-xs mt-1 opacity-90">
            Tap <b>Share</b> → <b>Add to Home Screen</b> for the best experience.
          </p>
        </div>

        <button
          onClick={() => setShow(false)}
          className="text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}