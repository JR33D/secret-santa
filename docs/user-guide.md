# User Guide

Complete guide to using the Secret Santa application for organizing gift exchanges.

## Table of Contents

- [Getting Started](#getting-started)
- [Admin Features](#admin-features)
- [User Features](#user-features)
- [Best Practices](#best-practices)
- [FAQ](#faq)

---

## Getting Started

### Logging In

1. Navigate to your Secret Santa application URL
2. Enter your username and password
3. Click "Sign In"

**First Time Login:**
- If you received a temporary password, you'll be required to change it
- Choose a strong password (minimum 8 characters)

### User Roles

**Admin:**
- Full access to all features
- Can manage pools, people, restrictions
- Can generate assignments
- Can view all data

**User:**
- Can manage their own wishlist
- Can view their Secret Santa assignment
- Can view their recipient's wishlist

---

## Admin Features

### Managing Pools

Pools organize participants into separate gift exchange groups (e.g., Family, Friends, Coworkers).

#### Creating a Pool

1. Navigate to **Pools** tab
2. Enter a pool name (e.g., "Family 2024")
3. Add optional description
4. Click **Create Pool**

#### Deleting a Pool

⚠️ **Warning:** You must remove all people from a pool before deleting it.

1. Navigate to **Pools** tab
2. Find the pool to delete
3. Click **Delete**
4. Confirm deletion

### Managing People

#### Adding People

1. Navigate to **People** tab
2. Enter person's information:
   - **Name**: Full name (e.g., "John Doe")
   - **Email**: Valid email address (required for user accounts and notifications)
   - **Pool**: Select which pool they belong to
3. Click **Add Person**

**Email Validation:**
- Must be a valid email format
- Required for sending notifications
- Required for creating user accounts

#### Filtering People

Use the pool filter dropdown to view people in specific pools.

#### Deleting People

1. Navigate to **People** tab
2. Find the person to remove
3. Click **Delete**
4. Confirm deletion

### User Management

Create user accounts so family members can log in and manage their wishlists.

#### Creating User Accounts

1. Navigate to **Users** tab
2. Select a person from the dropdown
3. Click **Create User**
4. A modal will display:
   - Username (auto-generated from name)
   - Temporary password
   - Email status

**Email Notification:**
- If email is configured, credentials are automatically sent
- If not configured, share credentials manually
- Users must change their password on first login

#### Resending Credentials

If a user forgets their password:

1. Navigate to **Users** tab
2. Find the user
3. Click **Resend** button
4. New temporary password generated and emailed

#### Deleting User Accounts

1. Navigate to **Users** tab
2. Find the user
3. Click **Delete**
4. Confirm deletion

**Restrictions:**
- Cannot delete your own account
- Cannot delete the last admin account

### Managing Wishlists (Admin)

Admins can manage wishlists for all participants.

#### Adding Items

1. Navigate to **Wishlists** tab
2. Select a person
3. Enter item details:
   - **Item Name**: Required
   - **Link**: Optional URL to product
   - **Image URL**: Optional image URL
4. Click **Add Item**

#### Removing Items

1. Select the person
2. Find the item in their list
3. Click **Remove**

### Managing Restrictions

Restrictions prevent certain people from being assigned to each other (e.g., spouses, siblings).

#### Adding Restrictions

1. Navigate to **Restrictions** tab
2. Select a pool
3. Choose:
   - **Giver**: Person who cannot give to
   - **Receiver**: Person they cannot be assigned
4. Click **Add Restriction**

**Example:**
- Giver: Alice
- Cannot Give To: Bob
- Result: Alice will never be assigned to give a gift to Bob

#### Viewing Restrictions

Restrictions are displayed by pool:
- **Alice** → ❌ → **Bob**

#### Deleting Restrictions

1. Find the restriction
2. Click **Delete**
3. Confirm deletion

### Generating Assignments

#### Prerequisites

- At least 2 people in the pool
- Valid restrictions (if any)

#### Steps

1. Navigate to **Generate** tab
2. Select pool
3. Select year
4. Click **🎲 Generate**

**What Happens:**
- Algorithm generates valid assignments
- Respects all restrictions
- Ensures no one is assigned to themselves
- Creates a circular chain

**Possible Issues:**
- "Cannot generate valid assignments" - Too many restrictions
- "Assignments already exist" - Delete existing assignments first

#### Viewing Assignments

After generation, you'll see:
- **John Doe** → 🎁 → **Jane Smith**
- Total assignments for the pool

#### Deleting Assignments

To regenerate for the same year:

1. Click **Delete All**
2. Confirm deletion
3. Generate new assignments

### Sending Email Notifications

#### Prerequisites

- Email configured (see Email Configuration)
- Assignments generated
- All participants have valid email addresses

#### Steps

1. After generating assignments
2. Click **📧 Send Email Notifications**
3. Confirm sending
4. Review email results

**Each Email Contains:**
- Recipient name
- Their wishlist (if available)
- Login link

### Email Configuration

Configure SMTP settings for sending notifications.

**Note:** This deployment uses environment variables for SMTP configuration. Fields are read-only in the UI.

**To Update Email Settings:**
1. Update environment variables in your deployment
2. Restart the container

**Environment Variables:**
- `SMTP_SERVER` - SMTP server address
- `SMTP_PORT` - SMTP port (default: 587)
- `SMTP_USERNAME` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `FROM_EMAIL` - From email address

### Viewing Assignment History

#### History Graph

Visual representation of all assignments:

1. Navigate to **History** tab
2. Filter by pool (optional)
3. View circular graph showing:
   - Participants as nodes
   - Gift-giving relationships as arrows
   - Different colors for different years

#### Assignment Chains

Text representation showing:
- Year and pool
- Complete gift-giving chains
- Loop detection

**Example:**
```
2024 - Family:
Alice → Bob → Charlie → Alice ✓ (Loop)

2023 - Friends:
John → Jane → Bob
```

---

## User Features

### Managing Your Wishlist

#### Adding Items

1. Navigate to **My Wishlist** tab
2. Enter item details:
   - **Item Name**: What you want (required)
   - **Link**: URL to product page (optional)
   - **Image URL**: Image of the item (optional)
3. Click **Add to Wishlist**

**Tips:**
- Be specific with item names
- Include links to make shopping easier
- Add multiple options at different price points
- Update your wishlist before assignments are sent

#### Removing Items

1. Find the item in your wishlist
2. Click **Remove**
3. Confirm removal

### Viewing Your Assignment

#### Checking Your Recipient

1. Navigate to **Their Wishlist** tab
2. After assignments are generated, you'll see:
   - Your recipient's name
   - Their wishlist
   - Links to items they want

**Before Assignment:**
- You'll see a message that no assignment exists yet
- Check back after admin generates assignments

#### Shopping Tips

- Review wishlist carefully
- Note price ranges and preferences
- Check product links before purchasing
- Consider delivery times

### Changing Your Password

1. Click your username (top-right corner)
2. Select **Change Password**
3. Enter:
   - Current password
   - New password (minimum 8 characters)
   - Confirm new password
4. Click **Change Password**

**Password Requirements:**
- Minimum 8 characters
- Passwords must match

---

## Best Practices

### For Administrators

#### Planning Timeline

**4 Weeks Before:**
- Create pool
- Add all participants
- Create user accounts
- Send login credentials

**3 Weeks Before:**
- Remind participants to create wishlists
- Add any restrictions

**2 Weeks Before:**
- Generate assignments
- Send email notifications
- Verify all participants received emails

**1 Week Before:**
- Final reminder to participants
- Answer any questions

#### Pool Organization

**Separate pools for:**
- Different family groups
- Friend groups vs. family
- Office vs. personal
- Different budget ranges

#### Restriction Guidelines

**Common restrictions:**
- Spouses/partners
- Siblings
- Parent-child pairs
- Recent years (if tracking history)

**Avoid over-restricting:**
- Too many restrictions may make assignment impossible
- Keep restrictions minimal and necessary

### For Participants

#### Wishlist Tips

**Do:**
- Add 5-10 items at varying price points
- Include specific product links
- Update regularly
- Be realistic about what you want

**Don't:**
- Add only expensive items
- Be too vague
- Forget to check your wishlist
- Add items you've already purchased

#### Being a Good Secret Santa

**Do:**
- Check wishlist early
- Order in time for delivery
- Respect budget guidelines
- Keep identity secret
- Have fun with it!

**Don't:**
- Wait until last minute
- Ignore the wishlist completely
- Exceed agreed budget significantly
- Reveal your identity before exchange

---

## FAQ

### General

**Q: How do I know if I'm an admin or regular user?**
A: Check the top-right corner. Admins see "👑 Admin", users see "👤 User".

**Q: Can I participate if I'm an admin?**
A: Yes! Create a person entry for yourself and add yourself to a pool.

**Q: Can one person be in multiple pools?**
A: No, each person can only be in one pool. Create separate entries if needed.

### Wishlists

**Q: Can others see my wishlist?**
A: Only your Secret Santa (after assignments) and admins can see your wishlist.

**Q: Can I edit my wishlist after assignments are sent?**
A: Yes! Your Secret Santa will see updates in real-time.

**Q: What if I don't want to share specific items?**
A: You can add general categories or interests instead of specific products.

### Assignments

**Q: When will I find out who I'm buying for?**
A: After the admin generates assignments and sends notifications.

**Q: Can I see who's buying for me?**
A: No, that's the secret in Secret Santa!

**Q: What if I get someone difficult to shop for?**
A: Check their wishlist, ask mutual friends for ideas, or choose something thoughtful and general.

**Q: Can assignments be regenerated?**
A: Yes, admins can delete and regenerate assignments before the exchange.

### Technical

**Q: I forgot my password. What do I do?**
A: Contact your admin to reset your password.

**Q: The email notification didn't arrive. What now?**
A: Check spam folder, or contact your admin to resend.

**Q: Can I access this on mobile?**
A: Yes! The application is fully responsive and works on all devices.

**Q: Is my data secure?**
A: Yes. Passwords are hashed, and the database is only accessible to authorized users.

### Troubleshooting

**Q: I can't log in. What's wrong?**
A: Verify username and password. Contact admin if issues persist.

**Q: My wishlist isn't saving.**
A: Check your internet connection and try again. Contact admin if problem continues.

**Q: The assignment generation failed.**
A: Too many restrictions may prevent valid assignments. Admin should review restrictions.

---

## Getting Help

- Check [Troubleshooting Guide](troubleshooting.md) for common issues
- Contact your system administrator
- Open an issue on [GitHub](https://github.com/JR33D/secret-santa/issues)