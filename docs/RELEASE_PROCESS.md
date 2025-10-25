# Release Process Documentation

This document describes the automated release process for Secret Santa App using Release Please and semantic versioning.

## Overview

Our release process is fully automated using:

- **Release Please**: Automated version bumping and changelog generation
- **Conventional Commits**: Commit message format for automatic versioning
- **Semantic Versioning**: MAJOR.MINOR.PATCH versioning
- **GitHub Actions**: CI/CD pipeline
- **Docker**: Multi-architecture container builds

## Branching Strategy

We use **trunk-based development**:

```
main (production)
  └── Always deployable
  └── Tagged with version numbers
  └── Docker: latest, stable, v1.2.3

develop (optional for pre-releases)
  └── Edge builds
  └── Docker: edge, edge-YYYYMMDD

beta (optional)
  └── Beta builds
  └── Docker: beta, beta-YYYYMMDD
```

## Versioning Strategy

### Semantic Versioning

- **MAJOR** (1.x.x): Breaking changes
- **MINOR** (x.1.x): New features (backwards compatible)
- **PATCH** (x.x.1): Bug fixes (backwards compatible)

### Version Determination

Versions are automatically determined by commit messages:

```bash
# PATCH version bump (1.0.0 -> 1.0.1)
fix: resolve email notification bug
fix(auth): correct password validation

# MINOR version bump (1.0.0 -> 1.1.0)
feat: add wishlist image preview
feat(ui): implement dark mode

# MAJOR version bump (1.0.0 -> 2.0.0)
feat!: migrate to NextAuth v5
feat(api)!: change assignment API response format

BREAKING CHANGE: API responses now use camelCase
```

## Conventional Commits

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Description             | Version Bump | Appears in Changelog      |
| ---------- | ----------------------- | ------------ | ------------------------- |
| `feat`     | New feature             | MINOR        | ✅ Features               |
| `fix`      | Bug fix                 | PATCH        | ✅ Bug Fixes              |
| `perf`     | Performance improvement | PATCH        | ✅ Performance            |
| `docs`     | Documentation only      | -            | ✅ Documentation          |
| `refactor` | Code refactoring        | -            | ✅ Code Refactoring       |
| `test`     | Adding tests            | -            | ✅ Tests                  |
| `build`    | Build system changes    | -            | ✅ Build System           |
| `ci`       | CI/CD changes           | -            | ✅ Continuous Integration |
| `chore`    | Maintenance tasks       | -            | ✅ Miscellaneous          |
| `style`    | Code style changes      | -            | ❌ (hidden)               |

### Scopes

Common scopes (optional but recommended):

- `auth`, `wishlist`, `assignments`, `email`, `ui`, `api`, `db`, `docker`, `docs`

### Examples

```bash
# Simple patch
fix: resolve database connection timeout

# Feature with scope
feat(wishlist): add item sorting options

# Breaking change
feat(api)!: change user authentication flow

BREAKING CHANGE: The login endpoint now requires email instead of username.
Migration guide: Update all login forms to use email field.

# Multiple changes in one commit
feat(ui): redesign dashboard layout

- Add card-based layout for pools
- Improve mobile responsiveness
- Update color scheme

Closes #123
```

## Release Process

### Automatic Releases (Recommended)

1. **Develop Features**

   ```bash
   git checkout -b feat/my-feature
   # Make changes
   git add .
   git commit -m "feat(wishlist): add image preview support"
   git push origin feat/my-feature
   ```

2. **Create Pull Request**
   - Open PR to `main`
   - Fill out PR template
   - Ensure CI passes
   - Get review and approval

3. **Merge PR**
   - Squash and merge (preferred)
   - Use conventional commit format for merge commit
   - Example: `feat(wishlist): add image preview support (#42)`

4. **Release Please Creates Release PR**
   - Automatically created after merge to `main`
   - Updates version in `package.json`
   - Updates `CHANGELOG.md`
   - PR title: `chore: release 1.1.0`

5. **Review and Merge Release PR**
   - Review changelog
   - Merge release PR
   - Release Please automatically:
     - Creates GitHub Release
     - Tags the commit
     - Triggers Docker build

6. **Docker Images Published**
   - Multi-architecture builds (amd64, arm64)
   - Tags created:
     - `latest`
     - `stable`
     - `v1.1.0`
     - `v1.1`
     - `v1`
     - `1.1.0-YYYYMMDD`

### Manual Version Override

To release a specific version:

1. Edit `.release-please-manifest.json`:

   ```json
   {
   	".": "2.0.0"
   }
   ```

2. Commit and push to trigger Release Please

### Pre-releases (Edge/Beta)

For pre-release builds:

```bash
# Automatic from branch
git push origin develop  # Creates edge build

# Manual trigger
gh workflow run edge-release.yml -f prerelease_type=beta
```

Pre-release tags:

- `edge`, `edge-YYYYMMDD`, `edge-{sha}`
- `beta`, `beta-YYYYMMDD`
- `alpha`, `alpha-YYYYMMDD`
- `rc`, `rc-YYYYMMDD`

## Docker Tags Explained

| Tag              | When Updated       | Use Case                |
| ---------------- | ------------------ | ----------------------- |
| `latest`         | Every release      | Development/Testing     |
| `stable`         | Every release      | Production (verified)   |
| `v1.2.3`         | Specific release   | Production (pinned)     |
| `v1.2`           | Minor releases     | Production (auto-patch) |
| `v1`             | Major releases     | Production (auto-minor) |
| `1.2.3-YYYYMMDD` | Release date       | Audit/Rollback          |
| `edge`           | Every develop push | Bleeding edge testing   |
| `beta`           | Beta releases      | Pre-release testing     |

### Recommended for Production

```yaml
# Recommended: Pin to specific version
image: ghcr.io/JR33D/secret-santa:v1.2.3

# Alternative: Auto-update patches
image: ghcr.io/JR33D/secret-santa:v1.2

# Not recommended for production
image: ghcr.io/JR33D/secret-santa:latest
```

## Changelog

The CHANGELOG.md is automatically maintained by Release Please and includes:

- **Features**: New functionality
- **Bug Fixes**: Corrections to issues
- **Performance Improvements**: Speed/efficiency gains
- **Documentation**: Doc updates
- **Code Refactoring**: Internal improvements
- **Tests**: Test additions/updates
- **Build System**: Build tooling changes
- **Continuous Integration**: CI/CD updates
- **Miscellaneous**: Other changes

### Breaking Changes

Breaking changes are prominently displayed at the top of each release section with migration guides.

## Hotfix Process

For critical production issues:

1. **Create Hotfix Branch**

   ```bash
   git checkout -b hotfix/critical-bug main
   ```

2. **Fix and Test**

   ```bash
   git commit -m "fix: resolve critical security issue"
   ```

3. **Create PR to Main**
   - Mark as urgent
   - Ensure thorough testing
   - Expedite review

4. **Merge and Release**
   - Merge creates automatic release PR
   - Merge release PR immediately
   - Verify deployment

## Rollback Procedure

If a release causes issues:

### Option 1: Revert and Re-release

```bash
git revert <commit-hash>
git push origin main
# Release Please creates new patch version
```

### Option 2: Rollback Docker Deployment

```bash
# Identify previous version
docker pull ghcr.io/JR33D/secret-santa:v1.2.2

# Update docker-compose.yml
image: ghcr.io/JR33D/secret-santa:v1.2.2

# Restart
docker-compose up -d
```

## Troubleshooting

### Release PR Not Created

**Cause**: No conventional commits since last release

**Solution**: Ensure commits follow conventional format:

```bash
git log --oneline | head -5
```

### Wrong Version Bumped

**Cause**: Incorrect commit type

**Solution**:

- Use `fix:` for patches
- Use `feat:` for minors
- Use `!` or `BREAKING CHANGE:` for majors

### Release PR Won't Merge

**Cause**: Merge conflicts or failed checks

**Solution**:

```bash
git checkout main
git pull
# Resolve conflicts
git push
```

### Docker Build Failed

**Cause**: Build errors or test failures

**Solution**: Check GitHub Actions logs:

```bash
gh run list --workflow=release-please.yml
gh run view <run-id> --log-failed
```

## First-Time Setup

### 1. Configure Repository Secrets

No secrets required! GitHub token is automatically available.

### 2. Enable GitHub Packages

1. Go to repository Settings → Actions → General
2. Under "Workflow permissions", select "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"

### 3. Update CODEOWNERS

Edit `CODEOWNERS` file:

```bash
* @JR33D
```

### 4. Create Initial Release

```bash
# Ensure package.json has version 1.0.0
npm version 1.0.0 --no-git-tag-version

# Commit
git add package.json
git commit -m "chore: prepare for initial release"
git push origin main

# Release Please will create release PR
# Merge it to create v1.0.0 release
```

### 5. Verify Docker Images

```bash
# Check packages page
https://github.com/JR33D/secret-santa/pkgs/container/secret-santa

# Pull and test
docker pull ghcr.io/JR33D/secret-santa:latest
docker run -p 3000:3000 ghcr.io/JR33D/secret-santa:latest
```

## Monitoring Releases

### GitHub CLI

```bash
# View releases
gh release list

# View latest release
gh release view

# View release notes
gh release view v1.2.3
```

### Docker Images

```bash
# List all tags
gh api repos/JR33D/secret-santa/packages/container/secret-santa/versions | jq '.[].metadata.container.tags'

# Pull specific version
docker pull ghcr.io/JR33D/secret-santa:v1.2.3
```

## Best Practices

### Commit Messages

✅ **Good**

```
feat(wishlist): add bulk import from CSV
fix(auth): resolve session timeout issue
perf(db): optimize assignment query performance
docs: update Docker deployment guide
```

❌ **Bad**

```
Updated files
Fixed bug
WIP
asdf
```

### Pull Requests

✅ **Good PR**

- Clear title with conventional format
- Detailed description
- Links to related issues
- Screenshots for UI changes
- All tests passing

❌ **Bad PR**

- Vague title: "Update stuff"
- No description
- Multiple unrelated changes
- Failing tests

### Release Timing

- **Patch releases**: As needed (hotfixes)
- **Minor releases**: Weekly or bi-weekly
- **Major releases**: Quarterly or as needed

## Release Checklist

Before merging release PR:

- [ ] Review CHANGELOG.md changes
- [ ] Verify version bump is correct
- [ ] Check all CI tests pass
- [ ] Review breaking changes (if any)
- [ ] Ensure documentation is updated
- [ ] Verify Docker build succeeds
- [ ] Test deployment in staging (if available)

After release:

- [ ] Verify GitHub Release created
- [ ] Check Docker images published
- [ ] Update deployment documentation
- [ ] Announce release (if major/minor)
- [ ] Monitor for issues

## Communication

### Release Announcements

For major/minor releases:

1. Create GitHub Discussion
2. Update README if needed
3. Post in community channels

Template:

```markdown
## 🎉 Secret Santa v1.2.0 Released

We're excited to announce version 1.2.0 with the following highlights:

### ✨ New Features

- Wishlist image previews
- Bulk people import
- Dark mode support

### 🐛 Bug Fixes

- Fixed email notification delays
- Resolved mobile layout issues

### 📦 Upgrade

Docker:
`docker pull ghcr.io/JR33D/secret-santa:v1.2.0`

See full changelog: [v1.2.0](https://github.com/JR33D/secret-santa/releases/tag/v1.2.0)
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Release Please Documentation](https://github.com/googleapis/release-please)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

Questions about releases?

- Open a [Discussion](https://github.com/JR33D/secret-santa/discussions)
- Check [existing issues](https://github.com/JR33D/secret-santa/issues)
- Review [CONTRIBUTING.md](./CONTRIBUTING.md)
