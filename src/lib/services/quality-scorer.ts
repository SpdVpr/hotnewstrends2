/**
 * Quality Scoring Service
 * Evaluates the quality of generated articles across multiple dimensions
 */

export interface QualityScore {
  content: number;      // 0-100 (length, structure, informativeness)
  seo: number;         // 0-100 (keywords, meta tags, structure)
  relevance: number;   // 0-100 (relevance to trend)
  uniqueness: number;  // 0-100 (content originality)
  overall: number;     // average of all metrics
}

export interface QualityMetrics {
  wordCount: number;
  paragraphCount: number;
  headingCount: number;
  keywordDensity: number;
  readabilityScore: number;
  uniquenessScore: number;
  seoScore: number;
}

class QualityScorerService {
  
  /**
   * Calculate comprehensive quality score for an article
   */
  calculateQualityScore(
    title: string,
    content: string,
    seoTitle: string,
    seoDescription: string,
    topic: string,
    tags: string[]
  ): QualityScore {
    const contentScore = this.evaluateContent(content);
    const seoScore = this.evaluateSEO(title, content, seoTitle, seoDescription, tags);
    const relevanceScore = this.evaluateRelevance(title, content, topic);
    const uniquenessScore = this.evaluateUniqueness(content);

    const overall = Math.round((contentScore + seoScore + relevanceScore + uniquenessScore) / 4);

    return {
      content: contentScore,
      seo: seoScore,
      relevance: relevanceScore,
      uniqueness: uniquenessScore,
      overall
    };
  }

  /**
   * Evaluate content quality (structure, length, informativeness)
   */
  private evaluateContent(content: string): number {
    let score = 0;
    
    // Word count scoring (800-1200 words is optimal)
    const wordCount = this.countWords(content);
    if (wordCount >= 800 && wordCount <= 1200) {
      score += 25;
    } else if (wordCount >= 600 && wordCount <= 1500) {
      score += 20;
    } else if (wordCount >= 400) {
      score += 15;
    } else {
      score += 5;
    }

    // Paragraph structure (5-8 paragraphs is good)
    const paragraphCount = content.split('\n\n').length;
    if (paragraphCount >= 5 && paragraphCount <= 8) {
      score += 20;
    } else if (paragraphCount >= 3) {
      score += 15;
    } else {
      score += 5;
    }

    // Heading structure (H2, H3 tags)
    const headingCount = (content.match(/#{2,3}\s/g) || []).length;
    if (headingCount >= 3 && headingCount <= 6) {
      score += 20;
    } else if (headingCount >= 1) {
      score += 15;
    } else {
      score += 5;
    }

    // Content depth (mentions of specific details, numbers, quotes)
    const depthIndicators = [
      /\d{1,3}[,.]?\d*%/g,  // percentages
      /\$\d+/g,             // money amounts
      /\d{4}/g,             // years
      /"\w+.*?"/g,          // quotes
      /according to/gi,     // source attribution
      /research shows/gi,   // research references
    ];
    
    let depthScore = 0;
    depthIndicators.forEach(regex => {
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        depthScore += Math.min(matches.length * 2, 10);
      }
    });
    score += Math.min(depthScore, 25);

    // Readability (sentence length variety)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    if (avgSentenceLength >= 15 && avgSentenceLength <= 25) {
      score += 10;
    } else if (avgSentenceLength >= 10 && avgSentenceLength <= 30) {
      score += 8;
    } else {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * Evaluate SEO optimization
   */
  private evaluateSEO(
    title: string, 
    content: string, 
    seoTitle: string, 
    seoDescription: string, 
    tags: string[]
  ): number {
    let score = 0;

    // Title optimization (50-60 characters)
    if (seoTitle.length >= 50 && seoTitle.length <= 60) {
      score += 20;
    } else if (seoTitle.length >= 40 && seoTitle.length <= 70) {
      score += 15;
    } else {
      score += 5;
    }

    // Meta description (150-160 characters)
    if (seoDescription.length >= 150 && seoDescription.length <= 160) {
      score += 20;
    } else if (seoDescription.length >= 120 && seoDescription.length <= 180) {
      score += 15;
    } else {
      score += 5;
    }

    // Keyword presence in title
    const titleWords = title.toLowerCase().split(' ');
    const contentWords = content.toLowerCase().split(' ');
    const keywordInTitle = titleWords.some(word => 
      word.length > 3 && contentWords.filter(cw => cw === word).length >= 3
    );
    if (keywordInTitle) score += 15;

    // Heading structure with keywords
    const headings = content.match(/#{2,3}\s.*$/gm) || [];
    const headingsWithKeywords = headings.filter(heading => 
      titleWords.some(word => word.length > 3 && heading.toLowerCase().includes(word))
    );
    if (headingsWithKeywords.length >= 2) {
      score += 15;
    } else if (headingsWithKeywords.length >= 1) {
      score += 10;
    }

    // Tag relevance (3-7 tags is optimal)
    if (tags.length >= 3 && tags.length <= 7) {
      score += 15;
    } else if (tags.length >= 1) {
      score += 10;
    }

    // Internal linking opportunities (mentions of related topics)
    const linkingOpportunities = (content.match(/related|similar|also|additionally|furthermore/gi) || []).length;
    score += Math.min(linkingOpportunities * 2, 15);

    return Math.min(score, 100);
  }

  /**
   * Evaluate relevance to the trending topic
   */
  private evaluateRelevance(title: string, content: string, topic: string): number {
    let score = 0;
    
    const topicWords = topic.toLowerCase().split(' ').filter(word => word.length > 2);
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    // Topic words in title
    const topicWordsInTitle = topicWords.filter(word => titleLower.includes(word));
    score += (topicWordsInTitle.length / topicWords.length) * 30;

    // Topic words in content (frequency matters)
    let totalMentions = 0;
    topicWords.forEach(word => {
      const mentions = (contentLower.match(new RegExp(word, 'g')) || []).length;
      totalMentions += mentions;
    });
    
    // Optimal frequency: 1-2% of total words
    const wordCount = this.countWords(content);
    const frequency = totalMentions / wordCount;
    if (frequency >= 0.01 && frequency <= 0.02) {
      score += 40;
    } else if (frequency >= 0.005 && frequency <= 0.03) {
      score += 30;
    } else if (frequency > 0) {
      score += 20;
    }

    // Context relevance (topic appears in meaningful contexts)
    const contextPatterns = [
      new RegExp(`${topicWords[0]}.*?(analysis|review|update|news|report)`, 'gi'),
      new RegExp(`(latest|recent|new).*?${topicWords[0]}`, 'gi'),
      new RegExp(`${topicWords[0]}.*?(impact|effect|result|outcome)`, 'gi')
    ];
    
    contextPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        score += 10;
      }
    });

    return Math.min(score, 100);
  }

  /**
   * Evaluate content uniqueness (basic implementation)
   */
  private evaluateUniqueness(content: string): number {
    // This is a simplified uniqueness check
    // In production, you'd compare against existing articles in database
    
    let score = 80; // Base score assuming content is unique
    
    // Check for common filler phrases that indicate low-quality content
    const fillerPhrases = [
      'it is important to note',
      'in conclusion',
      'as we can see',
      'it goes without saying',
      'needless to say',
      'at the end of the day'
    ];
    
    const contentLower = content.toLowerCase();
    fillerPhrases.forEach(phrase => {
      if (contentLower.includes(phrase)) {
        score -= 5;
      }
    });

    // Check for repetitive content (same sentence patterns)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const uniqueSentenceStarts = new Set(
      sentences.map(s => s.trim().substring(0, 20).toLowerCase())
    );
    
    const uniquenessRatio = uniqueSentenceStarts.size / sentences.length;
    if (uniquenessRatio < 0.8) {
      score -= 20;
    } else if (uniquenessRatio < 0.9) {
      score -= 10;
    }

    return Math.max(score, 0);
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get quality recommendations based on score
   */
  getQualityRecommendations(score: QualityScore): string[] {
    const recommendations: string[] = [];

    if (score.content < 70) {
      recommendations.push('Increase content length and add more detailed sections');
      recommendations.push('Add more headings and improve structure');
    }

    if (score.seo < 70) {
      recommendations.push('Optimize title length (50-60 characters)');
      recommendations.push('Improve meta description (150-160 characters)');
      recommendations.push('Add more relevant keywords in headings');
    }

    if (score.relevance < 70) {
      recommendations.push('Include topic keywords more naturally in content');
      recommendations.push('Add more specific details about the trending topic');
    }

    if (score.uniqueness < 70) {
      recommendations.push('Reduce repetitive phrases and filler content');
      recommendations.push('Add more original insights and analysis');
    }

    if (score.overall >= 85) {
      recommendations.push('✅ High quality article - ready for publication');
    } else if (score.overall >= 70) {
      recommendations.push('⚠️ Good quality - minor improvements recommended');
    } else {
      recommendations.push('❌ Needs improvement before publication');
    }

    return recommendations;
  }
}

export const qualityScorerService = new QualityScorerService();
export default qualityScorerService;
