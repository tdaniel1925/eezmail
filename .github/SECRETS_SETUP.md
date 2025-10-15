# GitHub Actions Secrets & Variables Setup

This document explains how to configure the secrets and variables needed for the CI/CD pipeline to eliminate warnings and enable full functionality.

## Overview

The CI workflow uses:

- **Variables** for public, non-sensitive configuration (embedded in client bundle)
- **Secrets** for sensitive API keys and tokens (never exposed to client)

## Setup Instructions

### 1. Navigate to Repository Settings

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

### 2. Configure Variables (Public)

Click the **Variables** tab and add the following:

| Variable Name                        | Description                   | Example Value                      |
| ------------------------------------ | ----------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | Your Supabase project URL     | `https://xxxxx.supabase.co`        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Supabase anonymous/public key | `eyJhbGciOiJIUzI1...`              |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key        | `pk_test_xxxxx` or `pk_live_xxxxx` |
| `NEXT_PUBLIC_SQUARE_APPLICATION_ID`  | Square application ID         | `sq0idp-xxxxx`                     |
| `NEXT_PUBLIC_APP_URL`                | Your app's URL                | `https://imbox.app`                |

### 3. Configure Secrets (Private)

Click the **Secrets** tab and add the following:

| Secret Name                    | Description                              | Where to Find                             |
| ------------------------------ | ---------------------------------------- | ----------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY`    | Supabase service role key (admin access) | Supabase Dashboard → Settings → API       |
| `STRIPE_SECRET_KEY`            | Stripe secret key                        | Stripe Dashboard → Developers → API Keys  |
| `STRIPE_WEBHOOK_SECRET`        | Stripe webhook signing secret            | Stripe Dashboard → Developers → Webhooks  |
| `SQUARE_ACCESS_TOKEN`          | Square access token                      | Square Developer Dashboard → Applications |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Square webhook signature key             | Square Developer Dashboard → Webhooks     |
| `OPENAI_API_KEY`               | OpenAI API key                           | OpenAI Platform → API Keys                |
| `NYLAS_CLIENT_ID`              | Nylas application client ID              | Nylas Dashboard → Applications            |
| `NYLAS_API_KEY`                | Nylas API key                            | Nylas Dashboard → Applications            |

## Why These Warnings Appear

The GitHub Actions linter shows "Context access might be invalid" warnings because:

1. **Static Analysis**: The linter performs static analysis and cannot access your repository's secrets/variables configuration
2. **Defensive Warning**: GitHub warns about potentially undefined secrets to prevent runtime failures
3. **Expected Behavior**: These warnings are normal for workflows that reference secrets/variables

## How to Verify Setup

After configuring secrets and variables:

1. **Check Workflow Status**: Go to **Actions** tab and view recent workflow runs
2. **Review Build Logs**: Expand the "Build application" step to see if environment variables are set
3. **Test Locally**: The workflow will use placeholder values if secrets aren't configured, allowing builds to succeed

## Security Best Practices

- ✅ **DO** use Variables for `NEXT_PUBLIC_*` values (they're embedded in client code anyway)
- ✅ **DO** use Secrets for API keys, tokens, and webhook secrets
- ❌ **DON'T** commit secrets to version control
- ❌ **DON'T** log secret values in workflow outputs
- ✅ **DO** rotate secrets regularly
- ✅ **DO** use different secrets for development/staging/production

## Testing Without Secrets

The workflow includes placeholder values, so it will still:

- ✅ Run linting
- ✅ Run type checking
- ✅ Complete builds
- ⚠️ Build with placeholder API keys (non-functional but valid for CI)

This allows CI to run on forks and in environments where secrets aren't configured.

## Troubleshooting

### Warnings Still Appear

- **This is normal!** The linter warnings are informational and don't prevent the workflow from running

### Build Fails with "Missing Environment Variable"

- Check that you've added all required secrets/variables
- Verify variable/secret names match exactly (case-sensitive)
- Ensure you're setting them in the correct repository

### Secrets Not Working

- Secrets are only available to workflows triggered from the default branch or by collaborators
- Forks don't have access to repository secrets (for security)
- Pull requests from forks use placeholder values only

## Additional Resources

- [GitHub Actions: Using Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [GitHub Actions: Variables](https://docs.github.com/en/actions/learn-github-actions/variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)


