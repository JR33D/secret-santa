# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Secret Santa App
- User authentication with NextAuth
- Pool management for organizing different groups
- People management with email integration
- Wishlist creation and management
- Gift-giving restrictions between participants
- Automated assignment generation with constraint solving
- Assignment history tracking and visualization
- Email notification system with customizable templates
- Admin dashboard for full application control
- User dashboard for personal wishlist and assignment viewing
- Docker containerization for easy deployment
- Comprehensive test coverage with Jest
- CI/CD pipeline with GitHub Actions

### Features

#### Authentication & User Management
- Secure authentication system with role-based access control
- Admin and user roles with different permissions
- Password change functionality with temporary password support
- Automatic user account creation linked to people

#### Pool & People Management
- Create and manage multiple gift exchange pools
- Add people with names and email addresses to pools
- Filter and organize people by pool membership
- Email validation for all participants

#### Wishlist System
- Create personal wishlists with items, links, and images
- View assigned recipient's wishlist after assignment
- Image preview support for wishlist items
- Easy-to-use interface for adding and removing items

#### Assignment Generation
- Smart algorithm respects all defined restrictions
- Prevents same-person assignments
- Supports complex restriction scenarios
- Generates valid assignments or provides helpful error messages
- Year-based assignment tracking

#### Restrictions
- Define who cannot give gifts to whom
- Spouse/sibling restrictions
- Pool-specific restriction management
- Clear visualization of active restrictions

#### Email Notifications
- Customizable SMTP configuration
- Automated notification emails with assignment details
- Wishlist integration in notification emails
- Beautiful HTML email templates
- User account creation emails with credentials

#### History & Analytics
- Visual assignment history graph
- Year-over-year tracking
- Chain detection and loop identification
- Pool-filtered history views

#### Deployment & Operations
- Docker and docker-compose support
- Multi-architecture support (amd64, arm64)
- Health check endpoint
- Persistent data storage with SQLite
- Environment variable configuration
- Production-ready build with Next.js standalone output

### Technical Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: SQLite with better-sqlite3
- **Authentication**: NextAuth.js
- **Email**: Nodemailer
- **Testing**: Jest, React Testing Library
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

### Documentation
- Comprehensive README with setup instructions
- Docker deployment guide
- API route documentation
- Contributing guidelines
- Issue and PR templates
- Code of conduct

---

## Release Notes

This is the initial public release of the Secret Santa App. The application is production-ready and includes all core features for managing family gift exchanges.

### Getting Started

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or using Docker directly
docker run -d \
  -p 3000:3000 \
  -v secret-santa-data:/app/data \
  -e NEXTAUTH_SECRET=your-secret \
  -e ADMIN_PASSWORD=your-password \
  ghcr.io/JR33D/secret-santa:latest
```

### Environment Variables

Required:
- `NEXTAUTH_SECRET` - Secret for NextAuth session encryption
- `ADMIN_PASSWORD` - Initial admin password

Optional:
- `ADMIN_USERNAME` - Admin username (default: admin)
- `NEXTAUTH_URL` - Base URL (default: http://localhost:3000)
- SMTP configuration for email notifications

### Known Limitations

- Email templates are currently static (customization planned for future release)
- No user profile pictures (planned enhancement)
- Limited to single admin account (multi-admin support planned)

### Upgrade Notes

This is the initial release. Future upgrade notes will be provided here.

[unreleased]: https://github.com/JR33D/secret-santa/compare/v1.0.0...HEAD