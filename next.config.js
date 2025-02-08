/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ['www.yelp.com','s3-media3.fl.yelpcdn.com', 's3-media2.fl.yelpcdn.com','s3-media1.fl.yelpcdn.com','s3-media4.fl.yelpcdn.com' /* other domains */],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default config;
