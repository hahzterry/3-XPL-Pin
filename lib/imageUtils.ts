// Image format detection and validation utilities

export interface ImageInfo {
  url: string;
  type: string;
  format: string;
  isValid: boolean;
}

// Detect image format from URL
export const detectImageFormat = (url: string): string => {
  const lowercaseUrl = url.toLowerCase();
  
  if (lowercaseUrl.includes('.jpg') || lowercaseUrl.includes('.jpeg')) return 'jpeg';
  if (lowercaseUrl.includes('.png')) return 'png';
  if (lowercaseUrl.includes('.svg')) return 'svg';
  if (lowercaseUrl.includes('.webp')) return 'webp';
  if (lowercaseUrl.includes('.gif')) return 'gif';
  if (lowercaseUrl.includes('.bmp')) return 'bmp';
  if (lowercaseUrl.includes('.tiff') || lowercaseUrl.includes('.tif')) return 'tiff';
  
  // Check for data URLs
  if (lowercaseUrl.startsWith('data:image/')) {
    const match = lowercaseUrl.match(/data:image\/([^;]+)/);
    return match ? match[1] : 'unknown';
  }
  
  // Check for IPFS or common NFT hosting patterns
  if (lowercaseUrl.includes('ipfs://') || lowercaseUrl.includes('ipfs.')) return 'ipfs';
  if (lowercaseUrl.includes('arweave.net')) return 'arweave';
  
  return 'unknown';
};

// Validate image URL and get metadata
export const validateImageUrl = async (url: string): Promise<ImageInfo> => {
  const format = detectImageFormat(url);
  
  try {
    // For IPFS URLs, convert to HTTP gateway
    let processedUrl = url;
    if (url.startsWith('ipfs://')) {
      processedUrl = url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    const response = await fetch(processedUrl, { 
      method: 'HEAD'
    });
    
    const contentType = response.headers.get('content-type') || '';
    const isValidImage = response.ok && (
      contentType.includes('image/jpeg') ||
      contentType.includes('image/jpg') ||
      contentType.includes('image/png') ||
      contentType.includes('image/svg') ||
      contentType.includes('image/webp') ||
      contentType.includes('image/gif') ||
      contentType.includes('image/bmp') ||
      contentType.includes('image/tiff')
    );
    
    return {
      url: processedUrl,
      type: contentType,
      format,
      isValid: isValidImage
    };
  } catch (error) {
    console.warn(`Failed to validate image: ${url}`, error);
    
    // Still return the URL - it might work even if validation failed
    return {
      url,
      type: 'unknown',
      format,
      isValid: false
    };
  }
};

// Batch validate multiple image URLs
export const validateImageUrls = async (urls: string[]): Promise<ImageInfo[]> => {
  const validationPromises = urls.map(url => validateImageUrl(url));
  return Promise.all(validationPromises);
};

// Check if image format is supported by Next.js Image component
export const isNextImageSupported = (format: string): boolean => {
  const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
  return supportedFormats.includes(format.toLowerCase());
};

// Generate fallback image URL
export const generateFallbackImage = (
  text: string, 
  width: number = 150, 
  height: number = 150,
  bgColor: string = '4ECDC4',
  textColor: string = 'FFFFFF'
): string => {
  return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
};
