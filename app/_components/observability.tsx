"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { trackProductEvent } from "@/lib/analytics";

let initialized = false;

export function Observability() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || initialized) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      ui_host: "https://eu.posthog.com",
      persistence: "memory",
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      opt_out_capturing_by_default: false,
      respect_dnt: true,
      sanitize_properties(properties) {
        delete properties.$current_url;
        delete properties.$pathname;
        delete properties.$referrer;
        delete properties.$referring_domain;
        return properties;
      },
    });
    initialized = true;
    if (window.location.pathname === "/") void trackProductEvent("homepage_viewed", { source: "direct_or_referral" });
  }, []);

  return null;
}
