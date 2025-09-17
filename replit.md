# Law Students Intellectual Forum (LSIF)

## Overview

The Law Students Intellectual Forum (LSIF) is a comprehensive web platform designed to serve Zimbabwe's legal education community. It functions as an academic hub where law students from universities like UZ, MSU, GZU, and ZEGU can publish articles, rate lecturers, access resources, participate in student societies, and engage with interactive content. The platform combines academic discourse with practical tools for legal education, creating a centralized space for intellectual exchange and professional development.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Static Site Structure**: Built as a multi-page web application using vanilla HTML, CSS, and JavaScript
- **Modular Design**: Pages are organized into logical sections (student articles, academic resources, career center, tutorials, etc.)
- **Component System**: Shared components like headers and modals are loaded dynamically via JavaScript modules
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox for layout management
- **Progressive Enhancement**: Core functionality works without JavaScript, enhanced features require it

### Backend Architecture
- **Firebase Integration**: Uses Firebase as the primary backend service
- **Serverless Functions**: Cloud Functions handle sensitive operations like ID hashing and data processing
- **Real-time Features**: Firestore provides real-time updates for comments, ratings, and user interactions
- **Express Server**: Simple Node.js server for static file serving with compression and caching

### Data Storage Solutions
- **Firestore Database**: Primary NoSQL database for user profiles, comments, ratings, and submissions
- **Firebase Storage**: Handles file uploads including images, audio files, and documents
- **Static JSON Files**: Article metadata and configuration stored as static files
- **Structured Collections**: Organized around users, lecturers, articles, comments, and society data

### Authentication and Authorization
- **Firebase Auth**: Email/password authentication with role-based access control
- **User Profiles**: Comprehensive profiles including university affiliation, year of study, and role verification
- **Sensitive Data Handling**: Uses Cloud Functions with bcrypt for secure ID hashing
- **Admin System**: Role-based permissions for content moderation and platform management
- **Session Management**: Persistent login state with automatic token refresh

### Content Management
- **Static Article System**: Articles stored as JSON files with metadata for easy management
- **Dynamic Comments**: Real-time commenting system with emoji reactions and moderation
- **Rating System**: Aggregated lecturer ratings with spam prevention and validation
- **Media Handling**: Image optimization and storage through Firebase Storage
- **Content Moderation**: Admin tools for reviewing submissions and managing user-generated content

### Interactive Features
- **Gaming System**: Legal-themed games including hangman, sudoku, and quiz systems
- **Audio Content**: Podcast-style legal case discussions ("Locus Classicus")
- **Visual Submissions**: Art and poetry submission systems for creative expression
- **Career Guidance**: Structured pathways for different legal career options
- **Academic Tools**: Tutorial systems and resource libraries

## External Dependencies

### Firebase Services
- **Firebase Auth**: User authentication and session management
- **Firestore**: Real-time NoSQL database for dynamic content
- **Firebase Storage**: File storage and CDN for media assets
- **Cloud Functions**: Serverless backend processing with bcrypt for security
- **Firebase Hosting**: Static site hosting with global CDN

### Third-Party Libraries
- **DOMPurify**: Client-side HTML sanitization for security
- **Express.js**: Web server framework for static file serving
- **Compression**: Gzip compression middleware for performance
- **bcryptjs**: Password hashing and sensitive data encryption

### Development Tools
- **Node.js**: Runtime environment for server and build tools
- **NPM**: Package management and dependency resolution
- **Firebase CLI**: Deployment and configuration management

### Browser APIs
- **Local Storage**: Client-side data persistence
- **Fetch API**: HTTP requests for data loading
- **File API**: File upload handling for submissions
- **Audio API**: Media playback for podcast content

### Content Delivery
- **GitHub Pages**: Potential alternative hosting platform
- **Firebase CDN**: Global content delivery network
- **Static Asset Optimization**: Image compression and caching strategies