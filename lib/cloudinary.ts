import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
}

// ── Folder-specific transformations for optimal file size ─────────────────────
// Each folder gets dimensions and crop mode tuned to its use case.
const FOLDER_TRANSFORMS: Record<string, { width: number; height: number; crop: string }> = {
  avatars:  { width: 200,  height: 200,  crop: 'fill' },   // profile pics — small circle
  logos:    { width: 400,  height: 400,  crop: 'limit' },   // business logos — square, keep aspect
  banners:  { width: 1200, height: 400,  crop: 'fill' },    // league banners — wide strip
  rewards:    { width: 600,  height: 600,  crop: 'limit' },   // reward images — medium square
  promotions: { width: 800,  height: 400,  crop: 'fill' },    // promo images — wide card
  general:    { width: 800,  height: 800,  crop: 'limit' },   // fallback
}

/**
 * Upload a buffer to Cloudinary with folder-specific optimizations.
 * - Auto-format (WebP/AVIF where supported)
 * - Auto-quality compression
 * - Folder-specific dimensions and crop
 * @param buffer - Image buffer
 * @param folder - Cloudinary folder (avatars, logos, rewards, banners)
 * @param publicId - Optional custom public ID
 */
export async function uploadImage(
  buffer: Buffer,
  folder: string = 'general',
  publicId?: string
): Promise<UploadResult> {
  const transform = FOLDER_TRANSFORMS[folder] ?? FOLDER_TRANSFORMS.general

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `latribuna/${folder}`,
        public_id: publicId,
        transformation: [
          { width: transform.width, height: transform.height, crop: transform.crop, gravity: 'auto' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
        resource_type: 'image',
        overwrite: true,
      },
      (error, result) => {
        if (error) reject(new Error(error.message || JSON.stringify(error)))
        else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          })
        }
      }
    )
    uploadStream.end(buffer)
  })
}

/**
 * Delete an image from Cloudinary by public ID.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
