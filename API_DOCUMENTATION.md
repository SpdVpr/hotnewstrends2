# HotNewsTrends API Documentation

## Overview

HotNewsTrends provides a comprehensive REST API for content automation, trend analysis, and article management. The API is designed to support the automated generation of trending news articles using AI-powered content creation.

## Base URL

```
Production: https://hotnewstrends.com/api
Development: http://localhost:3001/api
```

## Authentication

Most endpoints are public, but admin endpoints require authentication:

```bash
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### 1. Trends API

#### GET /api/trends
Get trending topics from various sources.

**Parameters:**
- `region` (optional): Region code (default: "US")
- `category` (optional): Category filter (default: "all")
- `timeframe` (optional): Time range (default: "now 1-d")

**Response:**
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "keyword": "AI Revolution",
        "searchVolume": 125000,
        "growthRate": 45.2,
        "category": "Technology",
        "region": "US",
        "relatedQueries": ["artificial intelligence", "machine learning"],
        "timeframe": "now 1-d",
        "confidence": 0.92
      }
    ],
    "lastUpdated": "2025-01-15T10:30:00Z",
    "region": "US",
    "timeframe": "now 1-d",
    "total": 5
  }
}
```

#### POST /api/trends
Get detailed information about a specific topic.

**Body:**
```json
{
  "keyword": "AI Revolution",
  "region": "US"
}
```

### 2. Automation API

#### GET /api/automation
Get automation service status and statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalJobs": 25,
    "todayJobs": 3,
    "completedJobs": 20,
    "failedJobs": 2,
    "pendingJobs": 1,
    "generatingJobs": 2,
    "isRunning": true,
    "config": {
      "enabled": true,
      "interval": 60,
      "maxArticlesPerDay": 15,
      "minConfidenceScore": 0.7,
      "minGrowthRate": 25
    }
  }
}
```

#### POST /api/automation
Control the automation service.

**Body:**
```json
{
  "action": "start|stop|updateConfig",
  "config": {
    "maxArticlesPerDay": 20,
    "minConfidenceScore": 0.8
  }
}
```

### 3. Article Generation

#### POST /api/automation/generate
Manually generate an article for a specific topic.

**Body:**
```json
{
  "topic": "Quantum Computing Breakthrough",
  "category": "Technology"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Article generation started",
  "data": {
    "jobId": "job_1642234567890_abc123",
    "topic": "Quantum Computing Breakthrough",
    "category": "Technology",
    "status": "pending",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### 4. Job Management

#### GET /api/automation/jobs
Get list of all automation jobs.

**Parameters:**
- `status` (optional): Filter by status (pending|generating|completed|failed)
- `limit` (optional): Number of results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_1642234567890_abc123",
        "topic": "AI Revolution",
        "category": "Technology",
        "status": "completed",
        "createdAt": "2025-01-15T10:00:00Z",
        "completedAt": "2025-01-15T10:05:00Z",
        "article": {
          "id": "article_1642234567890_def456",
          "title": "AI Revolution Transforms Digital Marketing",
          "slug": "ai-revolution-transforms-digital-marketing",
          "excerpt": "Latest developments in AI...",
          "publishedAt": "2025-01-15T10:05:00Z"
        }
      }
    ],
    "total": 25,
    "stats": {
      "pending": 1,
      "generating": 2,
      "completed": 20,
      "failed": 2
    }
  }
}
```

#### GET /api/automation/jobs/[jobId]
Get detailed information about a specific job.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job_1642234567890_abc123",
    "topic": "AI Revolution",
    "category": "Technology",
    "status": "completed",
    "createdAt": "2025-01-15T10:00:00Z",
    "completedAt": "2025-01-15T10:05:00Z",
    "article": {
      "id": "article_1642234567890_def456",
      "title": "AI Revolution Transforms Digital Marketing Landscape",
      "slug": "ai-revolution-transforms-digital-marketing-landscape",
      "excerpt": "Latest developments in artificial intelligence...",
      "content": "# AI Revolution Transforms...",
      "author": "Sarah Chen",
      "publishedAt": "2025-01-15T10:05:00Z",
      "readTime": "3 min read",
      "tags": ["AI", "Marketing", "Technology"],
      "seoTitle": "AI Revolution in Digital Marketing 2025",
      "seoDescription": "Discover how AI is transforming...",
      "image": "https://images.unsplash.com/photo-..."
    }
  }
}
```

### 5. Cron Jobs

#### GET /api/cron/automation
Trigger automation cycle (for cron services).

**Headers:**
```
Authorization: Bearer CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "message": "Automation cycle completed",
  "data": {
    "isRunning": true,
    "todayJobs": 5,
    "totalJobs": 30,
    "completedJobs": 25,
    "failedJobs": 2,
    "timestamp": "2025-01-15T12:00:00Z"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

## Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited:
- Public endpoints: 100 requests per minute
- Admin endpoints: 1000 requests per minute
- Cron endpoints: No limit (with proper authentication)

## Webhooks

TrendyBlogger can send webhooks for important events:

### Article Published
```json
{
  "event": "article.published",
  "data": {
    "articleId": "article_123",
    "title": "Article Title",
    "slug": "article-slug",
    "publishedAt": "2025-01-15T10:00:00Z"
  }
}
```

### Job Completed
```json
{
  "event": "job.completed",
  "data": {
    "jobId": "job_123",
    "status": "completed",
    "articleId": "article_456"
  }
}
```

## SDKs and Libraries

### JavaScript/Node.js
```bash
npm install @hotnewstrends/api-client
```

```javascript
import { HotNewsTrendsAPI } from '@hotnewstrends/api-client';

const api = new HotNewsTrendsAPI({
  apiKey: 'your-api-key',
  baseUrl: 'https://hotnewstrends.com/api'
});

// Get trending topics
const trends = await api.trends.get({ region: 'US' });

// Generate article
const job = await api.automation.generateArticle({
  topic: 'AI Revolution',
  category: 'Technology'
});
```

### Python
```bash
pip install hotnewstrends-api
```

```python
from hotnewstrends import HotNewsTrendsAPI

api = HotNewsTrendsAPI(api_key='your-api-key')

# Get trending topics
trends = api.trends.get(region='US')

# Generate article
job = api.automation.generate_article(
    topic='AI Revolution',
    category='Technology'
)
```

## Examples

### Automated Content Pipeline

1. **Get Trending Topics**
```bash
curl -X GET "https://hotnewstrends.com/api/trends?region=US&category=Technology"
```

2. **Generate Article**
```bash
curl -X POST "https://hotnewstrends.com/api/automation/generate" \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI Revolution", "category": "Technology"}'
```

3. **Monitor Job Status**
```bash
curl -X GET "https://hotnewstrends.com/api/automation/jobs/job_123"
```

4. **Access Published Article**
```bash
curl -X GET "https://hotnewstrends.com/article/ai-revolution-transforms-digital-marketing"
```

## Support

For API support and questions:
- Email: api-support@hotnewstrends.com
- Documentation: https://docs.hotnewstrends.com
- Status Page: https://status.hotnewstrends.com
