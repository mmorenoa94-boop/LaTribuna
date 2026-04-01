// @ts-expect-error next-pwa types
import withPWA from 'next-pwa'

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerDir: 'worker',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font\.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-font-assets', expiration: { maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60 } },
    },
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'cloudinary-images',
        expiration: { maxEntries: 128, maxAgeSeconds: 30 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-image-assets', expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 } },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'next-image', expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 } },
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: 'CacheFirst',
      options: { cacheName: 'static-audio-assets', expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 } },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-js-assets', expiration: { maxEntries: 48, maxAgeSeconds: 24 * 60 * 60 } },
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-style-assets', expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 } },
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'next-data', expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 } },
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      method: 'GET',
      options: { cacheName: 'apis', expiration: { maxEntries: 16, maxAgeSeconds: 24 * 60 * 60 }, networkTimeoutSeconds: 10 },
    },
    {
      urlPattern: /.*/i,
      handler: 'NetworkFirst',
      options: { cacheName: 'others', expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 }, networkTimeoutSeconds: 10 },
    },
  ],
})

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'media.api-sports.io' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

export default pwaConfig(nextConfig)
