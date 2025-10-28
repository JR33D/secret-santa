# Secret Santa App

[![Release](https://img.shields.io/github/v/release/JR33D/secret-santa?include_prereleases&sort=semver)](https://github.com/JR33D/secret-santa/releases)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/JR33D/secret-santa/pkgs/container/secret-santa)
[![License](https://img.shields.io/github/license/JR33D/secret-santa)](LICENSE)
[![CI](https://github.com/JR33D/secret-santa/workflows/PR%20Tests/badge.svg)](https://github.com/JR33D/secret-santa/actions)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

<img src="public/images/logo_transparent.png" alt="Secret Santa" width="28" style="vertical-align: middle; margin-right: 8px;" /> Organize your family's Secret Santa gift exchange with ease!

Secret Santa is a self-hosted web application that helps manage gift exchanges with features like wishlist management, assignment generation with constraints, email notifications, and assignment history tracking.

---

## 📦 Quick Start

### Using Docker (Recommended)

```bash
docker run -d \
  -p 3000:3000 \
  -v secret-santa-data:/app/data \
  -e NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  -e ADMIN_PASSWORD=changeme123 \
  ghcr.io/JR33D/secret-santa:latest
```

Visit http://localhost:3000 and login with:

- Username: `admin`
- Password: `changeme123` (change immediately!)

[See full installation guide →](docs/installation.md)

---

## ✨ Features

- 🎁 **Wishlist Management** - Create and manage gift wishlists
- 👥 **Pool Organization** - Separate groups (family, friends, coworkers)
- 🎲 **Smart Assignment** - Automated matching with constraint support
- 🚫 **Restrictions** - Prevent couples/siblings from drawing each other
- 📧 **Email Notifications** - Automated assignment notifications
- 📊 **History Tracking** - Visual history of past assignments
- 🔐 **User Management** - Secure authentication with role-based access
- 🐳 **Easy Deployment** - Docker support with multi-architecture builds

---

## 📖 Documentation

### Getting Started

- [Installation Guide](docs/installation.md) - Setup instructions
- [User Guide](docs/user-guide.md) - How to use the application
- [Docker Deployment](docs/docker.md) - Production deployment
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions

### For Contributors

- [Contributing Guide](docs/CONTRIBUTING.md) - How to contribute
- [Development Setup](docs/development.md) - Local development environment
- [Release Process](docs/RELEASE_PROCESS.md) - How releases work
- [API Documentation](docs/api.md) - API reference

### Project Information

- [Code of Conduct](docs/CODE_OF_CONDUCT.md) - Community standards
- [Security Policy](docs/SECURITY.md) - Security and vulnerability reporting
- [Changelog](CHANGELOG.md) - Version history

---

## 🚀 Installation

### Prerequisites

- Docker and Docker Compose (recommended)
- OR Node.js 18+ and npm

### Option 1: Docker Compose (Production)

1. **Download configuration files**

   ```bash
   curl -O https://raw.githubusercontent.com/JR33D/secret-santa/main/docker-compose.prod.yml
   mv docker-compose.prod.yml docker-compose.yml
   curl -O https://raw.githubusercontent.com/JR33D/secret-santa/main/.env.example
   mv .env.example .env
   ```

2. **Configure environment**

   ```bash
   # Generate secure secret
   echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
   echo "ADMIN_PASSWORD=your_secure_password" >> .env
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

### Option 2: Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/JR33D/secret-santa.git
   cd secret-santa
   ```

2. **Install dependencies**

   ```bash
   npm ci
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

---

## 🤝 Contributing

We love contributions! Whether it's bug fixes, new features, or documentation improvements, all contributions are welcome.

### Quick Start for Contributors

1. **Fork** the repository
2. **Clone** your fork
3. **Create** a feature branch: `git checkout -b feat/amazing-feature`
4. **Commit** using [conventional commits](https://conventionalcommits.org): `git commit -m 'feat: add amazing feature'`
5. **Push** to your branch: `git push origin feat/amazing-feature`
6. **Open** a Pull Request

See our [Contributing Guide](docs/CONTRIBUTING.md) for detailed instructions.

**Good First Issues**: Check out [issues tagged with "good first issue"](https://github.com/JR33D/secret-santa/labels/good%20first%20issue) to get started!

---

## 🐛 Bug Reports & Feature Requests

- 🐛 [Report a bug](https://github.com/JR33D/secret-santa/issues/new?template=bug_report.yml)
- ✨ [Request a feature](https://github.com/JR33D/secret-santa/issues/new?template=feature_request.yml)

---

## 🔒 Security

Found a security vulnerability? Please review our [Security Policy](docs/SECURITY.md) and report it responsibly. We take security seriously and will respond promptly.

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/JR33D/secret-santa?style=social)
![GitHub forks](https://img.shields.io/github/forks/JR33D/secret-santa?style=social)
![GitHub issues](https://img.shields.io/github/issues/JR33D/secret-santa)
![GitHub pull requests](https://img.shields.io/github/issues-pr/JR33D/secret-santa)
![GitHub last commit](https://img.shields.io/github/last-commit/JR33D/secret-santa)

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: SQLite
- **Authentication**: NextAuth.js
- **Email**: Nodemailer
- **Testing**: Jest, React Testing Library
- **Deployment**: Docker, Docker Compose

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) - The React Framework
- UI styled with [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- Authentication via [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- Automated releases with [Release Please](https://github.com/googleapis/release-please) - Automated releases

---

## 💖 Support the Project

If you find this project helpful, please consider:

- ⭐ **Starring** the repository
- 🐛 **Reporting** bugs and issues
- 💡 **Suggesting** new features
- 📖 **Improving** documentation
- 🤝 **Contributing** code
- 📢 **Sharing** with others who might find it useful

---

<div align="center">

**Made with ❤️ for easier gift exchanges**

[Documentation](docs/) · [Report Bug](https://github.com/JR33D/secret-santa/issues) · [Request Feature](https://github.com/JR33D/secret-santa/issues)

</div>
