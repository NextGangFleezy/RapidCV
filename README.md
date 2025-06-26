# RapidCV - Professional Resume Builder

A modern, full-stack TypeScript resume builder application with AI-powered features, built with React and optimized for Vercel deployment.

## 🚀 Features

- **Resume Builder**: Intuitive multi-step form with real-time preview
- **Professional Templates**: Clean, modern resume designs
- **AI-Powered Tools**: 
  - Cover letter generation based on job descriptions
  - Job match analysis with improvement suggestions
- **PDF Export**: High-quality PDF generation
- **Authentication**: Secure Firebase authentication
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and build
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for state management
- **Wouter** for routing

### Backend
- **Express.js** (development) / **Vercel Functions** (production)
- **Firebase Authentication**
- **Anthropic Claude** for AI features
- **PostgreSQL** with Drizzle ORM

## 🏗️ Project Structure

```
/
├── src/                    # React frontend code
│   ├── components/         # UI components
│   ├── pages/             # Route components
│   ├── lib/               # Utilities and configurations
│   └── hooks/             # Custom React hooks
├── server/                # Express backend (development)
├── api/                   # Vercel serverless functions
├── shared/                # Shared TypeScript schemas
├── public/                # Static assets
├── package.json           # Dependencies and scripts
├── vercel.json           # Vercel deployment config
└── index.html            # Entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/rapidcv.git
cd rapidcv
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Add your Firebase and Anthropic API keys:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Start the development server
```bash
npm run dev
```

Visit `http://localhost:5000` to see the application.

## 🔧 Environment Setup

### Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password
3. Add your domain to authorized domains
4. Copy your project configuration

### Anthropic API
1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Add it to your environment variables

## 📦 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm run vercel-build
```

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run vercel-build` - Build for Vercel deployment
- `npm run type-check` - Run TypeScript type checking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Icons by [Lucide React](https://lucide.dev/)
- AI powered by [Anthropic Claude](https://www.anthropic.com/)
- Authentication by [Firebase](https://firebase.google.com/)

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.