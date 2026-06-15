<!-- Generated: 2026-06-14 | Files scanned: 60 | Token estimate: ~450 -->

# Data Architecture

## Database
PostgreSQL 16 via Prisma ORM (`prisma/schema.prisma`)

## Models

### Subscriber (`subscribers`)
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| email | String | Unique |
| name | String? | Optional |
| status | String | "active" / "unsubscribed" |
| subscribed_at | DateTime | Auto |
| updated_at | DateTime | Auto |

### ContactMessage (`contact_messages`)
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| name | String | Required |
| email | String | Required |
| phone | String? | Optional |
| message | String? | Optional |
| subscribe | Boolean | Default false |
| created_at | DateTime | Auto |

### AdminUser (`admin_users`)
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| email | String | Unique |
| password_hash | String | bcryptjs |
| name | String? | Optional |
| role | String | Default "admin" |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

### EmailCampaign (`email_campaigns`)
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| subject | String | Required |
| body | String | HTML content |
| status | String | draft → sending → sent / failed |
| recipient_count | Int | Default 0 |
| sent_at | DateTime? | Set on send |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

### Popup (`popups`)
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| title | String | Required |
| content | String | Required |
| button_text | String? | CTA text |
| button_link | String? | CTA URL |
| is_active | Boolean | Default false |
| start_date | DateTime? | Schedule start |
| end_date | DateTime? | Schedule end |
| display_rules | String? | JSON: pages[], frequency |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

## Relationships
No foreign keys between models — all tables are independent.

## Seeding
`prisma/seed.ts` — Creates admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars.
