import type { NextConfig } from "next";
const config: NextConfig = {
  // Invitation/recovery URLs contain one-time tokens. Keep them out of dev logs.
  logging: {
    incomingRequests: { ignore: [/\/auth\/confirm/] },
    fetches: { fullUrl: false },
  },
};
export default config;
