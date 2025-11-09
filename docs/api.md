# API Documentation

Complete reference for Secret Santa API endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Pools](#pools)
- [People](#people)
- [Users](#users)
- [Wishlists](#wishlists)
- [Restrictions](#restrictions)
- [Assignments](#assignments)
- [Email Configuration](#email-configuration)
- [Health Check](#health-check)

---

## Authentication

All API routes (except health check and auth endpoints) require authentication.

### Login

**Endpoint:** `POST /api/auth/signin`

Uses NextAuth.js for authentication.

**Request Body:**

```json
{
	"username": "admin",
	"password": "your_password"
}
```

**Response:**

```json
{
	"user": {
		"id": "1",
		"username": "admin",
		"role": "admin"
	}
}
```

### Change Password

**Endpoint:** `POST /api/change-password`

**Authentication:** Required

**Request Body:**

```json
{
	"currentPassword": "old_password",
	"newPassword": "new_password"
}
```

**Response:**

```json
{
	"message": "Password changed successfully"
}
```

**Errors:**

- `401` - Unauthorized
- `400` - Invalid passwords or passwords don't meet requirements
- `404` - User not found

---

## Pools

### Get All Pools

**Endpoint:** `GET /api/pools`

**Authentication:** Admin only

**Response:**

```json
[
	{
		"id": 1,
		"name": "Family",
		"description": "Family gift exchange",
		"member_count": 5,
		"created_at": "2024-01-15T10:00:00.000Z"
	}
]
```

### Create Pool

**Endpoint:** `POST /api/pools`

**Authentication:** Admin only

**Request Body:**

```json
{
	"name": "Family",
	"description": "Family gift exchange"
}
```

**Response:**

```json
{
	"id": 1,
	"name": "Family",
	"description": "Family gift exchange",
	"message": "Pool created successfully"
}
```

**Errors:**

- `400` - Name is required or already exists

### Update Pool

**Endpoint:** `PATCH /api/pools/[id]`

**Authentication:** Admin only

**Request Body:**

```json
{
	"name": "Updated Family",
	"description": "Updated description"
}
```

**Response:**

```json
{
	"message": "Pool updated successfully"
}
```

### Delete Pool

**Endpoint:** `DELETE /api/pools/[id]`

**Authentication:** Admin only

**Response:**

```json
{
	"message": "Pool deleted successfully"
}
```

**Errors:**

- `400` - Cannot delete pool with people in it

---

## People

### Get All People

**Endpoint:** `GET /api/people`

**Query Parameters:**

- `pool_id` (optional) - Filter by pool

**Authentication:** Admin only

**Response:**

```json
[
	{
		"id": 1,
		"name": "John Doe",
		"email": "john@example.com",
		"pool_id": 1,
		"pool_name": "Family",
		"created_at": "2024-01-15T10:00:00.000Z"
	}
]
```

### Create Person

**Endpoint:** `POST /api/people`

**Authentication:** Admin only

**Request Body:**

```json
{
	"name": "John Doe",
	"email": "john@example.com",
	"pool_id": 1
}
```

**Response:**

```json
{
	"id": 1,
	"name": "John Doe",
	"email": "john@example.com",
	"pool_id": 1,
	"message": "Person added successfully"
}
```

**Errors:**

- `400` - Name, email, or pool_id missing
- `400` - Invalid pool selected
- `400` - Invalid email format

### Delete Person

**Endpoint:** `DELETE /api/people/[id]`

**Authentication:** Admin only

**Response:**

```json
{
	"success": true
}
```

---

## Users

### Get All Users

**Endpoint:** `GET /api/users`

**Authentication:** Admin only

**Response:**

```json
[
	{
		"id": 1,
		"username": "admin",
		"role": "admin",
		"person_id": null,
		"must_change_password": 0,
		"created_at": "2024-01-15T10:00:00.000Z"
	},
	{
		"id": 2,
		"username": "johndoe",
		"role": "user",
		"person_id": 5,
		"person_name": "John Doe",
		"person_email": "john@example.com",
		"must_change_password": 1,
		"created_at": "2024-01-15T10:00:00.000Z"
	}
]
```

### Create User

**Endpoint:** `POST /api/users`

**Authentication:** Admin only

**Request Body:**

```json
{
	"person_id": 5
}
```

**Response:**

```json
{
	"id": 2,
	"username": "johndoe",
	"tempPassword": "RandomPass123",
	"person_name": "John Doe",
	"person_email": "john@example.com",
	"emailSent": true,
	"message": "User created and credentials emailed successfully"
}
```

**Errors:**

- `400` - Person ID required
- `404` - Person not found
- `400` - User already exists for this person

### Delete User

**Endpoint:** `DELETE /api/users/[id]`

**Authentication:** Admin only

**Response:**

```json
{
	"message": "User deleted successfully"
}
```

**Errors:**

- `400` - Cannot delete own account
- `400` - Cannot delete last admin user
- `404` - User not found

### Resend Credentials

**Endpoint:** `POST /api/users/[id]/resend-credentials`

**Authentication:** Admin only

**Response:**

```json
{
	"username": "johndoe",
	"tempPassword": "NewRandomPass456",
	"person_name": "John Doe",
	"person_email": "john@example.com",
	"emailSent": true,
	"message": "New password generated and emailed successfully"
}
```

---

## Wishlists

### Get Wishlist for Person

**Endpoint:** `GET /api/wishlist/[personId]`

**Authentication:**

- Admin can view any wishlist
- Users can view their own and their assignment's wishlist

**Response:**

```json
[
	{
		"id": 1,
		"person_id": 5,
		"item_name": "Book",
		"link": "https://example.com/book",
		"image_url": "https://example.com/book.jpg",
		"created_at": "2024-01-15T10:00:00.000Z"
	}
]
```

### Add Wishlist Item

**Endpoint:** `POST /api/wishlist/[personId]`

**Authentication:**

- Admin can add for anyone
- Users can add for themselves

**Request Body:**

```json
{
	"item_name": "Book",
	"link": "https://example.com/book",
	"image_url": "https://example.com/book.jpg"
}
```

**Response:**

```json
{
	"id": 1,
	"item_name": "Book",
	"link": "https://example.com/book",
	"image_url": "https://example.com/book.jpg"
}
```

### Delete Wishlist Item

**Endpoint:** `DELETE /api/wishlist/item/[id]`

**Authentication:** Required

**Response:**

```json
{
	"success": true
}
```

---

## Restrictions

### Get All Restrictions

**Endpoint:** `GET /api/restrictions`

**Authentication:** Admin only

**Response:**

```json
[
	{
		"id": 1,
		"giver_id": 1,
		"receiver_id": 2,
		"giver_name": "Alice",
		"receiver_name": "Bob"
	}
]
```

### Create Restriction

**Endpoint:** `POST /api/restrictions`

**Authentication:** Admin only

**Request Body:**

```json
{
	"giver_id": 1,
	"receiver_id": 2
}
```

**Response:**

```json
{
	"id": 1,
	"giver_id": 1,
	"receiver_id": 2
}
```

**Errors:**

- `400` - Restriction already exists (unique constraint)

### Delete Restriction

**Endpoint:** `DELETE /api/restrictions/[id]`

**Authentication:** Admin only

**Response:**

```json
{
	"success": true
}
```

---

## Assignments

### Get All Assignments

**Endpoint:** `GET /api/assignments`

**Query Parameters:**

- `pool_id` (optional) - Filter by pool

**Authentication:** Admin only

**Response:**

```json
[
	{
		"id": 1,
		"year": 2024,
		"giver_id": 1,
		"receiver_id": 2,
		"pool_id": 1,
		"giver_name": "Alice",
		"receiver_name": "Bob",
		"pool_name": "Family",
		"created_at": "2024-01-15T10:00:00.000Z"
	}
]
```

### Get Assignments for Year

**Endpoint:** `GET /api/assignments/[year]`

**Query Parameters:**

- `pool_id` (optional) - Filter by pool

**Authentication:** Admin only

**Response:**

```json
[
	{
		"id": 1,
		"year": 2024,
		"giver_id": 1,
		"receiver_id": 2,
		"pool_id": 1,
		"giver_name": "Alice",
		"receiver_name": "Bob",
		"pool_name": "Family"
	}
]
```

### Get My Assignment

**Endpoint:** `GET /api/my-assignments`

**Query Parameters:**

- `person_id` (required) - Person ID
- `year` (required) - Year

**Authentication:** User or Admin

**Response:**

```json
[
	{
		"year": 2024,
		"receiver_id": 2,
		"receiver_name": "Bob",
		"receiver_email": "bob@example.com"
	}
]
```

**Errors:**

- `401` - Unauthorized
- `400` - person_id and year are required
- `403` - Can only view own assignment (unless admin)

### Generate Assignments

**Endpoint:** `POST /api/generate/[year]`

**Query Parameters:**

- `pool_id` (required) - Pool ID

**Authentication:** Admin only

**Response:**

```json
{
	"success": true,
	"message": "Successfully generated 5 assignments for 2024!"
}
```

**Errors:**

- `400` - Pool ID required
- `400` - Need at least 2 people in pool
- `400` - Assignments already exist for this year/pool
- `400` - Could not generate valid assignments with current restrictions

### Delete Assignments for Year

**Endpoint:** `DELETE /api/assignments/[year]`

**Query Parameters:**

- `pool_id` (optional) - Filter by pool

**Authentication:** Admin only

**Response:**

```json
{
	"message": "Assignments deleted successfully"
}
```

### Send Email Notifications

**Endpoint:** `POST /api/send-notifications/[year]`

**Query Parameters:**

- `pool_id` (required) - Pool ID

**Authentication:** Admin only

**Response:**

```json
[
	{
		"giver": "Alice",
		"success": true,
		"message": "Email sent"
	},
	{
		"giver": "Bob",
		"success": false,
		"message": "Email address not found"
	}
]
```

**Note:** If email is not configured, returns error for all recipients.

### Get History Graph Data

**Endpoint:** `GET /api/history-graph`

**Query Parameters:**

- `pool_id` (optional) - Filter by pool

**Authentication:** Admin only

**Response:**

```json
{
	"nodes": ["Alice", "Bob", "Charlie"],
	"links": [
		{
			"year": 2024,
			"giver": "Alice",
			"receiver": "Bob"
		},
		{
			"year": 2024,
			"giver": "Bob",
			"receiver": "Charlie"
		}
	]
}
```

---

## Email Configuration

### Get Email Configuration

**Endpoint:** `GET /api/email-config`

**Authentication:** Admin only

**Response:**

```json
{
	"smtp_server": "smtp.gmail.com",
	"smtp_port": 587,
	"smtp_username": "user@gmail.com",
	"from_email": "noreply@example.com",
	"source": "env"
}
```

**Note:** Returns empty object if not configured. Password is never returned.

### Update Email Configuration

**Endpoint:** `POST /api/email-config`

**Authentication:** Admin only

**Note:** This endpoint returns 403 in environment-only mode. Email configuration must be managed via environment variables.

**Response:**

```json
{
	"error": "Email configuration is managed via environment variables in this deployment; POST is disabled."
}
```

---

## Health Check

### Check Application Health

**Endpoint:** `GET /api/health`

**Authentication:** None required

**Response (Healthy):**

```json
{
	"status": "healthy",
	"timestamp": "2024-01-15T12:00:00.000Z",
	"database": "connected"
}
```

**Response (Unhealthy):**

```json
{
	"status": "unhealthy",
	"timestamp": "2024-01-15T12:00:00.000Z",
	"database": "disconnected",
	"error": "Connection error"
}
```

**HTTP Status:**

- `200` - Healthy
- `503` - Unhealthy

---

## Error Responses

### Standard Error Format

```json
{
	"error": "Error message description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

### Example Errors

**Validation Error:**

```json
{
	"error": "Name and email are required"
}
```

**Authentication Error:**

```json
{
	"error": "Unauthorized"
}
```

**Permission Error:**

```json
{
	"error": "Unauthorized - Admin access required"
}
```

**Not Found:**

```json
{
	"error": "Person not found"
}
```

---

## Rate Limiting

No built-in rate limiting in the application. Implement at reverse proxy level (nginx, Caddy, Traefik).

**Recommended Limits:**

- Login endpoint: 5 requests per minute per IP
- General API: 100 requests per minute per user

---

## Authentication Flow

### Session-Based Authentication

1. **Login:** POST to `/api/auth/signin`
2. **Session Cookie:** HttpOnly cookie set automatically
3. **Subsequent Requests:** Cookie sent automatically
4. **Logout:** POST to `/api/auth/signout`

### Role-Based Access

**Admin Routes:**

- All `/api/pools/*`
- All `/api/people/*`
- All `/api/users/*`
- All `/api/restrictions/*`
- All `/api/generate/*`
- All `/api/assignments/*` (except my-assignments)
- All `/api/email-config/*`
- All `/api/send-notifications/*`
- All `/api/history-graph`

**User Routes:**

- `/api/wishlist/*` (own wishlist and assigned recipient)
- `/api/my-assignments` (own assignment only)
- `/api/change-password`

---

## API Client Example

### JavaScript/TypeScript

```typescript
// Helper functions
async function apiGet<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: response.statusText }));
		throw new Error(error.error || `HTTP ${response.status}`);
	}
	return response.json();
}

async function apiPost<T>(url: string, data?: any): Promise<T> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: data ? JSON.stringify(data) : undefined,
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: response.statusText }));
		throw new Error(error.error || `HTTP ${response.status}`);
	}
	return response.json();
}

// Usage examples
const pools = await apiGet('/api/pools');
const newPool = await apiPost('/api/pools', {
	name: 'Friends',
	description: 'Friend group',
});
```

### cURL Examples

**Get Pools:**

```bash
curl -X GET http://localhost:3000/api/pools \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Create Pool:**

```bash
curl -X POST http://localhost:3000/api/pools \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"name":"Family","description":"Family pool"}'
```

**Delete Pool:**

```bash
curl -X DELETE http://localhost:3000/api/pools/1 \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Python Example

```python
import requests

class SecretSantaAPI:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()

    def login(self, username, password):
        response = self.session.post(
            f"{self.base_url}/api/auth/signin",
            json={"username": username, "password": password}
        )
        return response.json()

    def get_pools(self):
        response = self.session.get(f"{self.base_url}/api/pools")
        return response.json()

    def create_pool(self, name, description=""):
        response = self.session.post(
            f"{self.base_url}/api/pools",
            json={"name": name, "description": description}
        )
        return response.json()

# Usage
api = SecretSantaAPI("http://localhost:3000")
api.login("admin", "password")
pools = api.get_pools()
```

---

## API Versioning

Current version: **v1** (implicit, no version prefix)

Future versions to be determined.

---

## Data Models

### Pool

```typescript
interface Pool {
	id: number;
	name: string;
	description: string;
	member_count?: number;
	created_at: string;
}
```

### Person

```typescript
interface Person {
	id: number;
	name: string;
	email: string;
	pool_id: number;
	pool_name?: string;
	created_at: string;
}
```

### User

```typescript
interface User {
	id: number;
	username: string;
	role: 'admin' | 'user';
	person_id?: number;
	person_name?: string;
	person_email?: string;
	must_change_password: number;
	created_at: string;
}
```

### Wishlist Item

```typescript
interface WishlistItem {
	id: number;
	person_id: number;
	item_name: string;
	link?: string;
	image_url?: string;
	created_at: string;
}
```

### Restriction

```typescript
interface Restriction {
	id: number;
	giver_id: number;
	receiver_id: number;
	giver_name: string;
	receiver_name: string;
}
```

### Assignment

```typescript
interface Assignment {
	id: number;
	year: number;
	giver_id: number;
	receiver_id: number;
	pool_id: number;
	giver_name: string;
	receiver_name: string;
	pool_name: string;
	created_at: string;
}
```

---

## Database Schema

### Tables

**pools**

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT UNIQUE NOT NULL
- `description` TEXT
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP

**people**

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT NOT NULL
- `email` TEXT NOT NULL
- `pool_id` INTEGER (FK → pools.id)
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP

**users**

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `username` TEXT UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL
- `role` TEXT NOT NULL CHECK(role IN ('admin', 'user'))
- `person_id` INTEGER UNIQUE (FK → people.id)
- `must_change_password` INTEGER DEFAULT 1
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP

**wishlist_items**

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `person_id` INTEGER NOT NULL (FK → people.id)
- `item_name` TEXT NOT NULL
- `link` TEXT
- `image_url` TEXT
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP

**restrictions**

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `giver_id` INTEGER NOT NULL (FK → people.id)
- `receiver_id` INTEGER NOT NULL (FK → people.id)
- UNIQUE(giver_id, receiver_id)

**assignments**

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `year` INTEGER NOT NULL
- `giver_id` INTEGER NOT NULL (FK → people.id)
- `receiver_id` INTEGER NOT NULL (FK → people.id)
- `pool_id` INTEGER (FK → pools.id)
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
- UNIQUE(year, giver_id, pool_id)

### Indexes

- `idx_users_username` ON users(username)
- `idx_users_person_id` ON users(person_id)
- `idx_assignments_year` ON assignments(year)
- `idx_people_pool` ON people(pool_id)

---

## Security Considerations

### Authentication

- Session-based with HttpOnly cookies
- Passwords hashed with bcrypt
- JWT tokens for session management
- 30-day session expiration

### Authorization

- Role-based access control (admin/user)
- Admin-only routes protected by middleware
- Users can only access their own data

### Input Validation

- Email format validation
- Password requirements (8+ characters)

### Best Practices

1. **Use HTTPS** in production
2. **Rotate NEXTAUTH_SECRET** regularly
3. **Use strong passwords** for admin account
4. **Limit admin accounts** to trusted individuals
5. **Enable rate limiting** at reverse proxy
6. **Keep application updated** to latest version

---

## API Limits

### Data Limits

- **Pool name**: 255 characters
- **Person name**: 255 characters
- **Email**: 255 characters
- **Wishlist item name**: 255 characters
- **URL length**: 2048 characters
- **Description**: Unlimited (TEXT field)

### File Size Limits

Not applicable - no file uploads currently supported.

---

## Testing API

### Using Postman

1. **Import Collection**: Create new collection
2. **Set Base URL**: `http://localhost:3000`
3. **Login**: POST to `/api/auth/signin`
4. **Save Cookie**: Automatically handled
5. **Test Endpoints**: Use saved session

### Using HTTPie

```bash
# Login
http POST :3000/api/auth/signin username=admin password=admin123

# Save session
http --session=admin :3000/api/auth/signin username=admin password=admin123

# Use session
http --session=admin :3000/api/pools

# Create pool
http --session=admin POST :3000/api/pools name="Family" description="Family pool"
```

### Automated Testing

```typescript
// __tests__/api/pools.test.ts
import { GET, POST } from '@/app/api/pools/route';

describe('Pools API', () => {
	it('returns all pools', async () => {
		const response = await GET();
		const pools = await response.json();

		expect(Array.isArray(pools)).toBe(true);
	});

	it('creates a pool', async () => {
		const req = {
			json: async () => ({ name: 'Test', description: 'Test pool' }),
		};

		const response = await POST(req as any);
		const result = await response.json();

		expect(result.name).toBe('Test');
	});
});
```

---

## API Changes & Deprecation

### Versioning Strategy

- Breaking changes will increment major version
- New features increment minor version
- Bug fixes increment patch version

### Deprecation Process

To be Determined

### Current Status

All endpoints are **stable** and supported.

---

## Support & Resources

- [Installation Guide](installation.md)
- [User Guide](user-guide.md)
- [Development Guide](development.md)
- [GitHub Issues](https://github.com/JR33D/secret-santa/issues)
- [API Changelog](../CHANGELOG.md)

---

## Future API Enhancements

**Planned Features:**

- Pagination support
- Bulk operations
- Export/Import functionality
- Audit logs API

**Under Consideration:**

- OAuth2 authentication
- API versioning in URL

---

## Contributing to API

See [Contributing Guide](CONTRIBUTING.md) for:

- Adding new endpoints
- Modifying existing endpoints
- Breaking change guidelines
- API testing requirements
- Documentation standards

---

## License

This API documentation is part of the Secret Santa project [License](LICENSE).
