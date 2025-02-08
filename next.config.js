/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ['www.yelp.com', /* other domains */],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default config;
