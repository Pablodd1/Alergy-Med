# Allergy Scribe (Personal)

A comprehensive, single-user medical documentation tool designed specifically for allergists to create detailed clinical notes through multiple input methods including voice dictation, OCR, and document processing.

## 🎯 Purpose

Allergy Scribe helps allergists efficiently create comprehensive medical notes by:
- **Capturing** information through voice dictation, camera OCR, document uploads, and text input
- **Extracting** structured medical data using AI-powered analysis
- **Reviewing** and editing extracted information before finalization
- **Generating** complete 15-section allergy consultation notes

## 🏗️ Architecture

### Frontend
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for responsive UI
- **Mobile-first design** optimized for tablet and smartphone use

### Backend & APIs
- **Next.js API Routes** for server-side functionality
- **OpenAI Integration** for transcription and structured extraction
- **OCR Support** via Azure Form Recognizer or Google Document AI
- **Authentication** with NextAuth.js and bcrypt

### Data Storage
- **Session Storage** for temporary data during visit processing
- **MongoDB Atlas** (optional) for persistent storage
- **File Storage** via Vercel Blob or S3-compatible services

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key
- (Optional) Azure Form Recognizer or Google Document AI credentials

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd allergy-scribe
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env.local` file:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Authentication (change these for production!)
DEFAULT_USERNAME=allergist
DEFAULT_PASSWORD=allergy123

# Optional - OCR Provider (choose one)
OCR_PROVIDER=mock  # Options: mock, azure, google

# If using Azure Form Recognizer
AZURE_FORM_RECOGNIZER_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_FORM_RECOGNIZER_KEY=your_azure_key

# If using Google Document AI
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_LOCATION=us
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=your_processor_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Optional - MongoDB Atlas
MONGODB_URI=mongodb+srv://your-connection-string

# Optional - File Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

4. **Run development server**
```bash
npm run dev
```

5. **Access the application**
Open [http://localhost:3000](http://localhost:3000) and sign in with your configured credentials.

## 📋 Features

### Module 1: Capture
- **🎤 Voice Dictation**: Browser-based audio recording with OpenAI Whisper transcription
- **📷 Camera OCR**: Mobile-optimized photo capture with text extraction
- **📄 Document Upload**: PDF, DOCX, image processing with OCR
- **⌨️ Text Input**: Direct typing or pasting of clinical information

### Module 2: Extract + Review
- **🧠 AI-Powered Extraction**: Structured medical data extraction using OpenAI GPT-4
- **📊 Strict JSON Schema**: Validated extraction with Zod schemas
- **✏️ Editable Interface**: Chip-based editing for allergy lists and medical data
- **⚠️ Confidence Flagging**: Automatic identification of uncertain or missing information

### Module 3: Generate Note
- **📝 15-Section Notes**: Complete allergy consultation documentation
- **📋 Structured Allergy List**: Organized allergen database with reactions and certainty
- **🔍 Needs Confirmation**: Automatic flagging of incomplete or uncertain data
- **📤 Export Options**: PDF, DOCX, and clipboard export functionality

### Authentication & Security
- **🔐 Single-User Mode**: Designed for individual allergist use
- **🛡️ Visit Isolation**: Strict separation between patient visits
- **🔑 NextAuth Integration**: Secure credential-based authentication

## 🎯 Demo Mode

For testing without database writes:

1. Set `DEMO_MODE=true` in your `.env.local`
2. All data will be stored in session storage only
3. No persistent database operations
4. Perfect for demonstrations and initial testing

## 🔧 Configuration

### OCR Providers
Choose your OCR provider by setting `OCR_PROVIDER`:

- **`mock`**: Simulated OCR for testing (default)
- **`azure`**: Azure Form Recognizer (recommended for production)
- **`google`**: Google Document AI Enterprise

### Authentication
Change default credentials in environment variables:
```bash
DEFAULT_USERNAME=your_username
DEFAULT_PASSWORD=your_secure_password
```

## 📖 Usage Guide

### Step 1: Capture Information
1. **Record Audio**: Click "Record Audio" and dictate patient information
2. **Take Photos**: Use camera to capture documents or handwritten notes
3. **Upload Files**: Drag and drop PDFs, images, or documents
4. **Type Text**: Enter additional information manually

### Step 2: Review Extracted Data
1. **Review**: Check AI-extracted medical information
2. **Edit**: Click edit icons to modify any field
3. **Confirm**: Ensure all allergy history is accurate
4. **Flag**: Note any items needing confirmation

### Step 3: Generate Final Note
1. **Review**: Check the comprehensive 15-section note
2. **Export**: Download as PDF/DOCX or copy to clipboard
3. **Confirm**: Review "Needs Confirmation" section
4. **Complete**: Use note in your EMR system

## 🏥 Clinical Workflow Integration

### EMR Integration
- Copy generated notes directly to your EMR system
- Export in structured format for import
- Maintain consistent documentation standards

### Quality Assurance
- Always review "Needs Confirmation" section
- Verify structured allergy list accuracy
- Check confidence flags for source quality
- Never rely solely on AI-generated content

## 🔒 Privacy & Security

### Data Protection
- **No Patient Identifiers**: System removes names, DOB, SSN
- **Visit Isolation**: Each visit is completely separate
- **Session Storage**: Temporary data storage (configurable)
- **Encryption**: All data transmission encrypted

### Compliance
- **HIPAA Considerations**: Designed for clinical use
- **Audit Trail**: Track all document generation
- **Access Control**: Single-user authentication
- **Data Retention**: Configurable retention policies

## 🐛 Troubleshooting

### Common Issues

**OCR Not Working**
- Check OCR provider configuration
- Verify API credentials
- Try different file formats

**Audio Recording Issues**
- Check browser microphone permissions
- Ensure HTTPS connection for production
- Verify audio file format compatibility

**Authentication Failures**
- Check NextAuth configuration
- Verify environment variables
- Check session timeout settings

### Debug Mode
Enable debug logging:
```bash
DEBUG=allergy-scribe:* npm run dev
```

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Configure environment variables
4. Deploy automatically

### Self-Hosted
```bash
npm run build
npm start
```

### Environment Variables for Production
```bash
# Required
OPENAI_API_KEY=your_production_key
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://your-domain.com

# Security (change defaults!)
DEFAULT_USERNAME=secure_username
DEFAULT_PASSWORD=secure_password

# Optional but recommended
MONGODB_URI=your_production_mongodb
BLOB_READ_WRITE_TOKEN=your_production_blob_token
```

## 📚 API Documentation

### Endpoints

**POST /api/transcribe**
- Audio file transcription
- Returns: `{ text: string, segments: Array<{start, end, text}> }`

**POST /api/ocr**
- Image text extraction
- Returns: `{ text: string, confidence: number, layout?: LayoutBlock[] }`

**POST /api/upload**
- Document processing (PDF, DOCX, images)
- Returns: `{ text: string, confidence: number, filename: string }`

**POST /api/extract-facts**
- Medical information extraction
- Returns: `ExtractionData` (structured medical data)

**POST /api/generate-note**
- Final note generation
- Returns: `{ note: string }`

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Medical Disclaimer

This tool is designed to assist healthcare professionals and should not be used as a substitute for clinical judgment. Always review and verify all generated content before use in patient care.

**Important**: 
- This tool does not provide medical advice
- Generated content requires clinical review
- Maintain HIPAA compliance in your usage
- Follow your institution's policies for AI-assisted documentation

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review GitHub issues
3. Create a new issue with detailed information

---

**Built with ❤️ for allergists and their patients**