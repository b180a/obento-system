/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopackがビルド時に悪影響を与えるのを防ぐため、標準のWebpackを使用するようにします
  // (現在のNext-on-Cloudflareのビルドスタックではこちらの方が安定します)
};

export default nextConfig;
