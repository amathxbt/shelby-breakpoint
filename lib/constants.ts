export const UPLOAD_ALLOWLIST_ADDRESSES =
  process.env.NEXT_PUBLIC_UPLOAD_ALLOWLIST_ADDRESSES?.split(",") ?? [];

// reCAPTCHA v3 verification
export const RECAPTCHA_VERIFY_URL =
  "https://www.google.com/recaptcha/api/siteverify";
// Lower threshold to accommodate in-app browsers/webviews which often have lower scores
export const RECAPTCHA_SCORE_THRESHOLD = 0.4;

export const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
export const NEXT_PUBLIC_RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
