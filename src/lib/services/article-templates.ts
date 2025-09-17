/**
 * Article Templates Service
 * Smart templates for different types of trending topics
 */

export interface ArticleTemplate {
  type: 'sports_event' | 'celebrity_news' | 'technology' | 'breaking_news' | 'entertainment' | 'general';
  structure: {
    titleFormat: string;
    introduction: string;
    sections: string[];
    conclusion: string;
  };
  seoStrategy: {
    titlePattern: string;
    metaDescriptionPattern: string;
    keywordStrategy: string[];
  };
  contentPrompt: string;
  targetLength: number;
  tone: 'professional' | 'casual' | 'news' | 'analytical';
}

class ArticleTemplateService {
  private templates: Map<string, ArticleTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Sports Event Template
    this.templates.set('sports_event', {
      type: 'sports_event',
      structure: {
        titleFormat: '{team1} vs {team2}: {outcome} Analysis and Key Highlights',
        introduction: 'Match overview, teams involved, significance of the game',
        sections: [
          'Game Summary and Final Score',
          'Key Players and Performances', 
          'Critical Moments and Turning Points',
          'Statistical Analysis',
          'Impact on Season/Standings',
          'Fan and Expert Reactions'
        ],
        conclusion: 'Summary of impact and what to expect next'
      },
      seoStrategy: {
        titlePattern: '{topic} - Live Updates, Score, and Analysis',
        metaDescriptionPattern: 'Get the latest updates on {topic}. Live score, key highlights, player stats, and expert analysis.',
        keywordStrategy: ['live score', 'highlights', 'analysis', 'stats', 'recap']
      },
      contentPrompt: `Write a comprehensive sports article about {topic}. Include:
- Current game status/final score
- Key player performances and statistics
- Critical moments that changed the game
- Impact on team standings or season
- Expert analysis and fan reactions
- What this means for upcoming games

Make it engaging for sports fans while being informative and factual.`,
      targetLength: 700, // Shortened from 1000
      tone: 'professional'
    });

    // Celebrity News Template
    this.templates.set('celebrity_news', {
      type: 'celebrity_news',
      structure: {
        titleFormat: '{celebrity}: Latest News and Updates on {event}',
        introduction: 'Who is involved, what happened, why it matters',
        sections: [
          'What Happened - The Full Story',
          'Background and Context',
          'Public and Industry Reactions',
          'Social Media Response',
          'Career Impact and Implications',
          'What\'s Next'
        ],
        conclusion: 'Summary and future outlook'
      },
      seoStrategy: {
        titlePattern: '{topic} - Latest News, Updates and Reactions',
        metaDescriptionPattern: 'Breaking news about {topic}. Get the latest updates, reactions, and analysis of this developing story.',
        keywordStrategy: ['latest news', 'updates', 'reactions', 'breaking', 'celebrity']
      },
      contentPrompt: `Write an engaging celebrity news article about {topic}. Include:
- Clear explanation of what happened
- Relevant background information
- Public and fan reactions
- Social media buzz and quotes
- Potential impact on their career
- Timeline of events if applicable

Keep it respectful while being informative and engaging.`,
      targetLength: 600, // Shortened from 800
      tone: 'casual'
    });

    // Technology Template
    this.templates.set('technology', {
      type: 'technology',
      structure: {
        titleFormat: '{product/feature}: Everything You Need to Know About {innovation}',
        introduction: 'What is it, who made it, why it matters',
        sections: [
          'What\'s New - Key Features and Changes',
          'Technical Specifications and Details',
          'Comparison with Previous Versions/Competitors',
          'User Experience and Interface',
          'Availability and Pricing',
          'Industry Impact and Expert Opinions'
        ],
        conclusion: 'Should you care and what to expect next'
      },
      seoStrategy: {
        titlePattern: '{topic} - Features, Release Date, and Everything You Need to Know',
        metaDescriptionPattern: 'Complete guide to {topic}. Features, specs, release date, pricing, and expert analysis.',
        keywordStrategy: ['features', 'specs', 'release date', 'review', 'guide']
      },
      contentPrompt: `Write a comprehensive technology article about {topic}. Include:
- Clear explanation of what it is and what's new
- Key features and technical specifications
- How it compares to existing solutions
- User experience and practical applications
- Availability, pricing, and release information
- Industry expert opinions and analysis

Make it accessible to both tech enthusiasts and general readers.`,
      targetLength: 800, // Shortened from 1200
      tone: 'professional'
    });

    // Breaking News Template
    this.templates.set('breaking_news', {
      type: 'breaking_news',
      structure: {
        titleFormat: 'BREAKING: {event} - Latest Updates and Analysis',
        introduction: 'What happened, when, where, who is involved',
        sections: [
          'Breaking - What We Know So Far',
          'Timeline of Events',
          'Key Players and Stakeholders',
          'Immediate Impact and Consequences',
          'Official Statements and Reactions',
          'What Happens Next'
        ],
        conclusion: 'Current status and ongoing developments'
      },
      seoStrategy: {
        titlePattern: 'BREAKING: {topic} - Live Updates and Latest News',
        metaDescriptionPattern: 'Breaking news: {topic}. Get live updates, latest developments, and comprehensive coverage.',
        keywordStrategy: ['breaking news', 'live updates', 'latest', 'developing', 'coverage']
      },
      contentPrompt: `Write a breaking news article about {topic}. Include:
- Clear, factual reporting of what happened
- Timeline of events as they unfolded
- Key people and organizations involved
- Immediate impact and consequences
- Official statements and reactions
- Context and background information
- What to expect next

Maintain journalistic integrity and stick to verified facts.`,
      targetLength: 600, // Shortened from 900
      tone: 'news'
    });

    // Entertainment Template
    this.templates.set('entertainment', {
      type: 'entertainment',
      structure: {
        titleFormat: '{title/event}: {description} - Everything You Need to Know',
        introduction: 'What is it, who\'s involved, why fans are excited',
        sections: [
          'The Big Announcement/News',
          'Cast, Crew, and Key Players',
          'Plot, Features, or Event Details',
          'Release Date and Availability',
          'Fan Reactions and Social Media Buzz',
          'What This Means for the Franchise/Industry'
        ],
        conclusion: 'Why fans should be excited and what to expect'
      },
      seoStrategy: {
        titlePattern: '{topic} - Release Date, Cast, Plot, and Everything We Know',
        metaDescriptionPattern: 'Everything about {topic}: release date, cast, plot details, and latest updates for fans.',
        keywordStrategy: ['release date', 'cast', 'plot', 'trailer', 'news']
      },
      contentPrompt: `Write an entertaining article about {topic}. Include:
- What's new or exciting about this topic
- Key people involved (cast, creators, etc.)
- Important details fans want to know
- Release dates and availability information
- Fan reactions and social media buzz
- How this fits into the bigger picture

Make it engaging and exciting for fans while being informative.`,
      targetLength: 600, // Shortened from 900
      tone: 'casual'
    });

    // General Template (fallback)
    this.templates.set('general', {
      type: 'general',
      structure: {
        titleFormat: '{topic}: Complete Guide and Latest Updates',
        introduction: 'Overview of the topic and why it\'s trending',
        sections: [
          'What\'s Happening - The Full Story',
          'Background and Context',
          'Key Details and Information',
          'Impact and Significance',
          'Different Perspectives and Opinions',
          'What\'s Next'
        ],
        conclusion: 'Summary and future outlook'
      },
      seoStrategy: {
        titlePattern: '{topic} - Complete Guide, Latest News and Analysis',
        metaDescriptionPattern: 'Complete coverage of {topic}. Latest news, analysis, and everything you need to know.',
        keywordStrategy: ['guide', 'analysis', 'news', 'updates', 'complete']
      },
      contentPrompt: `Write a comprehensive article about {topic}. Include:
- Clear explanation of what this topic is about
- Why it's currently trending or newsworthy
- Important background information and context
- Key details and latest developments
- Different viewpoints and expert opinions
- Implications and what it means going forward

Make it informative and engaging for a general audience.`,
      targetLength: 700, // Shortened from 1000
      tone: 'professional'
    });
  }

  /**
   * Determine the best template for a trending topic
   */
  selectTemplate(topic: string, category: string, source?: string): ArticleTemplate {
    const topicLower = topic.toLowerCase();
    const categoryLower = category.toLowerCase();

    // Sports detection - enhanced
    if (categoryLower === 'sports' ||
        topicLower.includes('vs ') ||
        topicLower.includes(' vs ') ||
        topicLower.includes('game') ||
        topicLower.includes('match') ||
        topicLower.includes('playoff') ||
        topicLower.includes('championship') ||
        topicLower.includes('final') ||
        topicLower.includes('league') ||
        topicLower.includes('tournament')) {
      return this.templates.get('sports_event')!;
    }

    // Technology detection - enhanced
    if (categoryLower === 'technology' ||
        topicLower.includes('ios') ||
        topicLower.includes('android') ||
        topicLower.includes('app') ||
        topicLower.includes('software') ||
        topicLower.includes('update') ||
        topicLower.includes('feature') ||
        topicLower.includes('iphone') ||
        topicLower.includes('samsung') ||
        topicLower.includes('google') ||
        topicLower.includes('microsoft') ||
        topicLower.includes('apple') ||
        topicLower.includes('tech') ||
        topicLower.includes('ai') ||
        topicLower.includes('crypto') ||
        topicLower.includes('bitcoin')) {
      return this.templates.get('technology')!;
    }

    // Entertainment detection - enhanced
    if (categoryLower === 'entertainment' ||
        topicLower.includes('movie') ||
        topicLower.includes('series') ||
        topicLower.includes('album') ||
        topicLower.includes('concert') ||
        topicLower.includes('festival') ||
        topicLower.includes('coachella') ||
        topicLower.includes('netflix') ||
        topicLower.includes('disney') ||
        topicLower.includes('music') ||
        topicLower.includes('film') ||
        topicLower.includes('show') ||
        topicLower.includes('premiere') ||
        topicLower.includes('release') ||
        topicLower.includes('trailer')) {
      return this.templates.get('entertainment')!;
    }

    // Breaking news detection - enhanced
    if (source?.includes('SerpApi') &&
        (topicLower.includes('breaking') ||
         topicLower.includes('announces') ||
         topicLower.includes('dies') ||
         topicLower.includes('arrested') ||
         topicLower.includes('resigns') ||
         topicLower.includes('fired') ||
         topicLower.includes('scandal') ||
         topicLower.includes('emergency'))) {
      return this.templates.get('breaking_news')!;
    }

    // Celebrity news detection - enhanced
    if (this.isCelebrityName(topic) ||
        topicLower.includes('celebrity') ||
        topicLower.includes('star') ||
        topicLower.includes('actor') ||
        topicLower.includes('actress') ||
        topicLower.includes('singer') ||
        topicLower.includes('musician')) {
      return this.templates.get('celebrity_news')!;
    }

    // Default to general template
    return this.templates.get('general')!;
  }

  /**
   * Enhanced celebrity name detection
   */
  private isCelebrityName(topic: string): boolean {
    const celebrityIndicators = [
      'ellen degeneres', 'taylor swift', 'elon musk', 'kim kardashian',
      'justin bieber', 'ariana grande', 'drake', 'beyonce', 'kanye west',
      'jennifer lawrence', 'brad pitt', 'angelina jolie', 'leonardo dicaprio',
      'tom cruise', 'will smith', 'robert downey', 'scarlett johansson',
      'chris evans', 'ryan reynolds', 'dwayne johnson', 'the rock',
      'oprah winfrey', 'jimmy fallon', 'stephen colbert', 'joe rogan',
      'pewdiepie', 'mr beast', 'logan paul', 'jake paul'
    ];

    const topicLower = topic.toLowerCase();
    return celebrityIndicators.some(name => topicLower.includes(name));
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): ArticleTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by type
   */
  getTemplate(type: string): ArticleTemplate | undefined {
    return this.templates.get(type);
  }
}

export const articleTemplateService = new ArticleTemplateService();
export default articleTemplateService;
