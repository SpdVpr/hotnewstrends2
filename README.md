# HotNewsTrends.com 🔥

AI-powered news automation system that delivers comprehensive articles about trending topics within hours. Built with Next.js 15, TypeScript, and Firebase.

## ✨ Features

- **AI-Powered Content Generation**: Uses Perplexity API for high-quality article creation
- **Google Trends Integration**: Real-time trending topics via SerpAPI
- **Automated Publishing**: Smart scheduling and content optimization
- **Firebase Backend**: Scalable data storage and real-time updates
- **Admin Dashboard**: Comprehensive content management system
- **SEO Optimized**: Structured data, sitemaps, and performance optimization
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Performance Monitoring**: Built-in analytics and error tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Firebase account
- Perplexity API key
- SerpAPI key (for Google Trends)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SpdVpr/hotnewstrends.git
   cd hotnewstrends
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your API keys and Firebase configuration in `.env.local`:
   ```env
   PERPLEXITY_API_KEY=your_perplexity_api_key_here
   SERPAPI_KEY=your_serpapi_key_here
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   # ... other Firebase config
   ```

4. **Firebase Setup**
   ```bash
   node scripts/init-firebase.js
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin dashboard
│   │   └── article/        # Article pages
│   ├── components/         # React components
│   │   ├── admin/          # Admin-specific components
│   │   └── ui/             # Reusable UI components
│   ├── lib/                # Utilities and services
│   │   └── services/       # Business logic services
│   └── types/              # TypeScript definitions
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── public/                 # Static assets
```

## 🔧 Configuration

### Environment Variables

All sensitive configuration is handled through environment variables. See `.env.example` for the complete list of required variables.

### Firebase Setup

The project uses Firebase for:
- **Firestore**: Article and trend data storage
- **Storage**: Image and media files
- **Analytics**: Performance tracking

Run the Firebase setup script to configure your project:
```bash
node scripts/init-firebase.js
```

## 🤖 Automation Features

### Article Generation
- Monitors Google Trends for trending topics
- Generates comprehensive articles using AI
- Automatic categorization and tagging
- SEO optimization and structured data

### Content Scheduling
- Smart publishing times based on topic analysis
- Duplicate content prevention
- Quality scoring and filtering
- Performance-based optimization

### Admin Dashboard
Access the admin panel at `/admin` to:
- Monitor trending topics
- Manage article generation
- View analytics and performance
- Configure automation settings

## 📊 API Documentation

The project includes comprehensive API documentation. See `API_DOCUMENTATION.md` for detailed endpoint information.

Key endpoints:
- `GET /api/trends` - Get trending topics
- `POST /api/automation/generate` - Generate articles
- `GET /api/articles` - Retrieve articles
- `GET /api/serpapi-usage` - Monitor API usage

## 🔒 Security

- All API keys use environment variables
- No hardcoded secrets in codebase
- Comprehensive `.gitignore` for sensitive files
- Firebase security rules for data protection

## 📈 Performance

- Server-side rendering with Next.js 15
- Optimized images and assets
- Built-in caching strategies
- Performance monitoring and analytics

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing

Run individual test scripts:
```bash
node test-perplexity.js      # Test Perplexity API
node test-generate-article.js # Test article generation
```

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For questions or support, contact the project maintainer.

---

**HotNewsTrends.com** - Where Speed Meets Style ⚡
