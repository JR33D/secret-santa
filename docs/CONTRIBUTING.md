# Contributing to Secret Santa App

First off, thank you for considering contributing to Secret Santa App! It's people like you that make this tool better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, Node version, Docker version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other applications**

### Your First Code Contribution

Unsure where to begin? Look for issues tagged with:

- `good first issue` - Simple issues perfect for newcomers
- `help wanted` - Issues where we'd love community help
- `documentation` - Improvements to docs

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Docker (for testing containerized deployments)
- Git

### Setup Steps

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR-USERNAME/secret-santa.git
   cd secret-santa
   ```

2. **Install Dependencies**

   ```bash
   npm ci
   ```

3. **Set Up Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run Development Server**

   ```bash
   npm run dev
   ```

5. **Run Tests**
   ```bash
   npm test
   npm run test:coverage
   ```

### Project Structure

```
secret-santa/
├── src/
│   ├── app/           # Next.js app router pages and API routes
│   ├── components/    # React components
│   ├── lib/           # Utility functions and helpers
│   └── types/         # TypeScript type definitions
├── __tests__/         # Test files
├── email-templates/   # Email templates
└── public/            # Static assets
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for automatic changelog generation and semantic versioning.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes that don't modify src or test files

### Examples

```bash
# New feature
feat(wishlist): add image preview for wishlist items

# Bug fix
fix(assignments): prevent duplicate assignments in same pool

# Breaking change
feat(auth)!: migrate to NextAuth v5

BREAKING CHANGE: NextAuth configuration has changed
```

### Scopes

Common scopes include:

- `auth` - Authentication related
- `wishlist` - Wishlist features
- `assignments` - Assignment generation
- `email` - Email functionality
- `ui` - User interface
- `api` - API routes
- `db` - Database changes
- `docker` - Docker configuration

## Pull Request Process

1. **Create a Branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, readable code
   - Follow the style guidelines
   - Add tests for new features
   - Update documentation

3. **Test Your Changes**

   ```bash
   npm run lint
   npm run test
   npm run build
   ```

4. **Commit Your Changes**

   ```bash
   git add .
   git commit -m "feat(scope): your descriptive message"
   ```

5. **Push to Your Fork**

   ```bash
   git push origin feat/your-feature-name
   ```

6. **Open a Pull Request**
   - Use a clear title following conventional commits
   - Fill out the PR template completely
   - Link any related issues
   - Request review from maintainers

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated and passing
- [ ] No new warnings or errors
- [ ] Conventional commit format used

## Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for type safety
- Use functional components and hooks
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for complex functions

### React Components

```typescript
// Good
interface Props {
	userName: string;
	onSave: (data: FormData) => void;
}

export default function UserForm({ userName, onSave }: Props) {
	// Component logic
}

// Component should be focused on one responsibility
```

### API Routes

```typescript
// Good - Clear error handling and responses
export async function GET(request: Request) {
	try {
		const data = await fetchData();
		return Response.json(data, { status: 200 });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
```

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and colors
- Use the existing color palette

## Testing

### Writing Tests

- Write tests for all new features
- Aim for >70% code coverage
- Test edge cases and error scenarios
- Use meaningful test descriptions

```typescript
describe('PoolsTab Component', () => {
  it('renders the component with title', async () => {
    render(<PoolsTab />);
    await waitFor(() => {
      expect(screen.getByText('Manage Pools')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (api.apiPost as jest.Mock).mockRejectedValue(new Error('API Error'));
    // Test error handling
  });
});
```

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
```

## Documentation

- Update README.md if adding new features
- Add JSDoc comments for complex functions
- Update API documentation for new endpoints
- Include examples in documentation

## Questions?

Feel free to:

- Open an issue for discussion
- Join our community discussions
- Reach out to maintainers

Thank you for contributing! 🎅🎁
