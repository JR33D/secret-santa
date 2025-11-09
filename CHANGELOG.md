# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0](https://github.com/JR33D/secret-santa/compare/v1.2.0...v1.3.0) (2025-11-09)


### Features

* **tabs:** add deep linking support ([ddef0c4](https://github.com/JR33D/secret-santa/commit/ddef0c48dd3ebc02fc16c1cc6e9e0d39054e8f02))

## [1.2.0](https://github.com/JR33D/secret-santa/compare/v1.1.1...v1.2.0) (2025-10-28)

### Features

- **branding:** add Secret Santa project logo ([a78cb6e](https://github.com/JR33D/secret-santa/commit/a78cb6e57049b0e5a98e46cfdc8f5ab3ca67c5be))
- **docs:** add comprehensive user and deployment guides ([bd3e6d8](https://github.com/JR33D/secret-santa/commit/bd3e6d86d9af8a1dfe5c91bc340e9cc8d5f7c1d1))

## [1.1.1](https://github.com/JR33D/secret-santa/compare/v1.1.0...v1.1.1) (2025-10-25)

### Bug Fixes

- **docker:** separate development and production configurations into distinct files ([550d61a](https://github.com/JR33D/secret-santa/commit/550d61ade35ee0fb022426966edbe99532903eb2))
- update restrictions route import path ([550d61a](https://github.com/JR33D/secret-santa/commit/550d61ade35ee0fb022426966edbe99532903eb2))

## [1.1.0](https://github.com/JR33D/secret-santa/compare/v1.0.1...v1.1.0) (2025-10-25)

### Features

- add DOMAIN variable to email templates and notifications for dynamic links ([#5](https://github.com/JR33D/secret-santa/issues/5)) ([bc52a34](https://github.com/JR33D/secret-santa/commit/bc52a34c8d40287ce0c577dd8b61c55906003e32))

## [1.0.1](https://github.com/JR33D/secret-santa/compare/v1.0.0...v1.0.1) (2025-10-25)

### Bug Fixes

- update permissions to allow write access for contents in release workflow ([3ccb59d](https://github.com/JR33D/secret-santa/commit/3ccb59db0f38211aee13397228163bc243c6a871))

## 1.0.0 (2025-10-25)

### ⚠ BREAKING CHANGES

- Refactor email configuration to use only environment variables ([#2](https://github.com/JR33D/secret-santa/issues/2))

### Features

- add Code of Conduct and Contributing guidelines ([#1](https://github.com/JR33D/secret-santa/issues/1)) ([fe11592](https://github.com/JR33D/secret-santa/commit/fe11592fc47a0af47c90002d4f41f6442f6d827f))
- add whatwg-fetch polyfill and refactor API responses to use Response.json ([b7f37c4](https://github.com/JR33D/secret-santa/commit/b7f37c400909a223564b26dbc8059a9ca37d064b))
- Refactor email configuration to use only environment variables ([#2](https://github.com/JR33D/secret-santa/issues/2)) ([23bff57](https://github.com/JR33D/secret-santa/commit/23bff577c8ea34bcec17f020ff0d5d5154e80608))

### Bug Fixes

- update docker deployment instructions with correct image paths ([fe11592](https://github.com/JR33D/secret-santa/commit/fe11592fc47a0af47c90002d4f41f6442f6d827f))

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
