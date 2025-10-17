# No-Code AI Chatbot Builder

A full-stack application that allows users to create AI-powered chatbots by uploading documents. The system processes documents, creates vector embeddings, and enables intelligent question-answering through a chat interface.

## 🚀 Features

- **Document Upload**: Support for PDF, DOCX, and TXT files
- **AI-Powered Chat**: Context-aware responses using Google Gemini
- **Vector Search**: Powered by Qdrant for fast similarity search
- **User Management**: Secure authentication with Supabase
- **Bot Management**: Create, manage, and delete multiple chatbots
- **Widget Generation**: Embeddable chat widgets for websites
- **Real-time Dashboard**: Monitor bot performance and statistics

## 🏗️ Architecture

### Backend (FastAPI + Python)
- **Framework**: FastAPI with Python 3.8+
- **Authentication**: Supabase Auth with JWT tokens
- **Vector Database**: Qdrant for embeddings and similarity search
- **AI/ML**: Google Gemini API, Sentence Transformers
- **Document Processing**: LangChain, PyPDF2, python-docx

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Libraries**: Framer Motion, Lucide React, Recharts
- **State Management**: Context API

## 📦 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- Docker (for Qdrant)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chatbot-builder
```

### 2. Set Up Qdrant (Vector Database)

```bash
# Start Qdrant using Docker
docker-compose up -d qdrant

# Verify Qdrant is running
curl http://localhost:6333/health
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file and configure
cp .env.example .env
# Edit .env with your API keys and settings

# Test Qdrant connection
python test_qdrant.py

# Start the backend
uvicorn main:app --reload --port 8000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Qdrant Dashboard**: http://localhost:6333/dashboard

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Google AI
GOOGLE_API_KEY=your_google_api_key_here

# Supabase
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# JWT
JWT_SECRET=your_jwt_secret_here

# Qdrant (Local)
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Qdrant (Cloud) - Alternative to local setup
# QDRANT_URL=https://your-cluster-url.qdrant.io
# QDRANT_API_KEY=your-api-key

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 🔄 Migration from FAISS

If you're upgrading from a FAISS-based version:

1. **Ensure Qdrant is running**
2. **Run the migration script**:
   ```bash
   cd backend
   python migrate_to_qdrant.py
   ```
3. **Verify the migration**:
   ```bash
   python migrate_to_qdrant.py verify
   ```

See [QDRANT_SETUP.md](QDRANT_SETUP.md) for detailed migration instructions.

## 🧪 Testing

### Test Qdrant Integration

```bash
cd backend

# Quick connection test
python test_qdrant.py connection

# Full integration test
python test_qdrant.py
```

### Test API Health

```bash
curl http://localhost:8000/api/health
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

- `POST /auth/login` - User authentication
- `POST /api/upload` - Upload documents and create bot
- `POST /api/chat` - Chat with bot (public)
- `GET /api/bots` - List user's bots
- `GET /api/health` - System health check

## 🚀 Deployment

### Production Considerations

1. **Use Qdrant Cloud** for production vector storage
2. **Set up proper environment variables** for production
3. **Configure CORS** for your domain
4. **Use HTTPS** for all communications
5. **Set up monitoring** and logging
6. **Regular backups** of Qdrant collections

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individual services
docker build -t chatbot-backend ./backend
docker build -t chatbot-frontend ./frontend
```

## 🛠️ Development

### Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Configuration
│   │   ├── models/       # Pydantic models
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context
│   │   └── lib/          # API client
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml
```

### Adding New Features

1. **Backend**: Add endpoints in `backend/app/api/`
2. **Frontend**: Add components in `frontend/src/components/`
3. **Database**: Use Supabase for relational data
4. **Vector Data**: Use Qdrant for embeddings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check the inline code comments and API docs
- **Issues**: Create GitHub issues for bugs or feature requests
- **Qdrant Help**: See [QDRANT_SETUP.md](QDRANT_SETUP.md) for vector database setup

## 🔮 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Custom AI model integration
- [ ] Webhook support for chat events
- [ ] Advanced document preprocessing
- [ ] Team collaboration features