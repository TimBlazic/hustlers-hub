/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com", // Za placeholder slike
      "avatars.githubusercontent.com", // Za GitHub avatarje
      "lh3.googleusercontent.com", // Za Google avatarje
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Dovoli vse domene za razvoj
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
