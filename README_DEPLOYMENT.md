# BotForge - AI Chatbot Builder

Build, deploy, and manage intelligent AI chatbots powered by your own documents.

## 🚀 Live Demo

- **Frontend**: [Your Vercel URL]
- **Backend API**: [Your Render URL]

## ✨ Features

- 🤖 **AI-Powered Chatbots** - Create intelligent bots using Google Gemini
- 📄 **Document Processing** - Upload PDF, DOCX, and TXT files
- 🔍 **Semantic Search** - Qdrant vector database for accurate context retrieval
- 🎨 **Professional UI** - Clean black & white design
- 🔐 **Secure Authentication** - Supabase authentication
- ⚡ **Instant Deployment** - Deploy in 15 minutes
- 🌐 **Easy Integration** - Embed chatbot with a single script tag

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Google Gemini** - AI language model
- **Qdrant Cloud** - Vector database
- **Supabase** - Authentication & database
- **Sentence Transformers** - Text embeddings

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Framer Motion** - Animations

## 📦 Deployment

### Quick Deploy (15 minutes)
```bash
# 1. Clone and setup
git clone https://github.com/YOUR_USERNAME/botforge.git
cd botforge

# 2. Follow the quick guide
See QUICK_DEPLOY.md
```

### Deployment Options
- **Quick Start**: `QUICK_DEPLOY.md` - Deploy in 15 minutes
- **Detailed Guide**: `DEPLOYMENT.md` - Comprehensive instructions
- **Checklist**: `DEPLOYMENT_CHECKLIST.md` - Track your progress

## 🏃 Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account
- Qdrant Cloud account
- Google AI API key

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

Visit `http://localhost:5173`

## 📚 Documentation

- `DEPLOYMENT.md` - Complete deployment guide
- `QUICK_DEPLOY.md` - Quick start guide
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist
- `DEPLOYMENT_SUMMARY.md` - Overview of deployment setup

## 🔑 Environment Variables

### Backend (.env)
```env
GOOGLE_API_KEY=your_google_api_key
JWT_SECRET=your_jwt_secret
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
FRONTEND_URL=your_frontend_url
```

### Frontend (.env.local)
```env
VITE_API_URL=your_backend_url
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Usage

1. **Sign Up** - Create an account
2. **Create Bot** - Upload your documents
3. **Test Bot** - Chat with your AI assistant
4. **Get Widget Code** - Embed on your website
5. **Deploy** - Share with the world

## 🌟 Key Features Explained

### Document Processing
- Supports PDF, DOCX, and TXT files
- Automatic text extraction and chunking
- Semantic embeddings for accurate search

### AI Chat
- Powered by Google Gemini
- Context-aware responses
- Real-time streaming (optional)

### Vector Search
- Qdrant Cloud for fast similarity search
- Semantic understanding of queries
- Relevant context retrieval

### Authentication
- Secure Supabase authentication
- JWT token-based sessions
- Row-level security

## 💰 Costs

### Free Tier (Testing)
- Render: 750 hours/month
- Vercel: 100GB bandwidth/month
- **Total: $0/month**

### Production
- Render: $7/month (recommended)
- Vercel: Free or $20/month
- **Total: $7-27/month**

## 🐛 Troubleshooting

### Common Issues

**Backend not starting?**
- Check Python version (3.11+)
- Verify all environment variables
- Check Render logs

**Frontend can't connect?**
- Verify VITE_API_URL is correct
- Check CORS settings
- Ensure backend is running

**Authentication failing?**
- Verify Supabase credentials
- Check redirect URLs in Supabase
- Review browser console

See `DEPLOYMENT.md` for detailed troubleshooting.

## 📈 Performance

- **Fast Loading** - Optimized build with code splitting
- **Lazy Loading** - Documents load on-demand
- **Caching** - Smart caching strategies
- **CDN** - Vercel's global CDN

## 🔐 Security

- Environment-based configuration
- Secure authentication with Supabase
- HTTPS everywhere
- Row-level security
- No sensitive data in code

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- Qdrant for vector search
- Supabase for backend services
- Vercel & Render for hosting

## 📞 Support

- **Issues**: GitHub Issues
- **Documentation**: See `/docs` folder
- **Email**: [Your email]

## 🎉 Ready to Deploy?

Start with `QUICK_DEPLOY.md` and have your app live in 15 minutes!

---

**Made with ❤️ using FastAPI, React, and AI**
