// Image Service for automatic image sourcing and optimization
// Integrates with Unsplash API and other image sources

export interface ImageSearchRequest {
  query: string;
  category?: string;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  size?: 'small' | 'regular' | 'full';
  count?: number;
}

export interface ImageResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  altText: string;
  photographer: string;
  photographerUrl: string;
  source: 'unsplash' | 'pexels' | 'pixabay';
  license: string;
}

export interface OptimizedImage {
  originalUrl: string;
  optimizedUrl: string;
  webpUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  fileSize: number;
  altText: string;
}

class ImageService {
  private unsplashApiKey: string;
  private pexelsApiKey: string;
  private cloudinaryCloudName: string;

  constructor() {
    this.unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY || '';
    this.pexelsApiKey = process.env.PEXELS_API_KEY || '';
    this.cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  }

  async searchImages(request: ImageSearchRequest): Promise<ImageResult[]> {
    try {
      // Mock implementation for development
      const mockImages = this.generateMockImages(request);
      
      // In production, make actual API calls:
      /*
      const unsplashResults = await this.searchUnsplash(request);
      const pexelsResults = await this.searchPexels(request);
      
      return [...unsplashResults, ...pexelsResults]
        .slice(0, request.count || 10)
        .sort((a, b) => this.scoreImage(b, request.query) - this.scoreImage(a, request.query));
      */

      return mockImages;
    } catch (error) {
      console.error('Error searching images:', error);
      return [];
    }
  }

  private generateMockImages(request: ImageSearchRequest): ImageResult[] {
    const mockImages: ImageResult[] = [
      {
        id: 'ai-tech-1',
        url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
        width: 1200,
        height: 800,
        altText: 'Artificial intelligence and technology concept with digital brain',
        photographer: 'Tech Photographer',
        photographerUrl: 'https://unsplash.com/@techphotographer',
        source: 'unsplash',
        license: 'Unsplash License'
      },
      {
        id: 'climate-earth-1',
        url: 'https://images.unsplash.com/photo-1569163139394-de44cb5894c6?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1569163139394-de44cb5894c6?w=400&h=300&fit=crop',
        width: 1200,
        height: 800,
        altText: 'Earth from space showing climate and environmental concerns',
        photographer: 'Space Photographer',
        photographerUrl: 'https://unsplash.com/@spacephotographer',
        source: 'unsplash',
        license: 'Unsplash License'
      },
      {
        id: 'quantum-computer-1',
        url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop',
        width: 1200,
        height: 800,
        altText: 'Quantum computing hardware and advanced technology',
        photographer: 'Science Photographer',
        photographerUrl: 'https://unsplash.com/@sciencephotographer',
        source: 'unsplash',
        license: 'Unsplash License'
      },
      {
        id: 'business-meeting-1',
        url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
        width: 1200,
        height: 800,
        altText: 'Business professionals in modern office meeting',
        photographer: 'Business Photographer',
        photographerUrl: 'https://unsplash.com/@businessphotographer',
        source: 'unsplash',
        license: 'Unsplash License'
      },
      {
        id: 'health-medical-1',
        url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
        width: 1200,
        height: 800,
        altText: 'Medical research and healthcare technology',
        photographer: 'Medical Photographer',
        photographerUrl: 'https://unsplash.com/@medicalphotographer',
        source: 'unsplash',
        license: 'Unsplash License'
      }
    ];

    // Filter based on query
    const query = request.query.toLowerCase();
    return mockImages.filter(img => 
      img.altText.toLowerCase().includes(query) ||
      img.id.toLowerCase().includes(query)
    ).slice(0, request.count || 5);
  }

  private async searchUnsplash(request: ImageSearchRequest): Promise<ImageResult[]> {
    if (!this.unsplashApiKey) return [];

    try {
      const params = new URLSearchParams({
        query: request.query,
        per_page: String(request.count || 10),
        orientation: request.orientation || 'landscape'
      });

      const response = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
        headers: {
          'Authorization': `Client-ID ${this.unsplashApiKey}`
        }
      });

      const data = await response.json();
      
      return data.results.map((photo: any): ImageResult => ({
        id: photo.id,
        url: photo.urls.regular,
        thumbnailUrl: photo.urls.thumb,
        width: photo.width,
        height: photo.height,
        altText: photo.alt_description || `Image related to ${request.query}`,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        source: 'unsplash',
        license: 'Unsplash License'
      }));
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      return [];
    }
  }

  private async searchPexels(request: ImageSearchRequest): Promise<ImageResult[]> {
    if (!this.pexelsApiKey) return [];

    try {
      const params = new URLSearchParams({
        query: request.query,
        per_page: String(request.count || 10),
        orientation: request.orientation || 'landscape'
      });

      const response = await fetch(`https://api.pexels.com/v1/search?${params}`, {
        headers: {
          'Authorization': this.pexelsApiKey
        }
      });

      const data = await response.json();
      
      return data.photos.map((photo: any): ImageResult => ({
        id: String(photo.id),
        url: photo.src.large,
        thumbnailUrl: photo.src.medium,
        width: photo.width,
        height: photo.height,
        altText: photo.alt || `Image related to ${request.query}`,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        source: 'pexels',
        license: 'Pexels License'
      }));
    } catch (error) {
      console.error('Error searching Pexels:', error);
      return [];
    }
  }

  async optimizeImage(imageUrl: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}): Promise<OptimizedImage> {
    try {
      // Mock optimization for development
      const mockOptimized: OptimizedImage = {
        originalUrl: imageUrl,
        optimizedUrl: imageUrl + '?w=' + (options.width || 1200) + '&q=' + (options.quality || 80),
        webpUrl: imageUrl + '?w=' + (options.width || 1200) + '&q=' + (options.quality || 80) + '&fm=webp',
        thumbnailUrl: imageUrl + '?w=400&h=300&fit=crop',
        width: options.width || 1200,
        height: options.height || 800,
        fileSize: 150000, // Mock file size
        altText: 'Optimized image'
      };

      // In production, use Cloudinary or similar service:
      /*
      const cloudinaryUrl = `https://res.cloudinary.com/${this.cloudinaryCloudName}/image/fetch/`;
      const transformations = [
        `w_${options.width || 1200}`,
        `h_${options.height || 800}`,
        `q_${options.quality || 80}`,
        `f_${options.format || 'auto'}`
      ].join(',');
      
      const optimizedUrl = `${cloudinaryUrl}${transformations}/${encodeURIComponent(imageUrl)}`;
      */

      return mockOptimized;
    } catch (error) {
      console.error('Error optimizing image:', error);
      throw new Error('Failed to optimize image');
    }
  }

  async generateAltText(imageUrl: string, context?: string): Promise<string> {
    try {
      // Mock alt text generation
      // In production, use AI vision API like Google Vision or OpenAI Vision
      
      const contextualPhrases = [
        'Professional image showing',
        'High-quality photo depicting',
        'Visual representation of',
        'Detailed image illustrating'
      ];

      const randomPhrase = contextualPhrases[Math.floor(Math.random() * contextualPhrases.length)];
      return `${randomPhrase} ${context || 'relevant content'}`;
    } catch (error) {
      console.error('Error generating alt text:', error);
      return 'Image';
    }
  }

  private scoreImage(image: ImageResult, query: string): number {
    let score = 0;
    
    // Score based on alt text relevance
    const altWords = image.altText.toLowerCase().split(' ');
    const queryWords = query.toLowerCase().split(' ');
    
    queryWords.forEach(word => {
      if (altWords.some(altWord => altWord.includes(word))) {
        score += 10;
      }
    });

    // Prefer landscape orientation for articles
    if (image.width > image.height) score += 5;
    
    // Prefer higher resolution
    if (image.width >= 1200) score += 3;
    
    return score;
  }

  async getBestImageForTopic(topic: string, category: string): Promise<ImageResult | null> {
    const searchTerms = [topic, category, `${topic} ${category}`];
    
    for (const term of searchTerms) {
      const images = await this.searchImages({
        query: term,
        orientation: 'landscape',
        count: 5
      });
      
      if (images.length > 0) {
        return images[0]; // Return the best match
      }
    }
    
    return null;
  }
}

export const imageService = new ImageService();
