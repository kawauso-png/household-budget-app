/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // PWA対応（オプション）
  experimental: {
    optimizeCss: true,
  },
  // 圧縮有効化
  compress: true,
  // 静的エクスポート設定（必要に応じて）
  trailingSlash: false,
}

export default nextConfig