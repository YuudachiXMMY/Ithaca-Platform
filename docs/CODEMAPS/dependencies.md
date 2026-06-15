<!-- Generated: 2026-06-14 | Files scanned: 60 | Token estimate: ~400 -->

# Dependencies

## External Services
| Service | Purpose | Config |
|---------|---------|--------|
| PostgreSQL 16 | Primary data store | `DATABASE_URL` env var |
| Resend | Transactional + batch email | `RESEND_API_KEY` (optional in dev) |
| Google Analytics | Usage tracking | Hardcoded `G-675W5PPJEJ` in layout |

## Runtime Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.2.4 | App framework (App Router, standalone) |
| react / react-dom | 19.2.4 | UI rendering |
| @prisma/client | ^6.19 | Database ORM |
| next-auth | ^4.24 | Admin authentication (JWT + Credentials) |
| bcryptjs | ^3.0 | Password hashing |
| zod | ^4.3 | Input validation (used as `zod/v4`) |
| react-hook-form | ^7.72 | Form state management |
| @hookform/resolvers | ^5.2 | Zod resolver for react-hook-form |
| framer-motion | ^12.38 | Scroll/entry animations |
| lucide-react | ^1.8 | Icon library |
| resend | ^6.12 | Email delivery SDK |
| clsx | ^2.1 | Conditional classnames |
| react-email | ^6.0 | Email template components |

## Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | ^4 | Utility-first CSS |
| @tailwindcss/postcss | ^4 | PostCSS integration |
| typescript | ^5 | Type safety |
| eslint + eslint-config-next | ^9 / 16.2.4 | Linting |

## Infrastructure
| Tool | Purpose | Config File |
|------|---------|-------------|
| Docker Compose | Local PostgreSQL | `docker-compose.dev.yml` |
| Dockerfile | Prod multi-stage build | `Dockerfile` |
| Prisma | Schema + migrations | `prisma/schema.prisma` |
| scripts/dev.sh | One-command dev setup | Bash script |
