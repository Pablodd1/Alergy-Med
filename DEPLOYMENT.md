# Allergy Scribe - Deployment Guide

## Quick Start (Local Development)

1. **Clone and Setup**
```bash
git clone <your-repo>
cd allergy-scribe
npm install
```

2. **Environment Setup**
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

3. **Start MongoDB**
```bash
mongod --dbpath /path/to/data
```

4. **Run Development Server**
```bash
npm run dev
```

5. **Access Application**
Open http://localhost:3000 in your browser

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. **Deploy to Vercel**
- Go to https://vercel.com
- Click "New Project"
- Import your GitHub repository
- Configure environment variables
- Deploy

3. **Environment Variables for Vercel**
```
OPENAI_API_KEY=your-openai-api-key
MONGODB_URI=your-mongodb-connection-string
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app.vercel.app
DEFAULT_USERNAME=your-username
DEFAULT_PASSWORD=your-password
OCR_PROVIDER=mock
DEMO_MODE=false
```

### Option 2: Docker Deployment

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

2. **Create docker-compose.yml**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MONGODB_URI=${MONGODB_URI}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - DEFAULT_USERNAME=${DEFAULT_USERNAME}
      - DEFAULT_PASSWORD=${DEFAULT_PASSWORD}
    depends_on:
      - mongodb

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password

volumes:
  mongodb_data:
```

3. **Deploy with Docker Compose**
```bash
docker-compose up -d
```

### Option 3: AWS Deployment

1. **MongoDB Atlas Setup**
- Create cluster at https://cloud.mongodb.com
- Whitelist your IP addresses
- Get connection string

2. **Environment Variables**
```
OPENAI_API_KEY=your-openai-api-key
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/allergy-scribe
NEXTAUTH_SECRET=generate-random-secret
NEXTAUTH_URL=https://your-domain.com
DEFAULT_USERNAME=your-username
DEFAULT_PASSWORD=your-password
```

3. **Deploy to AWS EC2**
```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js and MongoDB
sudo apt update
sudo apt install nodejs npm mongodb

# Clone and setup application
git clone <your-repo>
cd allergy-scribe
npm install
npm run build

# Setup PM2 for process management
npm install -g pm2
pm2 start npm --name "allergy-scribe" -- start
pm2 save
pm2 startup
```

## Environment Configuration

### Required Environment Variables
```bash
# Core Application
OPENAI_API_KEY=sk-prod-your-openai-key
MONGODB_URI=mongodb://username:password@host:port/database
NEXTAUTH_SECRET=your-secure-random-secret
NEXTAUTH_URL=https://your-domain.com

# Authentication
DEFAULT_USERNAME=your-secure-username
DEFAULT_PASSWORD=your-secure-password

# Features
OCR_PROVIDER=mock
DEMO_MODE=false
```

### Optional Environment Variables
```bash
# Advanced Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1

# MongoDB Options
MONGODB_POOL_SIZE=10
MONGODB_RETRY_WRITES=true

# Security
SESSION_TIMEOUT=86400000
CORS_ORIGIN=https://your-domain.com
```

## Database Setup

### MongoDB Atlas (Recommended)
1. Create account at https://cloud.mongodb.com
2. Create new cluster
3. Configure network access (whitelist IPs)
4. Create database user
5. Get connection string

### Local MongoDB
```bash
# Install MongoDB
sudo apt install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database
mongo
> use allergy-scribe
> exit
```

### Docker MongoDB
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v mongodb_data:/data/db \
  mongo:6
```

## Security Checklist

### Authentication Security
- [ ] Change default username/password
- [ ] Use strong NEXTAUTH_SECRET
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS settings
- [ ] Set session timeout limits

### Database Security
- [ ] Use MongoDB connection with authentication
- [ ] Whitelist specific IP addresses
- [ ] Enable MongoDB audit logging
- [ ] Use database user with limited permissions
- [ ] Regular security updates

### Application Security
- [ ] Disable DEMO_MODE in production
- [ ] Validate all user inputs
- [ ] Sanitize file uploads
- [ ] Rate limiting for API endpoints
- [ ] Regular dependency updates

### Data Protection
- [ ] No PHI (Protected Health Information) storage
- [ ] Use patient aliases instead of real names
- [ ] Implement data retention policies
- [ ] Secure backup procedures
- [ ] Audit logging for access

## Monitoring & Maintenance

### Health Checks
```bash
# Application health
curl https://your-domain.com/api/health

# Database connectivity
npm run db:health

# System resources
npm run system:status
```

### Logging
```bash
# Application logs
pm2 logs allergy-scribe

# Database logs
tail -f /var/log/mongodb/mongod.log

# System logs
tail -f /var/log/syslog
```

### Performance Monitoring
- CPU and memory usage
- Database query performance
- API response times
- Error rates and patterns

## Backup & Recovery

### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb://username:password@host:port/database" --out=/backup/path

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/mongodb_$DATE"
```

### Application Backup
```bash
# Backup application code
tar -czf allergy-scribe-backup.tar.gz /path/to/app

# Backup uploaded files
tar -czf uploads-backup.tar.gz /path/to/uploads
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check connection string format
   - Verify network connectivity
   - Check authentication credentials

2. **OpenAI API Errors**
   - Verify API key is valid
   - Check API usage limits
   - Review API error logs

3. **Authentication Issues**
   - Check NEXTAUTH_SECRET
   - Verify NEXTAUTH_URL
   - Clear browser cookies

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for errors

### Debug Mode
```bash
# Enable debug logging
DEBUG=allergy-scribe:* npm run dev

# MongoDB debug
DEBUG=mongodb:* npm run dev
```

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Review security settings
5. Contact support team

## Updates

Regular updates include:
- Security patches
- Dependency updates
- Feature enhancements
- Performance improvements

Always backup before updating and test in staging environment first.