# Imbox - AI-Powered Email Client

Transform inbox chaos into actionable intelligence with AI-first email management.

## 🚀 Features

- **AI-Powered Email Screening** - Only see emails from approved senders
- **Smart Classification** - AI automatically sorts emails into Imbox, Feed, and Paper Trail
- **Instant AI Insights** - Hover for AI summaries and quick replies
- **Dual Payment Processing** - Accept payments via Stripe or Square
- **Universal Compatibility** - Works with Gmail, Outlook, Yahoo, and any IMAP/SMTP provider
- **Privacy First** - Tracker blocking, no data mining, no ads

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth
- **Payments**: Stripe + Square
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account
- Square account
- Git

## 🏗️ Installation

### 1. Clone the repository

\`\`\`bash
git clone <your-repo-url>
cd win-email_client
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Set up environment variables

Copy the example environment file:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Then fill in your actual values in `.env.local`. See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

### 4. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env.local`
3. Run the database migrations (see SETUP_GUIDE.md)

### 5. Configure Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Get your API keys from the Developers section
3. Create subscription products and copy price IDs
4. Add all keys to `.env.local`

### 6. Configure Square

1. Go to [developer.squareup.com](https://developer.squareup.com)
2. Create an application
3. Get your access token and application ID
4. Create subscription plans
5. Add all keys to `.env.local`

### 7. Run the development server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Detailed setup instructions
- [Payment Integration](./PAYMENT_INTEGRATION.md) - How dual payments work
- [Product Requirements](./AI_EMAIL_CLIENT_PRD_OVERVIEW.md) - Full PRD

## 🧪 Testing

\`\`\`bash

# Type check

npm run type-check

# Lint

npm run lint

# Format

npm run format
\`\`\`

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add all environment variables
5. Deploy!

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed deployment instructions.

## 📁 Project Structure

\`\`\`
src/
├── app/ # Next.js App Router
│ ├── (auth)/ # Auth pages (login, signup)
│ ├── (dashboard)/ # Protected dashboard pages
│ └── api/ # API routes & webhooks
├── components/ # React components
│ ├── ui/ # shadcn components
│ ├── stripe/ # Stripe components
│ ├── square/ # Square components
│ └── pricing/ # Pricing table
├── lib/ # Utilities & integrations
│ ├── supabase/ # Supabase clients
│ ├── stripe/ # Stripe integration
│ ├── square/ # Square integration
│ └── payments/ # Unified payment types
└── db/ # Database schema
\`\`\`

## 🔐 Environment Variables

See `.env.local.example` for all required environment variables.

## 🤝 Contributing

This is a proprietary project. Contact the maintainers for contribution guidelines.

## 📄 License

Copyright © 2025 Imbox. All rights reserved.

## 🆘 Support

- Email: support@imbox.com
- Documentation: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- Issues: Create a GitHub issue

## 🎯 Roadmap

- [x] Authentication with Supabase
- [x] Dual payment processing (Stripe + Square)
- [x] Database schema
- [ ] Email sync integration
- [ ] AI features (summaries, quick replies)
- [ ] Dashboard UI
- [ ] Email list & detail views
- [ ] Contact management

---

Built with ❤️ using Next.js 14, TypeScript, and Supabase
