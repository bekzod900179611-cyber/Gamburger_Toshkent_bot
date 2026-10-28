/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mini App to'liq statik sayt bo'lib yig'iladi (out/ papkasi) —
  // istalgan HTTPS hostingga (Vercel, Netlify, Cloudflare Pages) qo'yish mumkin.
  output: 'export',
  // Yuqori papkalarda boshqa package-lock bo'lgani uchun loyiha ildizini aniq ko'rsatamiz
  outputFileTracingRoot: import.meta.dirname,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
