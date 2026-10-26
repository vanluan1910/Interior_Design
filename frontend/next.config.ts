import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/san-pham",
        destination: "/products",
        permanent: true,
      },
      {
        source: "/san-pham/:id",
        destination: "/products/:id",
        permanent: true,
      },
      {
        source: "/gio-hang",
        destination: "/cart",
        permanent: true,
      },
      {
        source: "/dang-nhap",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/dang-ky",
        destination: "/register",
        permanent: true,
      },
      {
        source: "/thanh-toan",
        destination: "/checkout",
        permanent: true,
      },
      {
        source: "/thong-tin-ca-nhan",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/phong-khach",
        destination: "/living-room",
        permanent: true,
      },
      {
        source: "/danh-muc",
        destination: "/categories",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const cleanBackendUrl = backendUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${cleanBackendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${cleanBackendUrl}/uploads/:path*`,
      },
      {
        source: "/swagger/:path*",
        destination: `${cleanBackendUrl}/swagger/:path*`,
      },
      {
        source: "/openapi/:path*",
        destination: `${cleanBackendUrl}/openapi/:path*`,
      },
    ];
  },
};

export default nextConfig;
