// Static invitation pages live in public/<tema>/index.html and use relative asset paths,
// so URLs must end with "/" (trailingSlash) and "/<tema>/" is rewritten to its index.html.
const pages = 'adat-jawa|jawa-red-art|jawa-classic-foto|kirim';

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  async rewrites() {
    return [{ source: `/:page(${pages})/`, destination: '/:page/index.html' }];
  },
  // Media never changes under the same name in practice; let browsers keep it a week and the CDN refresh in the background.
  // ponytail: not fingerprinted, so a replaced file can be stale for up to 7 days; rename the file if that matters.
  async headers() {
    const media = [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=2592000' }];
    return [
      { source: '/:theme(adat-jawa|jawa-red-art|jawa-classic-foto)/img/:file*', headers: media },
      { source: '/assets/foto/:file*', headers: media },
      { source: '/assets/music.mp3', headers: media },
    ];
  },
};
export default nextConfig;
