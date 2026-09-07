export const movements = {
  "pre-service": "Pre-Service / Announcements",
  "god-calls": "God Calls",
  "god-convicts-and-cleanses": "God Convicts & Cleanses",
  "god-renews": "God Renews",
  "god-sends": "God Sends",
} as const;
export type Movement = keyof typeof movements;
