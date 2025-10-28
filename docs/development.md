# Development Setup

Guide for setting up a local development environment for contributing to Secret Santa.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Building](#building)
- [Docker Development](#docker-development)

---

## Prerequisites

### Required Software

- **Node.js**: 18.x or later (20.x recommended)
- **npm**: 8.x or later
- **Git**: Latest version
- **Docker**: Optional, for testing containerized builds
- **Code Editor**: VS Code recommended

### Recommended VS Code Extensions

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Jest Runner
- Docker (if using Docker)

---

## Initial Setup

### 1. Fork and Clone Repository

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR-USERNAME/secret-santa.git
cd secret-santa

# Add upstream remote
git remote add upstream https://github.com/JR33D/secret-santa.git
```

### 2. Install Dependencies

```bash
# Clean install (recommended)
npm ci

# Or regular install for development
npm install
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` with your local configuration:

```env
# Authentication
NEXTAUTH_SECRET=your-development-secret-here
NEXTAUTH_URL=http://localhost:3000

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Optional: Email testing (use Mailpit or similar)
SMTP_SERVER=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=dev@localhost

# Domain for links
DOMAIN=http://localhost:3000
```

### 4. Initialize Database

```bash
# Database is created automatically on first run
npm run dev

# Database will be created at: ./data/secret-santa.db
```

### 5. Start Development Server

```bash
npm run dev
```

Application will be available at http://localhost:3000

---

## Development Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feat/your-feature-name

# Create bugfix branch
git checkout -b fix/bug-description

# Keep main up to date
git checkout main
git pull upstream main
```

### Making Changes

1. **Make your changes**
2. **Test locally**
3. **Commit with conventional commits**
4. **Push to your fork**
5. **Open Pull Request**

### Conventional Commits

Use semantic commit messages:

```bash
# Features
git commit -m "feat(wishlist): add image preview support"

# Bug fixes
git commit -m "fix(auth): resolve session timeout issue"

# Documentation
git commit -m "docs: update installation guide"

# Breaking changes
git commit -m "feat(api)!: change authentication flow

BREAKING CHANGE: API now requires Bearer token"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `build`: Build system
- `ci`: CI/CD changes
- `chore`: Maintenance

### Code Style

The project uses Prettier and ESLint:

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix
```

**Pre-commit checklist:**
- [ ] Code formatted with Prettier
- [ ] No ESLint errors
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] New features have tests

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- PoolsTab.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="creates pool"
```

### Writing Tests

Test files should be in `__tests__/` directories:

```typescript
// __tests__/components/MyComponent.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(<MyComponent />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Clicked!')).toBeInTheDocument();
    });
  });
});
```

### Test Coverage

Aim for >70% coverage:

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Testing API Routes

```typescript
// __tests__/api/my-route.test.ts
import { GET } from '@/app/api/my-route/route';
import { getDb } from '@/lib/db';

jest.mock('@/lib/db');

describe('GET /api/my-route', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      all: jest.fn(),
      get: jest.fn(),
      run: jest.fn(),
    };
    (getDb as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns data successfully', async () => {
    mockDb.all.mockResolvedValue([{ id: 1, name: 'Test' }]);

    const response = await GET();
    const json = await response.json();

    expect(json).toEqual([{ id: 1, name: 'Test' }]);
  });
});
```

---

## Code Quality

### Type Checking

```bash
# Check types
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

### Linting

ESLint configuration is in `.eslintrc.json`:

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Code Formatting

Prettier configuration is in `.prettierrc`:

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

---

## Building

### Development Build

```bash
npm run dev
```

### Production Build

```bash
# Build the application
npm run build

# Test production build locally
npm start
```

### Build Output

Next.js standalone output:
- `.next/standalone` - Production server
- `.next/static` - Static assets
- `public` - Public files

### Clean Build

```bash
# Remove build artifacts
npm run clean

# Rebuild
npm run build
```

---

## Docker Development

### Development with Docker Compose

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up

# With build
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

**Features:**
- Hot reload with volume mounting
- Runs `npm run dev` inside container
- Persists database between restarts

### Testing Docker Build

```bash
# Build production image locally
docker build -t secret-santa:dev .

# Run production image
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e NEXTAUTH_SECRET=test \
  -e ADMIN_PASSWORD=admin \
  secret-santa:dev

# Test the build
curl http://localhost:3000/api/health
```

### Multi-Architecture Testing

```bash
# Setup buildx
docker buildx create --name mybuilder --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t secret-santa:multi \
  .
```

---

## Database Development

### Accessing Database

```bash
# Using sqlite3 CLI
sqlite3 data/secret-santa.db

# In Docker container
docker-compose exec secret-santa sqlite3 /app/data/secret-santa.db
```

### Common SQL Commands

```sql
-- View tables
.tables

-- Describe table
.schema people

-- Query data
SELECT * FROM people;

-- Export data
.dump > backup.sql

-- Import data
.read backup.sql
```

### Database Migrations

When changing schema:

1. Update schema in `src/lib/db.ts`
2. Add migration logic if needed
3. Test with fresh database
4. Document changes in PR

### Reset Database

```bash
# Delete database
rm data/secret-santa.db

# Restart application (creates new DB)
npm run dev
```

---

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Browser DevTools

- **F12** - Open DevTools
- **Network tab** - Monitor API calls
- **Application tab** - View cookies/storage
- **Console** - View errors and logs

### Server-Side Debugging

```typescript
// Add console.log for debugging
console.log('Debug info:', data);

// Use debugger statement
debugger;

// Check environment
console.log('Environment:', process.env.NODE_ENV);
```

### Client-Side Debugging

```typescript
// React DevTools
console.log('Component props:', props);

// Check state
console.log('Current state:', state);
```

---

## Email Testing

### Using Mailpit (Recommended)

```bash
# Run Mailpit with Docker
docker run -d \
  -p 1025:1025 \
  -p 8025:8025 \
  axllent/mailpit

# Configure .env
SMTP_SERVER=localhost
SMTP_PORT=1025
FROM_EMAIL=dev@localhost
```

Access Mailpit UI at http://localhost:8025

### Using Gmail

Create app password:
1. Enable 2FA on Gmail
2. Visit https://myaccount.google.com/apppasswords
3. Generate app password
4. Use in `.env`

---

## Project Structure

```
secret-santa/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── (auth)/         # Auth layout group
│   │   ├── (main)/         # Main layout group
│   │   └── api/            # API routes
│   ├── components/         # React components
│   ├── lib/                # Utility functions
│   │   ├── api.ts         # API helpers
│   │   ├── auth.ts        # Auth configuration
│   │   ├── db.ts          # Database setup
│   │   └── email-*.ts     # Email utilities
├── __tests__/              # Test files
│   ├── api/               # API tests
│   ├── components/        # Component tests
│   └── lib/               # Library tests
├── email-templates/        # Email HTML templates
├── public/                # Static files
├── data/                  # SQLite database (local)
├── docs/                  # Documentation
└── Configuration files
```

### Key Files

- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Jest test configuration
- `tailwind.config.mjs` - Tailwind CSS configuration
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Prettier configuration
- `Dockerfile` - Docker build configuration

---

## Common Tasks

### Adding a New Component

```bash
# Create component file
touch src/components/MyComponent.tsx

# Create test file
touch __tests__/components/MyComponent.test.tsx

# Import and use in page
# Edit src/app/(main)/home/page.tsx
```

### Adding an API Route

```bash
# Create route file
mkdir -p src/app/api/my-route
touch src/app/api/my-route/route.ts

# Create test file
touch __tests__/api/my-route.test.ts
```

### Adding a Database Table

```typescript
// Edit src/lib/db.ts
await db.exec(`
  CREATE TABLE IF NOT EXISTS my_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
```

### Adding an Email Template

```bash
# Create template
touch email-templates/my-template.html

# Update email-templates.ts
# Add template logic
```

---

## Performance Optimization

### Profiling

```bash
# Build with profiling
ANALYZE=true npm run build

# View bundle analysis
open .next/analyze/client.html
```

### Optimization Tips

1. **Lazy load components:**
```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>
});
```

2. **Optimize images:**
```typescript
import Image from 'next/image';

<Image src="/logo.png" alt="Logo" width={200} height={100} />
```

3. **Memoize expensive operations:**
```typescript
const expensiveValue = useMemo(() => computeExpensive(data), [data]);
```

---

## Contributing Guidelines

### Before Submitting PR

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Conventional commit messages used
- [ ] No console.log statements
- [ ] TypeScript types are correct
- [ ] No ESLint warnings

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] New tests added
- [ ] Manually tested

## Screenshots (if applicable)
Add screenshots here
```

---

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Jest Docs](https://jestjs.io/docs/getting-started)

### Tools
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [SQLite Docs](https://www.sqlite.org/docs.html)

### Community
- [GitHub Issues](https://github.com/JR33D/secret-santa/issues)
- [Contributing Guide](CONTRIBUTING.md)

---

## Getting Help

- Check existing [documentation](../README.md)
- Search [issues](https://github.com/JR33D/secret-santa/issues)
- Review [contributing guide](CONTRIBUTING.md)