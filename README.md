# 🌾 Kisan Chat — AI Agricultural Assistant

A full-stack multilingual chat application designed for farmers. Powered by Azure AI Foundry Agent, secured with Supabase authentication, and deployed on Vercel.

**Ask farming questions in your language, get AI-powered answers with relevant product recommendations.**

## ✨ Features

- 🌐 **Multilingual Support** - Chat in Hindi, English, and more
- 🔐 **Secure Authentication** - Supabase Auth with email/password and Google OAuth
- 🤖 **AI-Powered Responses** - Azure AI Foundry Agent for accurate farming advice
- 📦 **Product Recommendations** - Smart product suggestions with pricing and usage instructions
- 🎤 **Voice Input** - Web Speech API for hands-free chat (Hindi & English)
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 💾 **Session Management** - Persistent chat history per user
- 🎨 **Beautiful UI** - Tailwind CSS with smooth animations

## 📁 Project Structure

```
kisan-app/
├── api/                          # Vercel serverless functions
│   └── chat.js                   # Main chat endpoint
├── frontend/                     # React + Vite application
│   ├── src/
│   │   ├── components/           # UI components
│   │   │   ├── AuthCallback.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── WelcomeScreen.jsx
│   │   ├── contexts/             # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useChat.js
│   │   │   └── useSpeechRecognition.js
│   │   ├── services/             # API services
│   │   │   └── api.js
│   │   ├── i18n/                 # Internationalization
│   │   │   └── translations.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account (for authentication)
- Azure AI Foundry project (for backend)

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Update .env.local with your Supabase credentials
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key

# Start development server
npm run dev
```

The frontend will run at `http://localhost:5173`

### Backend (Vercel) Setup

```bash
# Root directory setup
npm install

# Environment variables (set in Vercel dashboard)
# - AZURE_SEARCH_ENDPOINT
# - AZURE_SEARCH_KEY
# - AZURE_OPENAI_ENDPOINT
# - AZURE_OPENAI_KEY
# - ANTHROPIC_API_KEY
# - SUPABASE_JWT_SECRET

# Deploy to Vercel
vercel deploy
```

## 🔐 Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Description | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `VITE_API_BASE_URL` | Backend API URL (optional) | `/api` or `http://localhost:8000` |

### Backend (Vercel - `vercel.json`)

| Variable | Description |
|---|---|
| `AZURE_SEARCH_ENDPOINT` | Azure AI Search endpoint |
| `AZURE_SEARCH_KEY` | Azure AI Search API key |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint |
| `AZURE_OPENAI_KEY` | Azure OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude) |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret for token verification |

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Supabase** - Authentication & backend
- **React Markdown** - Message rendering
- **Web Speech API** - Voice input

### Backend
- **Node.js 18** - Runtime
- **Vercel Functions** - Serverless deployment
- **Azure AI Foundry Agent** - AI responses
- **Azure Search** - RAG & product search
- **jose** - JWT verification

### Tools & Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📱 API Endpoints

### POST `/api/chat`
Send a message and get an AI response with product recommendations.

**Request:**
```json
{
  "message": "How do I treat powdery mildew on my wheat crop?",
  "language": "hi"
}
```

**Response:**
```json
{
  "message": "Powdery mildew का इलाज...",
  "products": [
    {
      "name": "Sulfur Dust",
      "type": "FUNGICIDES",
      "price": 450,
      "unit": "kg",
      "buy_link": "https://...",
      "diseases": ["Powdery Mildew", "Rust"],
      "crops": ["Wheat", "Barley"],
      "features": "Effective organic fungicide...",
      "usage": [...]
    }
  ]
}
```

### POST `/api/clear`
Clear user's chat history.

**Request:**
```json
{}
```

## 🎨 Features in Detail

### Authentication Flow
1. User signs up with email/password or Google OAuth
2. Supabase generates JWT token
3. Frontend stores session with token
4. Backend verifies JWT on each request
5. Secure chat history per user

### Chat Experience
1. User types or speaks a farming question
2. Frontend sends to Vercel backend with JWT
3. Backend verifies token and calls Azure AI Foundry Agent
4. Agent searches products in Azure AI Search
5. Response includes answer + relevant products
6. Frontend displays message with product cards
7. User can click products for details

### Product Recommendations
- AI recommends relevant products based on query
- Shows price, dosage, usage instructions
- Links to buy products
- Organized by disease, crop type, and category

## 📚 Scripts

```bash
# Frontend
cd frontend

npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

```bash
# Backend (Root)
npm run dev          # Run Vercel dev server
npm run build        # Build for production
npm run lint         # Lint API functions
```

## 🌍 Supported Languages

- 🇮🇳 Hindi (hi)
- 🇬🇧 English (en)
- *(More languages can be added in `frontend/src/i18n/translations.js`)*

## 📖 Documentation

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Vercel Functions](https://vercel.com/docs/functions/serverless-functions)
- [Azure AI Foundry](https://azure.microsoft.com/en-us/products/ai-foundry/)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

## 🚢 Deployment

### Deploy Frontend
```bash
cd frontend
vercel deploy
```

### Deploy Backend
```bash
vercel deploy
```

Both frontend and backend are deployed on Vercel with automatic CI/CD.

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'feat: add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 👥 Authors

- **Shrawani** - Developer

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Made with 💚 for Indian Farmers**
