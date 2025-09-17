// Content Generator Service using Perplexity API
// Generates high-quality articles from trending topics

export interface GeneratedContent {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  confidence: number;
  sources: string[];
  image?: string;
}

export interface ContentGenerationRequest {
  topic: string;
  category: string;
  targetLength?: number;
  tone?: string;
  includeImages?: boolean;
  seoKeywords?: string[];
  template?: any;
  source?: string;
}

class ContentGeneratorService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    this.baseUrl = 'https://api.perplexity.ai/chat/completions';
  }

  /**
   * Generate article content using Perplexity API
   */
  async generateArticle(request: ContentGenerationRequest): Promise<GeneratedContent> {
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY is not configured');
    }

    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a professional journalist writing factual, well-researched articles about current events and trending topics. Always provide accurate, up-to-date information with proper context.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
          top_p: 0.9,
          return_citations: true,
          search_domain_filter: ["bbc.com", "cnn.com", "reuters.com", "ap.org", "npr.org"],
          search_recency_filter: "day"
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content || '';

      return this.parseGeneratedContent(generatedText, request);
    } catch (error) {
      console.error('Content generation error:', error);
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate content for automated article generator
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    return this.generateArticle(request);
  }

  /**
   * Build prompt for content generation
   */
  private buildPrompt(request: ContentGenerationRequest): string {
    const { topic, category, targetLength = 800, tone = 'informative' } = request;

    return `Write a comprehensive, factual article about "${topic}" in the ${category} category.

Requirements:
- Length: approximately ${targetLength} words
- Tone: ${tone} and professional
- Include a compelling headline
- Write an engaging excerpt (2-3 sentences)
- Provide factual, current information
- Include relevant context and background
- Use proper journalistic structure
- Add 3-5 relevant tags
- Create SEO-optimized title and description

Format your response as:
TITLE: [Article title]
EXCERPT: [Brief excerpt]
CONTENT: [Full article content]
TAGS: [tag1, tag2, tag3]
SEO_TITLE: [SEO optimized title]
SEO_DESCRIPTION: [SEO description]

Focus on factual reporting and avoid speculation or fictional elements.`;
  }

  /**
   * Parse generated content into structured format
   */
  private parseGeneratedContent(text: string, request: ContentGenerationRequest): GeneratedContent {
    const lines = text.split('\n');
    let title = '';
    let excerpt = '';
    let content = '';
    let tags: string[] = [];
    let seoTitle = '';
    let seoDescription = '';

    let currentSection = '';
    let contentLines: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('TITLE:')) {
        title = trimmedLine.replace('TITLE:', '').trim();
        currentSection = 'title';
      } else if (trimmedLine.startsWith('EXCERPT:')) {
        excerpt = trimmedLine.replace('EXCERPT:', '').trim();
        currentSection = 'excerpt';
      } else if (trimmedLine.startsWith('CONTENT:')) {
        currentSection = 'content';
        const contentStart = trimmedLine.replace('CONTENT:', '').trim();
        if (contentStart) contentLines.push(contentStart);
      } else if (trimmedLine.startsWith('TAGS:')) {
        const tagString = trimmedLine.replace('TAGS:', '').trim();
        tags = tagString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        currentSection = 'tags';
      } else if (trimmedLine.startsWith('SEO_TITLE:')) {
        seoTitle = trimmedLine.replace('SEO_TITLE:', '').trim();
        currentSection = 'seo_title';
      } else if (trimmedLine.startsWith('SEO_DESCRIPTION:')) {
        seoDescription = trimmedLine.replace('SEO_DESCRIPTION:', '').trim();
        currentSection = 'seo_description';
      } else if (currentSection === 'content' && trimmedLine) {
        contentLines.push(line);
      }
    }

    content = contentLines.join('\n').trim();

    // Fallbacks if parsing failed
    if (!title) {
      title = this.extractTitleFromContent(text) || `Breaking: ${request.topic}`;
    }
    if (!excerpt) {
      excerpt = this.generateExcerpt(content || text);
    }
    if (!content) {
      content = text;
    }
    if (tags.length === 0) {
      tags = this.generateTags(request.topic, request.category);
    }
    if (!seoTitle) {
      seoTitle = title;
    }
    if (!seoDescription) {
      seoDescription = excerpt;
    }

    return {
      title,
      content,
      excerpt,
      category: request.category,
      tags,
      seoTitle,
      seoDescription,
      confidence: 0.85,
      sources: this.extractSources(text),
      image: undefined // Will be handled by image service
    };
  }

  /**
   * Extract title from unstructured content
   */
  private extractTitleFromContent(text: string): string | null {
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 100 && !trimmed.includes('.')) {
        return trimmed;
      }
    }
    return null;
  }

  /**
   * Generate excerpt from content
   */
  private generateExcerpt(content: string): string {
    const sentences = content.split('.').filter(s => s.trim().length > 20);
    const firstTwoSentences = sentences.slice(0, 2).join('.').trim();
    return firstTwoSentences.length > 10 ? firstTwoSentences + '.' : content.substring(0, 150) + '...';
  }

  /**
   * Generate tags based on topic and category
   */
  private generateTags(topic: string, category: string): string[] {
    const topicWords = topic.toLowerCase().split(' ').filter(word => word.length > 3);
    const tags = [category.toLowerCase(), ...topicWords.slice(0, 3)];
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Extract sources from content
   */
  private extractSources(text: string): string[] {
    const sources: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('http') || line.includes('www.')) {
        const urls = line.match(/https?:\/\/[^\s]+/g);
        if (urls) {
          sources.push(...urls);
        }
      }
    }
    
    return [...new Set(sources)]; // Remove duplicates
  }
}

// Export singleton instance
export const contentGenerator = new ContentGeneratorService();
export { ContentGeneratorService };
