/**
 * Image optimization utility for Cloudinary and other images
 */

/**
 * Optimize Cloudinary image URL with transformations
 * @param {string} url - Original image URL
 * @param {Object} options - Optimization options
 * @param {number} options.width - Desired width
 * @param {number} options.height - Desired height
 * @param {string} options.quality - Image quality (auto, best, good, eco, low)
 * @param {string} options.format - Image format (auto, webp, jpg, png)
 * @param {string} options.crop - Crop mode (fill, fit, scale, thumb)
 * @returns {string} Optimized image URL
 */
export const optimizeImageUrl = (url, options = {}) => {
  if (!url) return url;

  const {
    width = 800,
    height = 600,
    quality = 'auto',
    format = 'auto',
    crop = 'limit',
  } = options;

  // If it's a Cloudinary URL, add transformations
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    const transformation = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;
    return url.replace('/upload/', `/upload/${transformation}/`);
  }

  // Return original URL if not Cloudinary
  return url;
};

/**
 * Optimize avatar image URL (small, square, face-focused)
 */
export const optimizeAvatarUrl = (url) => {
  return optimizeImageUrl(url, {
    width: 100,
    height: 100,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
};

/**
 * Optimize property image URL (medium size, maintain aspect ratio)
 */
export const optimizePropertyImageUrl = (url) => {
  return optimizeImageUrl(url, {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto',
    format: 'auto',
  });
};

/**
 * Optimize thumbnail image URL (small, square)
 */
export const optimizeThumbnailUrl = (url) => {
  return optimizeImageUrl(url, {
    width: 200,
    height: 200,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
};

export default {
  optimizeImageUrl,
  optimizeAvatarUrl,
  optimizePropertyImageUrl,
  optimizeThumbnailUrl,
};

