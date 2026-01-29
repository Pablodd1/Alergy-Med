# Allergy Scribe

A comprehensive medical documentation application for allergists, built with Next.js 14, TypeScript, and MongoDB. The application provides an end-to-end workflow for capturing, reviewing, and generating medical notes from various sources including audio recordings, images, documents, and text input.

## 🎯 Project Overview

- **Name**: Allergy Scribe
- **Goal**: Streamline medical note generation for allergy and immunology specialists
- **Features**: Multi-modal data capture, AI-powered information extraction, comprehensive review interface, automated note generation with export capabilities

## 🌐 URLs

- **Development**: http://localhost:3002
- **Production**: [To be deployed]
- **GitHub**: [Repository URL]

## 🏗️ Data Architecture

### Data Models
- **User Model**: Username, email, password (bcrypt), firstName, lastName, role, isActive, timestamps
- **Visit Model**: visitId, userId, patientAlias, chiefComplaint, sources[], extraction{}, note{}, status, timestamps

### Storage Services
- **Primary Database**: MongoDB (Mongoose ODM)
- **Authentication**: NextAuth.js with JWT sessions
- **File Processing**: OCR for images, document parsing for PDFs/DOCX
- **AI Processing**: OpenAI GPT-4 for medical information extraction

### Data Flow
1. User creates visit → Stored in MongoDB
2. Capture sources (audio, images, documents, text) → Sources saved to visit
3. AI extraction on sources → Extraction data saved to visit
4. Review and edit extraction → Updated extraction saved
5. Generate note from extraction → Note saved to visit
6. Export note (PDF/DOCX/Clipboard) → Final output

## 🚀 Current Status

### ✅ Completed Features
- **Authentication System**: NextAuth with MongoDB user management
- **User Registration**: Sign-up page with email/username validation
- **Login/Logout**: Secure credential-based authentication
- **Multi-modal Capture**: Audio recording, image capture, file upload, text input
- **AI Extraction**: OpenAI-powered medical information extraction with strict schema
- **Review Interface**: Comprehensive review and editing of extracted information
- **Note Generation**: Automated medical note generation with fallback to manual generation
- **Export Capabilities**: PDF, DOCX, and clipboard export functionality
- **Dashboard**: Visit history and management interface
- **Database Integration**: Complete MongoDB persistence replacing sessionStorage

### 🔄 Modules Status
- **Capture Module**: ✅ Database-backed version implemented
- **Review Module**: ✅ Database-backed version implemented  
- **Note Module**: ✅ Database-backed version implemented
- **Authentication**: ✅ Complete with user management
- **Dashboard**: ✅ Visit history and management

### 📊 API Routes
- `POST /api/auth/[...nextauth]` - NextAuth authentication
- `POST /api/users` - User registration
- `GET /api/visits` - List user visits
- `POST /api/visits` - Create new visit
- `GET /api/visits/[visitId]` - Get specific visit
- `PUT /api/visits/[visitId]` - Update visit
- `GET /api/visits/statistics` - User statistics
- `POST /api/ocr` - OCR processing for images
- `POST /api/extract-facts` - AI medical extraction
- `POST /api/generate-note` - Medical note generation
- `POST /api/upload` - File upload processing

## 🛠️ Technical Implementation

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Hono framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with JWT
- **AI/ML**: OpenAI GPT-4 for extraction
- **File Processing**: pdf-parse, mammoth, jimp for document/image processing
- **Export**: jsPDF, docx for PDF/DOCX generation

### Environment Variables
```bash
# Authentication
NEXTAUTH_SECRET=your-secure-random-string
NEXTAUTH_URL=http://localhost:3002

# AI Services
OPENAI_API_KEY=sk-your-openai-key

# Database
MONGODB_URI=mongodb://localhost:27017/allergy-scribe

# Application Settings
DEFAULT_USERNAME=allergist
DEFAULT_PASSWORD=allergy123
OCR_PROVIDER=mock
DEMO_MODE=true
```

### Key Dependencies
- `next`: 14.2.0
- `react`: 18
- `mongoose`: 8.0.0
- `next-auth`: 4.24.0
- `openai`: 4.20.0
- `bcryptjs`: 2.4.3
- `jspdf`: 2.5.1
- `docx`: 8.5.0

## 📋 User Guide

### Getting Started
1. **Sign Up**: Create a new account with username, email, and password
2. **Sign In**: Use your credentials to access the application
3. **Create Visit**: Click "Start New Visit" to begin a medical documentation session
4. **Capture Information**: Use audio recording, image capture, file upload, or text input
5. **Review Extraction**: Review and edit the AI-extracted medical information
6. **Generate Note**: Create a comprehensive medical note from the extracted data
7. **Export**: Download the note as PDF/DOCX or copy to clipboard

### Workflow Steps
1. **Step 1: Capture** - Record audio, take photos, upload documents, or enter text
2. **Step 2: Review** - AI extracts medical information for your review and editing
3. **Step 3: Generate Note** - Create a comprehensive medical note with export options

### Features
- **Multi-user Support**: Each user has their own account and visit history
- **Visit Management**: Create, view, and manage multiple visits
- **Data Persistence**: All data is stored in MongoDB, not sessionStorage
- **Export Options**: Generate professional PDF or DOCX documents
- **AI-Powered Extraction**: Intelligent extraction of medical information from various sources

## 🚀 Deployment

### Vercel (Recommended)
This project is optimized for deployment on Vercel.

1. **Connect GitHub Repository**: Link your GitHub repository to Vercel.
2. **Environment Variables**: Configure the following environment variables in Vercel:
   ```bash
   MONGODB_URI=your_mongodb_atlas_uri
   NEXTAUTH_SECRET=your_secret
   NEXTAUTH_URL=https://your-project.vercel.app
   OPENAI_API_KEY=your_openai_key
   ```
3. **Deploy**: Vercel will automatically detect Next.js and build the project.

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
1. Configure MongoDB connection
2. Set up NextAuth secret
3. Configure OpenAI API key
4. Set production environment variables

## 🔧 Development Status

### ✅ Completed
- Core application architecture
- Database integration with MongoDB
- Authentication system with NextAuth
- All modules updated to use database persistence
- User management and visit history
- Export functionality (PDF/DOCX/Clipboard)

### 🚧 In Progress
- Comprehensive testing suite
- Production deployment configuration
- Performance optimization
- Security hardening

### 📋 Pending
- CI/CD pipeline setup (Vercel)
- Advanced error handling and monitoring
- User feedback and analytics

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Sessions**: Secure session management with NextAuth
- **Input Validation**: Comprehensive validation on all user inputs
- **Data Sanitization**: AI extraction includes safety measures to prevent hallucination
- **Environment Variables**: Sensitive configuration stored securely

## 🎯 Next Steps

1. **Testing**: Implement comprehensive test suite for all components and API routes
2. **Deployment**: Set up production deployment with proper environment configuration
3. **Monitoring**: Add error tracking and performance monitoring
4. **Enhancement**: Add advanced features based on user feedback

## 📞 Support

For issues or questions, please check the application documentation or contact the development team.

---

**Last Updated**: January 29, 2026
**Version**: 1.0.0
**Status**: Development Complete, Ready for Testing and Deployment