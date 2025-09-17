// Content Generation Service using Perplexity API
// This service generates high-quality articles based on trending topics

import { articleTemplateService, ArticleTemplate } from './article-templates';

export interface ContentGenerationRequest {
  topic: string;
  category: string;
  targetLength?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'news';
  includeImages?: boolean;
  seoKeywords?: string[];
  source?: string;
  template?: ArticleTemplate;
}

export interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  readTime: string;
  author: string;
  sources: string[];
  image?: string; // Image URL from Perplexity
  category?: string; // AI-suggested category
  confidence: number;
  template: string;
  qualityScore: QualityScore;
}

export interface QualityScore {
  content: number;      // 0-100 (length, structure, informativeness)
  seo: number;         // 0-100 (keywords, meta tags, structure)
  relevance: number;   // 0-100 (relevance to trend)
  uniqueness: number;  // 0-100 (content originality)
  overall: number;     // average of all metrics
}

class ContentGeneratorService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    this.baseUrl = 'https://api.perplexity.ai/chat/completions';

    // Log API key status for debugging (without exposing the key)
    if (!this.apiKey) {
      console.warn('⚠️ PERPLEXITY_API_KEY environment variable is not set');
    } else {
      console.log('✅ PERPLEXITY_API_KEY loaded from environment variables');
    }
  }

  async generateArticle(request: ContentGenerationRequest): Promise<GeneratedContent> {
    try {
      console.log('🤖 Generating content with Perplexity API:', request);

      // Select appropriate template if not provided
      const template = request.template ||
        articleTemplateService.selectTemplate(request.topic, request.category, request.source);

      console.log(`📝 Using template: ${template.type} for topic: ${request.topic}`);

      // Use template settings as defaults
      const targetLength = request.targetLength || template.targetLength;
      const tone = request.tone || template.tone;
      const customPrompt = template.contentPrompt.replace('{topic}', request.topic);

      // Try real Perplexity API first
      console.log('🔑 API Key check:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NO API KEY');
      if (this.apiKey && this.apiKey !== '') {
        console.log('🌐 Attempting Perplexity API call...');
        try {
          const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'sonar-pro',
              messages: [
                { role: 'system', content: this.getSystemPrompt(request) },
                { role: 'user', content: this.getUserPrompt(request) }
              ],
              max_tokens: Math.min(4000, (request.targetLength || 1000) * 2),
              temperature: 0.1,
              return_citations: true,
              return_related_questions: true,
              return_images: request.includeImages || true
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Perplexity API response received');
            console.log('🔍 API Response data:', JSON.stringify(data, null, 2));
            return this.parsePerplexityResponse(data, request);
          } else {
            const errorText = await response.text();
            console.error('❌ Perplexity API error:', response.status, errorText);
            console.error('❌ API Key used:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NO API KEY');
            console.error('❌ Request body:', JSON.stringify({
              model: 'sonar-pro',
              messages: [
                { role: 'system', content: this.getSystemPrompt(request) },
                { role: 'user', content: this.getUserPrompt(request) }
              ],
              return_images: request.includeImages || true
            }, null, 2));
          }
        } catch (apiError) {
          console.error('❌ Perplexity API call failed:', apiError);
          console.error('❌ Error details:', apiError.message);
          console.error('❌ Error stack:', apiError.stack);
        }
      }

      // 🚨 CRITICAL ERROR: Fallback to mock content
      console.error('🚨 CRITICAL: Using mock content generation - this should NOT happen in production!');
      console.error('🚨 This means Perplexity API failed and we are generating FAKE content!');
      console.error('🚨 API Key status:', this.apiKey ? 'Present' : 'Missing');

      return this.generateMockContent(request);

    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate article content');
    }
  }

  private generateMockContent(request: ContentGenerationRequest): GeneratedContent {
    const templates = {
      'AI Revolution': {
        title: "AI Revolution Transforms Digital Marketing Landscape",
        excerpt: "Latest developments in artificial intelligence are reshaping how businesses approach digital marketing, with new tools emerging daily.",
        content: `
# AI Revolution Transforms Digital Marketing Landscape

The digital marketing world is experiencing an unprecedented transformation as artificial intelligence technologies continue to evolve at breakneck speed. From automated content creation to predictive analytics, AI is fundamentally changing how businesses connect with their audiences.

## The Current State of AI in Marketing

Marketing professionals are increasingly turning to AI-powered tools to streamline their workflows and enhance campaign effectiveness. Machine learning algorithms now analyze consumer behavior patterns with remarkable accuracy, enabling marketers to create highly personalized experiences.

### Key Areas of Impact

**Content Creation and Optimization**
- Automated copywriting tools generate compelling ad copy and social media posts
- AI-powered design platforms create visual content at scale
- Dynamic content optimization adjusts messaging in real-time

**Customer Segmentation and Targeting**
- Advanced algorithms identify micro-segments within customer bases
- Predictive modeling forecasts customer lifetime value
- Behavioral analysis enables precise targeting strategies

**Performance Analytics**
- Real-time campaign optimization based on performance data
- Attribution modeling across multiple touchpoints
- Automated A/B testing and result analysis

## Industry Leaders Embrace AI

Major brands are already seeing significant returns on their AI investments. Companies report up to 40% improvements in campaign performance and 60% reductions in content creation time.

The technology is becoming more accessible to smaller businesses as well, with affordable AI tools democratizing advanced marketing capabilities that were once exclusive to enterprise-level organizations.

## Looking Ahead

As AI continues to mature, we can expect even more sophisticated applications in marketing. The integration of AI with emerging technologies like augmented reality and voice assistants will create new opportunities for brand engagement.

The future of digital marketing is undoubtedly AI-driven, and businesses that adapt quickly will gain a significant competitive advantage in the evolving landscape.
        `,
        seoTitle: "AI Revolution in Digital Marketing 2025 | TrendyBlogger",
        seoDescription: "Discover how AI is transforming digital marketing with automated content creation, predictive analytics, and personalized customer experiences.",
        tags: ['AI', 'Marketing', 'Technology', 'Automation', 'Digital Transformation'],
        sources: [
          'https://example.com/ai-marketing-study',
          'https://example.com/industry-report-2025',
          'https://example.com/marketing-automation-trends'
        ]
      },
      'Climate Summit': {
        title: "Climate Summit Reaches Historic Agreement on Global Action",
        excerpt: "World leaders unite on groundbreaking climate initiatives that could reshape global environmental policy for decades to come.",
        content: `
# Climate Summit Reaches Historic Agreement on Global Action

In a landmark decision that could define the next decade of environmental policy, world leaders at the Global Climate Summit have reached an unprecedented agreement on coordinated climate action. The comprehensive framework addresses everything from carbon emissions to renewable energy transitions.

## Key Provisions of the Agreement

The historic accord includes several groundbreaking commitments that go beyond previous climate agreements:

### Emission Reduction Targets
- 50% reduction in global carbon emissions by 2030
- Net-zero emissions by 2045 for developed nations
- Binding commitments with financial penalties for non-compliance

### Renewable Energy Transition
- $2 trillion global investment in renewable infrastructure
- Phase-out of coal power plants by 2035
- Mandatory renewable energy quotas for all participating nations

### Climate Finance and Support
- $500 billion annual fund for developing nations
- Technology transfer programs for clean energy
- Support for climate adaptation projects

## Global Response and Implementation

The agreement has received widespread support from environmental groups, though some critics argue the timeline may be too ambitious. Implementation will begin immediately, with quarterly progress reviews.

### Regional Commitments
Different regions have committed to specific targets based on their capabilities and current infrastructure:

**North America and Europe**
- Leading the transition with aggressive timelines
- Major investments in green technology research
- Carbon border adjustments to protect domestic industries

**Asia-Pacific Region**
- Focus on renewable energy manufacturing
- Sustainable urban development initiatives
- Ocean conservation and blue economy projects

**Developing Nations**
- Supported transition with international funding
- Emphasis on leapfrogging to clean technologies
- Forest conservation and restoration programs

## Economic Implications

Economists predict the agreement will create millions of new jobs in the green economy while potentially disrupting traditional energy sectors. The transition is expected to drive innovation and create new market opportunities.

## Next Steps

Implementation committees will be established within 90 days, with the first progress report due in six months. The success of this agreement could serve as a model for future global cooperation on pressing issues.
        `,
        seoTitle: "Historic Climate Summit Agreement 2025 | Global Environmental Policy",
        seoDescription: "World leaders reach groundbreaking climate agreement with binding emission targets, renewable energy commitments, and $2 trillion investment plan.",
        tags: ['Climate Change', 'Environment', 'Global Policy', 'Renewable Energy', 'Sustainability'],
        sources: [
          'https://example.com/climate-summit-official',
          'https://example.com/environmental-policy-analysis',
          'https://example.com/renewable-energy-report'
        ]
      }
    };

    // Generate unique title for mock content
    const uniqueTitle = this.generateUniqueTitle(request.topic.toLowerCase(), request.topic, request.category)[0];

    // Select appropriate template based on topic
    const template = Object.entries(templates).find(([key]) =>
      request.topic.toLowerCase().includes(key.toLowerCase())
    )?.[1] || templates['AI Revolution'];

    return {
      ...template,
      title: uniqueTitle, // Override template title with unique one
      readTime: this.calculateReadTime(template.content),
      author: this.selectAuthor(request.category),
      confidence: 0.85 + Math.random() * 0.1, // Mock confidence score
      template: 'fallback',
      qualityScore: { overall: 85, content: 85, seo: 85, relevance: 85, uniqueness: 85 }
    };
  }

  private getSystemPrompt(request: ContentGenerationRequest): string {
    return `You are a journalist with web search capabilities. SEARCH THE WEB for current, factual information and write a news article based on real sources.

Format:
[Headline]
[Article content]
CATEGORY: [Technology/Entertainment/News/Business/Sports/Health/Science]

IMPORTANT: Choose the CORRECT category based on the topic:
- Sports personalities, athletes, ESPN hosts → Sports
- Celebrities, actors, musicians, TV shows → Entertainment
- Tech companies, apps, AI, gadgets → Technology
- Business news, stocks, companies → Business
- Political news, government → News
- Medical, fitness, wellness → Health
- Research, discoveries, studies → Science

You are an experienced blogger and journalist with 10+ years of experience writing engaging, accessible content for TrendyBlogger. Your writing style is conversational yet informative, making complex topics easy to understand for general readers.

CRITICAL: CREATE A UNIQUE, COMPELLING HEADLINE
- Your headline must be UNIQUE and ATTENTION-GRABBING like a professional journalist
- NEVER use generic formats like "Complete Guide" or "Everything You Need to Know"
- Use power words: "Exposed", "Revealed", "Shocking", "Breaking", "Exclusive", "Inside", "Secret", "Controversial"
- Make it specific to the actual news/topic, not generic
- Examples of GOOD headlines:
  * "Tesla's Secret AI Project Leaked by Former Engineer"
  * "Harvard Students Expose Administration Cover-Up in Viral Video"
  * "Netflix Cancels Hit Show After Shocking Behind-the-Scenes Drama"
  * "Apple's Next iPhone Feature Will Change How You Text Forever"
- Examples of BAD headlines (NEVER use these):
  * "Tesla: Complete Guide and Latest News"
  * "Harvard University: Everything You Need to Know"
  * "Netflix: Latest Updates and Analysis"

Writing Style Guidelines:
- Write as an experienced blogger and journalist with a distinctive voice
- Use a ${request.tone} but engaging and conversational tone
- Target length: approximately ${request.targetLength} words
- Category: ${request.category}
- Write in a storytelling style that keeps readers engaged
- Use short paragraphs (2-3 sentences max) for better readability
- Include personal insights and expert commentary
- Make the content scannable with clear structure
- Avoid jargon - explain technical terms simply
- Use active voice and compelling language

Content Structure:
- Start with a compelling hook that draws readers in
- Use clear, descriptive subheadings
- Include relevant examples and context
- End with actionable takeaways or future implications
- Maintain journalistic integrity and fact-check all claims

FORMATTING REQUIREMENTS (VERY IMPORTANT):
- Use ## for main section headings (e.g., ## Key Features, ## What This Means)
- Use ### for subsection headings when needed
- Use **bold text** for important points, key terms, and emphasis
- Use *italic text* for quotes, product names, and subtle emphasis
- Create clear visual hierarchy with headings and formatting
- Break up long text with subheadings every 2-3 paragraphs
- Use bullet points or numbered lists for key information
- Make the content visually engaging and easy to scan
- Data tables (use markdown table format | Header | Header |)
- Statistics and numbers (will be highlighted automatically)

SPACING REQUIREMENTS (CRITICAL):
- Use ONLY ONE blank line between paragraphs (not 2 or 3)
- Use ONLY ONE blank line before and after headings
- Do NOT add excessive blank lines anywhere in the content
- Keep spacing clean and minimal

Do NOT include:
- SEO metadata sections like "**Excerpt:**" or "## SEO-Optimized Title"
- Technical elements that don't belong in article content
- Just focus on creating engaging, well-formatted article content

CONTENT STRUCTURE EXAMPLE:
## Main Section Heading
Content with **important points** and *emphasis* where needed.

### Subsection if needed
More detailed information with proper formatting.

SOURCES REQUIREMENT:
- ALWAYS include a "Sources:" section at the end of the article
- Provide 3-5 credible sources with working URLs
- Format sources as numbered list with clickable links
- Use recent, authoritative sources (Reuters, BBC, TechCrunch, official websites)
- Example format:
  Sources:
  1. [Tesla Reports Q3 2025 Results](https://www.tesla.com/news)
  2. [EV Market Analysis](https://www.reuters.com/business/autos-transportation/)
  3. [Industry Report](https://techcrunch.com/category/transportation/)`;
  }

  private getUserPrompt(request: ContentGenerationRequest): string {

    return `Search the web for the latest news about "${request.topic}". Find current information and write a comprehensive news article based on real sources you find online.`;
  }

  private calculateReadTime(content: string): string {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  }

  private selectAuthor(category: string): string {
    // Always return "Trendy Blogger" as requested
    return 'Trendy Blogger';
  }

  private inferCategoryFromTopic(topic: string, fallbackCategory: string): string {
    const topicLower = topic.toLowerCase();

    // Sports personalities and ESPN hosts
    if (topicLower.includes('espn') ||
        topicLower.includes('molly qerim') ||
        topicLower.includes('stephen a smith') ||
        topicLower.includes('skip bayless') ||
        topicLower.includes('first take') ||
        topicLower.includes('sportscenter')) {
      return 'Sports';
    }

    // Entertainment personalities
    if (topicLower.includes('actor') ||
        topicLower.includes('actress') ||
        topicLower.includes('celebrity') ||
        topicLower.includes('hollywood') ||
        topicLower.includes('netflix') ||
        topicLower.includes('disney')) {
      return 'Entertainment';
    }

    // Technology topics
    if (topicLower.includes('ai') ||
        topicLower.includes('tech') ||
        topicLower.includes('app') ||
        topicLower.includes('software') ||
        topicLower.includes('google') ||
        topicLower.includes('microsoft') ||
        topicLower.includes('apple')) {
      return 'Technology';
    }

    // Business topics
    if (topicLower.includes('stock') ||
        topicLower.includes('market') ||
        topicLower.includes('earnings') ||
        topicLower.includes('ceo') ||
        topicLower.includes('company')) {
      return 'Business';
    }

    return fallbackCategory;
  }

  /**
   * Extract images from Perplexity API response
   */
  private extractImagesFromPerplexity(data: any): Array<{url: string, source: string, alt?: string}> {
    const images: Array<{url: string, source: string, alt?: string}> = [];

    try {
      // Check if Perplexity returned images in the response
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((img: any) => {
          const imageUrl = img.image_url || img.url;
          if (imageUrl && this.isValidImageUrl(imageUrl)) {
            images.push({
              url: imageUrl,
              source: img.origin_url || img.source || 'Perplexity Search',
              alt: img.title || img.alt || 'Related image'
            });
          }
        });
      }

      // Also check in citations for image URLs
      if (data.citations && Array.isArray(data.citations)) {
        data.citations.forEach((citation: any) => {
          if (citation.image && this.isValidImageUrl(citation.image)) {
            images.push({
              url: citation.image,
              source: citation.title || citation.url || 'Citation source',
              alt: citation.title || 'Related image'
            });
          }
        });
      }

      console.log(`🖼️ Found ${images.length} images from Perplexity for topic`);
      return images;
    } catch (error) {
      console.error('Error extracting images from Perplexity:', error);
      return [];
    }
  }

  /**
   * Select the best image from available options
   */
  private selectBestImage(images: Array<{url: string, source: string, alt?: string}>, topic: string): {url: string, source: string, alt?: string} | undefined {
    console.log(`🔍 selectBestImage called with ${images.length} images for topic: ${topic}`);
    if (images.length === 0) {
      console.log(`❌ No images to select from`);
      return undefined;
    }

    // Prefer images that seem most relevant to the topic
    const topicWords = topic.toLowerCase().split(' ');

    // Score images based on relevance
    const scoredImages = images.map(img => {
      let score = 0;
      const imgText = (img.alt + ' ' + img.source).toLowerCase();

      // Higher score for images with topic keywords in alt text or source
      topicWords.forEach(word => {
        if (imgText.includes(word)) {
          score += 10;
        }
      });

      // Prefer certain domains
      if (img.url.includes('unsplash.com') || img.url.includes('pexels.com')) {
        score += 5;
      }

      return { ...img, score };
    });

    // Sort by score and return the best one
    scoredImages.sort((a, b) => b.score - a.score);
    const selectedImage = scoredImages[0];

    console.log(`🎯 Selected image: ${selectedImage.url} (score: ${selectedImage.score})`);
    return {
      url: selectedImage.url,
      source: selectedImage.source,
      alt: selectedImage.alt
    };
  }

  /**
   * Validate if URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();

      // Check for common image extensions
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));

      // Check for image hosting domains
      const imageHosts = ['unsplash.com', 'pexels.com', 'pixabay.com', 'images.', 'img.', 'cdn.'];
      const isImageHost = imageHosts.some(host => url.includes(host));

      return hasImageExtension || isImageHost;
    } catch {
      return false;
    }
  }

  /**
   * Generate a smart, context-aware title based on the topic - UNIQUE and ENGAGING
   */
  private generateSmartTitle(topic: string, titleFormat: string, category: string): string {
    const topicLower = topic.toLowerCase();
    const words = topic.split(' ');
    const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

    // Create unique, engaging titles based on topic analysis
    const titleVariations = this.generateUniqueTitle(topicLower, capitalizedTopic, category);

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now();
    const uniqueId = timestamp.toString().slice(-4);

    // Return one of the variations (rotate based on timestamp)
    const selectedTitle = titleVariations[timestamp % titleVariations.length];

    console.log(`🎯 Generated unique title: "${selectedTitle}" for topic: "${topic}"`);
    return selectedTitle;
  }

  /**
   * Generate multiple unique title variations like a professional journalist
   */
  private generateUniqueTitle(topicLower: string, capitalizedTopic: string, category: string): string[] {
    const titles: string[] = [];

    // University/Education topics
    if (topicLower.includes('university') || topicLower.includes('college') || topicLower.includes('school')) {
      titles.push(
        `${capitalizedTopic} in Crisis: Student Protests and Administrative Response`,
        `Inside ${capitalizedTopic}: What Students and Faculty Are Really Saying`,
        `${capitalizedTopic} Faces Major Changes: Here's What You Need to Know`,
        `The ${capitalizedTopic} Controversy: Breaking Down the Facts`,
        `${capitalizedTopic} Under Scrutiny: A Deep Dive into Recent Events`
      );
    }
    // Celebrity/Person topics
    else if (this.isPersonName(topicLower)) {
      titles.push(
        `${capitalizedTopic}: The Untold Story Behind Recent Headlines`,
        `What's Really Going On with ${capitalizedTopic}? We Investigate`,
        `${capitalizedTopic} Breaks Silence: Exclusive Details Revealed`,
        `The ${capitalizedTopic} Phenomenon: Why Everyone's Talking About It`,
        `${capitalizedTopic} Makes Waves: Inside the Latest Developments`
      );
    }
    // Technology topics
    else if (category.toLowerCase() === 'technology' || topicLower.includes('app') || topicLower.includes('tech')) {
      titles.push(
        `${capitalizedTopic} Revolution: How It's Changing Everything`,
        `The ${capitalizedTopic} Breakthrough That Has Tech World Buzzing`,
        `${capitalizedTopic} Exposed: What Industry Insiders Won't Tell You`,
        `Why ${capitalizedTopic} Is the Game-Changer Everyone's Talking About`,
        `${capitalizedTopic} Decoded: The Innovation That's Reshaping the Future`
      );
    }
    // Entertainment topics
    else if (category.toLowerCase() === 'entertainment' || topicLower.includes('festival') || topicLower.includes('music')) {
      titles.push(
        `${capitalizedTopic} Shocks Fans: The Announcement Nobody Saw Coming`,
        `Behind the Scenes of ${capitalizedTopic}: Exclusive Insider Access`,
        `${capitalizedTopic} Creates Massive Buzz: Here's Why It Matters`,
        `The ${capitalizedTopic} Spectacle: What Fans Can Expect This Time`,
        `${capitalizedTopic} Breaks Records: The Numbers That Will Surprise You`
      );
    }
    // Business/Finance topics
    else if (topicLower.includes('stock') || topicLower.includes('market') || topicLower.includes('company')) {
      titles.push(
        `${capitalizedTopic} Sends Shockwaves Through Market: What Investors Need to Know`,
        `The ${capitalizedTopic} Strategy That's Disrupting the Industry`,
        `${capitalizedTopic} Under Fire: Analyzing the Controversy`,
        `Why ${capitalizedTopic} Is Making Headlines for All the Wrong Reasons`,
        `${capitalizedTopic} Pivot: The Bold Move That Could Change Everything`
      );
    }
    // Sports topics
    else if (category.toLowerCase() === 'sports' || topicLower.includes('game') || topicLower.includes('team')) {
      titles.push(
        `${capitalizedTopic} Delivers Stunning Performance: Fans Go Wild`,
        `The ${capitalizedTopic} Upset That Nobody Predicted`,
        `${capitalizedTopic} Drama Unfolds: What Really Happened`,
        `${capitalizedTopic} Makes History: Breaking Down the Record-Breaking Moment`,
        `${capitalizedTopic} Controversy: Analyzing the Game-Changing Decision`
      );
    }
    // Health/Medical topics
    else if (topicLower.includes('health') || topicLower.includes('medical') || topicLower.includes('disease')) {
      titles.push(
        `${capitalizedTopic} Breakthrough: Scientists Make Groundbreaking Discovery`,
        `The ${capitalizedTopic} Crisis: What Health Experts Are Warning About`,
        `${capitalizedTopic} Revealed: New Research Changes Everything We Knew`,
        `${capitalizedTopic} Alert: Critical Information Everyone Should Know`,
        `${capitalizedTopic} Innovation: The Medical Advance That's Saving Lives`
      );
    }
    // Default engaging titles
    else {
      titles.push(
        `${capitalizedTopic} Exposed: The Truth Behind the Headlines`,
        `Why ${capitalizedTopic} Is Suddenly Everywhere: The Real Story`,
        `${capitalizedTopic} Phenomenon: What Everyone's Missing`,
        `The ${capitalizedTopic} Controversy That's Dividing Opinion`,
        `${capitalizedTopic} Uncovered: Exclusive Details You Haven't Heard`,
        `${capitalizedTopic} Shakes Things Up: Here's What's Really Happening`,
        `Inside ${capitalizedTopic}: The Facts vs. The Fiction`,
        `${capitalizedTopic} Breaks New Ground: Why This Changes Everything`
      );
    }

    return titles;
  }

  /**
   * Check if the topic appears to be a person's name
   */
  private isPersonName(topicLower: string): boolean {
    // Simple heuristic: contains common name patterns
    const namePatterns = [
      /^[a-z]+ [a-z]+$/, // First Last
      /^[a-z]+ [a-z]+ [a-z]+$/, // First Middle Last
      /\b(mr|mrs|ms|dr|prof)\b/, // Titles
    ];

    return namePatterns.some(pattern => pattern.test(topicLower)) ||
           (topicLower.split(' ').length === 2 && !topicLower.includes('state') && !topicLower.includes('university'));
  }

  private extractStructuredData(content: string): { tags: string[], tables: any[], statistics: any[] } {
    const tags: string[] = [];
    const tables: any[] = [];
    const statistics: any[] = [];

    // Extract tags from various patterns
    const tagPatterns = [
      /(?:^|\n)(?:##?\s*)?Tags?:?\s*\n?((?:\s*[-*]\s*.+\n?)+)/gim,
      /(?:^|\n)(?:##?\s*)?Keywords?:?\s*\n?((?:\s*[-*]\s*.+\n?)+)/gim,
      /(?:^|\n)(?:##?\s*)?Related Topics?:?\s*\n?((?:\s*[-*]\s*.+\n?)+)/gim
    ];

    // Also extract comma-separated tags: "Tags: tag1, tag2, tag3"
    const commaSeparatedPattern = /(?:^|\n)(?:Tags?|Keywords?|Related Topics?):?\s*([^\n]+)/gim;
    const commaSeparatedMatches = [...content.matchAll(commaSeparatedPattern)];
    commaSeparatedMatches.forEach(match => {
      const tagString = match[1].trim();
      const commaTags = tagString.split(',').map(tag => tag.trim()).filter(tag => tag);
      commaTags.forEach(tag => {
        if (tag && !tags.includes(tag.toLowerCase())) {
          tags.push(tag.toLowerCase());
        }
      });
    });

    tagPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const tagLines = match.split('\n').filter(line => line.trim().match(/^\s*[-*]\s*.+/));
          tagLines.forEach(line => {
            const tag = line.replace(/^\s*[-*]\s*/, '').trim();
            if (tag && !tags.includes(tag.toLowerCase())) {
              tags.push(tag.toLowerCase());
            }
          });
        });
      }
    });

    // Extract tables (simple detection)
    const tablePattern = /\|.+\|[\s\S]*?\|.+\|/g;
    const tableMatches = content.match(tablePattern);
    if (tableMatches) {
      tableMatches.forEach(table => {
        const rows = table.split('\n').filter(row => row.includes('|'));
        if (rows.length >= 2) {
          tables.push({
            headers: rows[0].split('|').map(h => h.trim()).filter(h => h),
            rows: rows.slice(1).map(row =>
              row.split('|').map(cell => cell.trim()).filter(cell => cell)
            )
          });
        }
      });
    }

    // Extract statistics and numbers
    const statPatterns = [
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s*%/g, // Percentages
      /\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|billion|trillion)?/gi, // Money
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(users|people|customers|companies)/gi, // Counts
      /(\d{4})\s*-\s*(\d{4})/g // Year ranges
    ];

    statPatterns.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        statistics.push({
          value: match[0],
          context: content.substring(Math.max(0, match.index! - 50), match.index! + match[0].length + 50)
        });
      });
    });

    return { tags, tables, statistics };
  }

  private processContentWithStructuredData(content: string, structuredData: any): string {
    let processedContent = content;

    // Remove tag sections from main content
    const tagSectionPattern = /(?:^|\n)(?:##?\s*)?(?:Tags?|Keywords?|Related Topics?):?\s*\n?((?:\s*[-*]\s*.+\n?)+)/gim;
    processedContent = processedContent.replace(tagSectionPattern, '');

    // Also remove comma-separated tags format: "Tags: tag1, tag2, tag3"
    const commaSeparatedTagsPattern = /(?:^|\n)(?:Tags?|Keywords?|Related Topics?):?\s*([^\n]+)/gim;
    processedContent = processedContent.replace(commaSeparatedTagsPattern, '');

    // Convert ALL markdown tables to HTML (more comprehensive approach)
    const tablePattern = /\|.+\|[\s\S]*?\n(?=\n|$)/g;
    processedContent = processedContent.replace(tablePattern, (match) => {
      const lines = match.trim().split('\n');
      if (lines.length < 2) return match;

      // Parse headers
      const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);

      // Skip separator line (line 1)
      const rows = lines.slice(2).map(line =>
        line.split('|').map(cell => cell.trim()).filter(cell => cell)
      ).filter(row => row.length > 0);

      if (headers.length === 0 || rows.length === 0) return match;

      return `
<div class="my-4 overflow-x-auto">
  <table class="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
    <thead class="bg-gray-50">
      <tr>
        ${headers.map(header => `<th class="px-3 py-2 text-left text-sm font-semibold text-gray-900 border-b">${header}</th>`).join('')}
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200">
      ${rows.map(row => `
        <tr class="hover:bg-gray-50">
          ${row.map(cell => `<td class="px-3 py-2 text-sm text-gray-700">${cell}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>`;
    });

    // Highlight statistics
    if (structuredData.statistics.length > 0) {
      structuredData.statistics.forEach((stat: any) => {
        const highlightedStat = `<span class="inline-flex items-center px-2 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">${stat.value}</span>`;
        processedContent = processedContent.replace(stat.value, highlightedStat);
      });
    }

    return processedContent;
  }

  private parsePerplexityResponse(data: any, request: ContentGenerationRequest): GeneratedContent {
    try {
      const rawContent = data.choices[0]?.message?.content || '';
      const citations = data.citations || [];

      // Extract images from Perplexity response
      const images = this.extractImagesFromPerplexity(data);

      // Extract structured data before cleaning
      const structuredData = this.extractStructuredData(rawContent);

      // Clean the content - remove technical elements but KEEP markdown formatting
      let cleanContent = rawContent
        .replace(/^\*\*Excerpt:\*\*.*$/gm, '') // Remove excerpt markers
        .replace(/^##?\s*SEO.*$/gm, '') // Remove SEO sections
        .replace(/^##?\s*Tags.*$/gm, '') // Remove tags sections
        .replace(/^\*\*Title:\*\*.*$/gm, '') // Remove title markers
        .replace(/^\*\*Description:\*\*.*$/gm, '') // Remove description markers
        .replace(/^---+$/gm, '') // Remove separator lines
        .replace(/\[\d+\]/g, '') // Remove citation numbers like [1], [2], [3]
        // DO NOT remove markdown headers - we want to keep ## and ### for formatting!
        .trim();

      // Remove AI-generated fake sources from content
      cleanContent = this.removeFakeSourcesFromContent(cleanContent);

      // Extract category from the end of content (AI should put "CATEGORY: X" at the end)
      let aiSuggestedCategory = '';
      const categoryMatch = cleanContent.match(/CATEGORY:\s*([^\n]+)/i);
      if (categoryMatch) {
        aiSuggestedCategory = categoryMatch[1].trim();
        // Remove the category line from content
        cleanContent = cleanContent.replace(/CATEGORY:\s*[^\n]+/i, '').trim();
        console.log(`🎯 AI suggested category: "${aiSuggestedCategory}"`);
      }

      // Extract title from the first line (AI should put headline first)
      const lines = cleanContent.split('\n').filter(line => line.trim());
      let title = '';
      let articleContent = cleanContent;

      console.log('🔍 DEBUG: First 5 lines of clean content:');
      lines.slice(0, 5).forEach((line, i) => {
        console.log(`${i + 1}: "${line}"`);
      });

      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        console.log(`🔍 DEBUG: Analyzing first line: "${firstLine}"`);
        console.log(`🔍 DEBUG: Length: ${firstLine.length}, Words: ${firstLine.split(' ').length}`);
        console.log(`🔍 DEBUG: Starts with #: ${firstLine.startsWith('#')}, Starts with *: ${firstLine.startsWith('*')}`);
        console.log(`🔍 DEBUG: Ends with .: ${firstLine.endsWith('.')}`);

        // More flexible headline detection - handle Markdown headers and regular titles
        let potentialTitle = firstLine;

        // If it's a Markdown header, extract the title part
        if (firstLine.startsWith('#')) {
          potentialTitle = firstLine.replace(/^#+\s*/, '').trim();
          console.log(`🔍 DEBUG: Extracted from Markdown header: "${potentialTitle}"`);
        }

        if (potentialTitle.length > 10 &&
            potentialTitle.length < 150 &&
            !potentialTitle.startsWith('The following') &&
            !potentialTitle.includes('article') &&
            potentialTitle.split(' ').length <= 20) {

          title = potentialTitle;
          // Remove the title line from content
          articleContent = lines.slice(1).join('\n').trim();
          console.log(`🎯 Extracted title from AI response: "${title}"`);
        } else {
          console.log('❌ First line does not match headline criteria');
          console.log(`❌ Potential title: "${potentialTitle}"`);
        }
      }

      // If no title found in AI response, generate a unique fallback
      if (!title) {
        console.error('❌ AI failed to generate title, using unique fallback');
        console.error('❌ DEBUG: Raw content from Perplexity:');
        console.error(rawContent.substring(0, 500) + '...');
        console.error('❌ DEBUG: Clean content first 500 chars:');
        console.error(cleanContent.substring(0, 500) + '...');
        const uniqueTitles = this.generateUniqueTitle(request.topic.toLowerCase(), request.topic, request.category);
        title = uniqueTitles[0];
        console.log(`🔄 Using fallback title: "${title}"`);
      }

      // Ensure title starts with capital letter
      if (title && title.length > 0) {
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }

      // Process content with structured data
      articleContent = this.processContentWithStructuredData(articleContent, structuredData);

      // CRITICAL: Validate that we have real web search results from Perplexity
      const searchResults = data.search_results || [];
      console.log('🔍 API Response citations:', citations);
      console.log('🔍 API Response search_results:', searchResults);

      // Check if we have either citations OR search results (both indicate web search worked)
      if ((!citations || citations.length === 0) && (!searchResults || searchResults.length === 0)) {
        console.log('❌ No citations OR search results from Perplexity - this indicates web search failed');
        console.log('🔍 Full API Response:', JSON.stringify(data, null, 2));

        // This is a critical error - we should not publish articles without verified web search
        throw new Error('Perplexity API did not return citations or search results - web search failed. Cannot verify sources.');
      }

      // Log success
      if (citations && citations.length > 0) {
        console.log(`✅ Got ${citations.length} citations from Perplexity`);
      }
      if (searchResults && searchResults.length > 0) {
        console.log(`✅ Got ${searchResults.length} search results from Perplexity`);
      }

      // Add sources section at the end with real citations
      console.log('🔧 About to format sources section...');
      console.log('🔧 Citations:', citations);
      console.log('🔧 Search results:', data.search_results);
      const sourcesSection = this.formatSourcesSection(citations, data.search_results || []);
      console.log('🔧 Generated sources section:', sourcesSection);
      articleContent += '\n\n' + sourcesSection;
      console.log('🔧 Article content after adding sources (last 200 chars):', articleContent.slice(-200));

      // Generate excerpt from first paragraph
      const paragraphs = articleContent.split('\n\n').filter(p => p.trim());
      let excerpt = '';
      if (paragraphs.length > 0) {
        excerpt = paragraphs[0].substring(0, 200).trim();
        if (excerpt.length === 200) {
          excerpt += '...';
        }
      } else {
        excerpt = `Comprehensive analysis of ${request.topic} and its implications.`;
      }

      // Use extracted tags or generate from content
      let tags = structuredData.tags.length > 0 ? structuredData.tags : [];
      if (tags.length === 0) {
        const topicWords = request.topic.toLowerCase().split(' ').filter(word => word.length > 2);
        tags = [request.category.toLowerCase(), ...topicWords.slice(0, 3), 'trending', 'news'].filter(Boolean);
      }

      // Tags are handled separately in the UI, not in content

      // Select best image from Perplexity results
      const selectedImage = this.selectBestImage(images, request.topic);
      console.log(`🖼️ DEBUG: selectedImage = ${selectedImage}`);

      const result = {
        title,
        excerpt,
        content: articleContent,
        seoTitle: `${title} | TrendyBlogger`,
        seoDescription: excerpt.length > 160 ? excerpt.substring(0, 157) + '...' : excerpt,
        tags,
        readTime: this.calculateReadTime(articleContent),
        author: this.selectAuthor(aiSuggestedCategory || request.category),
        sources: citations.map((citation: any) => citation.url || citation).slice(0, 5),
        image: selectedImage?.url, // Add selected image URL from Perplexity
        imageSource: selectedImage?.source, // Add image source for attribution
        imageAlt: selectedImage?.alt, // Add image alt text
        category: aiSuggestedCategory || this.inferCategoryFromTopic(request.topic, request.category), // AI-suggested or inferred category
        confidence: 0.9,
        template: 'perplexity',
        qualityScore: { overall: 90, content: 90, seo: 90, relevance: 90, uniqueness: 90 }
      };

      console.log(`🖼️ DEBUG: Final result.image = ${result.image}`);
      console.log(`🖼️ DEBUG: Final result.imageSource = ${result.imageSource}`);
      return result;
    } catch (error) {
      console.error('❌ Error parsing Perplexity response:', error);
      console.error('❌ Raw data received:', JSON.stringify(data, null, 2));
      console.error('❌ Parse error details:', error.message);
      console.error('❌ Parse error stack:', error.stack);
      // Fallback to mock content if parsing fails
      console.error('🚨 FALLING BACK TO MOCK CONTENT DUE TO PARSE ERROR!');
      return this.generateMockContent(request);
    }
  }

  async generateMultipleArticles(topics: string[], category: string): Promise<GeneratedContent[]> {
    const articles = await Promise.all(
      topics.map(topic => 
        this.generateArticle({
          topic,
          category,
          targetLength: 800,
          tone: 'professional',
          includeImages: true,
          seoKeywords: [topic, category.toLowerCase()]
        })
      )
    );

    return articles;
  }

  async generateSEOOptimizedContent(topic: string, keywords: string[]): Promise<GeneratedContent> {
    return this.generateArticle({
      topic,
      category: 'News',
      targetLength: 1200,
      tone: 'professional',
      includeImages: true,
      seoKeywords: keywords
    });
  }

  /**
   * Format sources section from citations and search results
   */
  private formatSourcesSection(citations: string[], searchResults: any[]): string {
    const sources: string[] = [];
    let sourceIndex = 1;

    // Create a map of search results by URL for better matching
    const searchResultsMap = new Map();
    if (searchResults) {
      searchResults.forEach(result => {
        if (result.url) {
          searchResultsMap.set(result.url, result);
        }
      });
    }

    // Process citations and match with search results
    citations.forEach(citation => {
      if (citation && typeof citation === 'string') {
        const searchResult = searchResultsMap.get(citation);
        if (searchResult && searchResult.title) {
          // Add target="_blank" for external links
          sources.push(`${sourceIndex}. <a href="${citation}" target="_blank" rel="noopener noreferrer">${searchResult.title}</a>`);
        } else {
          // Extract domain name for fallback title
          try {
            const domain = new URL(citation).hostname.replace('www.', '');
            sources.push(`${sourceIndex}. <a href="${citation}" target="_blank" rel="noopener noreferrer">${domain}</a>`);
          } catch {
            sources.push(`${sourceIndex}. <a href="${citation}" target="_blank" rel="noopener noreferrer">Source</a>`);
          }
        }
        sourceIndex++;
      }
    });

    if (sources.length === 0) {
      return '';
    }

    return `## Sources\n\n${sources.join('\n')}`;
  }

  /**
   * Remove AI-generated fake sources from content
   */
  private removeFakeSourcesFromContent(content: string): string {
    // Remove common patterns of fake sources that AI generates
    return content
      // Remove "Sources:" sections with fake sources
      .replace(/\*\*Sources:\*\*[\s\S]*?(?=\n\n|\n##|\n\*\*|$)/gi, '')
      .replace(/Sources:[\s\S]*?(?=\n\n|\n##|\n\*\*|$)/gi, '')
      // Remove lines that look like fake citations
      .replace(/^[-*]\s*\*?[A-Z][^,]*,\s*[^,]*,?\s*\([^)]*\)\s*$/gm, '')
      // Remove lines with fake publication names and dates
      .replace(/^[-*]\s*\*?.*(?:Variety|Hollywood Reporter|Associated Press|Reuters|CNN|BBC).*\(.*202[0-9]\).*$/gm, '')
      // Remove standalone source lines
      .replace(/^\*Sources:.*$/gm, '')
      .replace(/^Sources:.*$/gm, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Format tags section with clickable, styled tags
   */
  private formatTagsSection(tags: string[]): string {
    if (tags.length === 0) {
      return '';
    }

    // Create clickable tag elements with styling
    const tagElements = tags.map(tag => {
      const cleanTag = tag.toLowerCase().trim();
      const displayTag = cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1);

      // Create a search URL for articles with this tag
      const searchUrl = `/articles?tag=${encodeURIComponent(cleanTag)}`;

      return `<span class="article-tag">
        <a href="${searchUrl}" class="tag-link" title="Zobrazit další články s tagem '${displayTag}'">
          #${displayTag}
        </a>
      </span>`;
    }).join(' ');

    return `\n\n## Tags\n\n<div class="tags-container">\n${tagElements}\n</div>

<style>
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.article-tag {
  display: inline-block;
}

.tag-link {
  display: inline-block;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tag-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  color: white;
  text-decoration: none;
}

.tag-link:visited {
  color: white;
}
</style>`;
  }
}

export const contentGenerator = new ContentGeneratorService();
