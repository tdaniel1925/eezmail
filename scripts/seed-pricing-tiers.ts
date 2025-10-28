/**
 * Seed script to populate pricing tiers in the database
 * Run with: npx tsx scripts/seed-pricing-tiers.ts
 */

import { db } from '../src/lib/db';
import { pricingTiers, tierFeatures } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const PRICING_DATA = [
  {
    name: 'Individual',
    slug: 'individual',
    description: 'Perfect for solo professionals',
    priceMonthly: 45,
    priceYearly: 36,
    seats: '1 user',
    sortOrder: 4,
    isHighlighted: false,
    features: [
      {
        key: 'email_accounts',
        name: 'Email Accounts',
        value: -1,
        type: 'limit',
      },
      { key: 'storage', name: 'Storage', value: -1, type: 'limit' },
      { key: 'ai_features', name: 'AI Features', value: -1, type: 'boolean' },
      {
        key: 'smart_categorization',
        name: 'Smart Categorization',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'advanced_search',
        name: 'Advanced Search',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'contact_intelligence',
        name: 'Contact Intelligence',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'email_scheduling',
        name: 'Email Scheduling',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'voice_messages',
        name: 'Voice Messages',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'mobile_apps',
        name: 'Mobile & Desktop Apps',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'sms_rate',
        name: 'SMS (admin-set rate)',
        value: -1,
        type: 'custom',
      },
      {
        key: 'support',
        name: 'Priority Email Support',
        value: -1,
        type: 'boolean',
      },
    ],
  },
  {
    name: 'Team',
    slug: 'team',
    description: 'For small teams that collaborate',
    priceMonthly: 35,
    priceYearly: 28,
    seats: '2-5 users',
    sortOrder: 3,
    isHighlighted: true,
    features: [
      {
        key: 'everything_individual',
        name: 'Everything in Individual',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'team_collaboration',
        name: 'Team Collaboration',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'shared_contacts',
        name: 'Shared Contacts & Labels',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'team_inbox',
        name: 'Team Inbox Management',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'admin_controls',
        name: 'Admin Controls',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'usage_analytics',
        name: 'Usage Analytics Dashboard',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'bulk_actions',
        name: 'Bulk Actions & Automation',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'sms_rate',
        name: 'SMS (admin-set rate)',
        value: -1,
        type: 'custom',
      },
      {
        key: 'support',
        name: 'Priority Email Support',
        value: -1,
        type: 'boolean',
      },
    ],
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Best value for growing organizations',
    priceMonthly: 30,
    priceYearly: 24,
    seats: '6-15 users',
    sortOrder: 2,
    isHighlighted: false,
    features: [
      {
        key: 'everything_team',
        name: 'Everything in Team',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'advanced_security',
        name: 'Advanced Security & Compliance',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'sso',
        name: 'SSO & SAML Authentication',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'custom_ai',
        name: 'Custom AI Model Training',
        value: -1,
        type: 'boolean',
      },
      { key: 'api_access', name: 'API Access', value: -1, type: 'boolean' },
      {
        key: 'advanced_automation',
        name: 'Advanced Workflow Automation',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'account_manager',
        name: 'Dedicated Account Manager',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'white_label',
        name: 'White-label Options',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'sms_rate',
        name: 'SMS (admin-set rate)',
        value: -1,
        type: 'custom',
      },
      {
        key: 'support',
        name: '24/7 Priority Support',
        value: -1,
        type: 'boolean',
      },
      { key: 'sla', name: 'SLA Guarantees', value: -1, type: 'boolean' },
    ],
  },
  {
    name: 'Platform',
    slug: 'platform',
    description: 'Maximum value for large teams',
    priceMonthly: 25,
    priceYearly: 20,
    seats: '15+ users',
    sortOrder: 1,
    isHighlighted: false,
    features: [
      {
        key: 'everything_enterprise',
        name: 'Everything in Enterprise',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'unlimited_seats',
        name: 'Unlimited User Seats',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'custom_contracts',
        name: 'Custom Contract Terms',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'volume_discount',
        name: 'Volume Discount Pricing',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'premium_onboarding',
        name: 'Premium Onboarding & Training',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'custom_development',
        name: 'Custom Feature Development',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'dedicated_support',
        name: 'Dedicated Technical Support',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'security_audits',
        name: 'Advanced Security Audits',
        value: -1,
        type: 'boolean',
      },
      {
        key: 'sms_rate',
        name: 'SMS (admin-set rate)',
        value: -1,
        type: 'custom',
      },
      {
        key: 'white_glove',
        name: 'White-glove Support',
        value: -1,
        type: 'boolean',
      },
      { key: 'custom_sla', name: 'Custom SLAs', value: -1, type: 'boolean' },
    ],
  },
];

async function seedPricingTiers() {
  console.log('🌱 Starting pricing tiers seed...');

  try {
    // Delete existing tiers and features
    console.log('🗑️  Clearing existing pricing data...');
    try {
      await db.delete(tierFeatures);
      console.log('  ✓ Deleted existing tier features');
    } catch (err) {
      console.log('  ⚠️  No existing tier features to delete');
    }

    try {
      await db.delete(pricingTiers);
      console.log('  ✓ Deleted existing pricing tiers');
    } catch (err) {
      console.log('  ⚠️  No existing pricing tiers to delete');
    }

    // Create new tiers with features
    for (const tierData of PRICING_DATA) {
      console.log(`\n✨ Creating tier: ${tierData.name}`);

      // Create monthly tier
      const [monthlyTier] = await db
        .insert(pricingTiers)
        .values({
          name: tierData.name,
          slug: tierData.slug,
          description: tierData.description,
          price: tierData.priceMonthly.toString(),
          interval: 'month',
          isActive: true,
          isHighlighted: tierData.isHighlighted,
          isCustom: false,
          sortOrder: tierData.sortOrder,
        })
        .returning();

      console.log(`  ✓ Monthly tier created ($${tierData.priceMonthly}/month)`);

      // Create yearly tier
      const [yearlyTier] = await db
        .insert(pricingTiers)
        .values({
          name: `${tierData.name} (Annual)`,
          slug: `${tierData.slug}-annual`,
          description: `${tierData.description} - Save 20% with annual billing`,
          price: tierData.priceYearly.toString(),
          interval: 'year',
          isActive: true,
          isHighlighted: tierData.isHighlighted,
          isCustom: false,
          sortOrder: tierData.sortOrder,
        })
        .returning();

      console.log(
        `  ✓ Annual tier created ($${tierData.priceYearly}/month, billed annually)`
      );

      // Create features for both monthly and yearly tiers
      for (const tier of [monthlyTier, yearlyTier]) {
        const features = tierData.features.map((feature, index) => ({
          tierId: tier.id,
          featureKey: feature.key,
          featureName: feature.name,
          featureValue: feature.value,
          featureType: feature.type,
          isVisible: true,
          sortOrder: tierData.features.length - index,
        }));

        await db.insert(tierFeatures).values(features);
        console.log(`  ✓ ${features.length} features added to ${tier.name}`);
      }
    }

    console.log('\n✅ Pricing tiers seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`  • 4 pricing tiers (Individual, Team, Enterprise, Platform)`);
    console.log(`  • 8 total tier records (monthly + annual for each)`);
    console.log(`  • Features configured for all tiers`);
    console.log(`  • "Team" tier marked as highlighted (Most Popular)`);
    console.log(`  • All tiers set to active`);
    console.log('\n💡 Next steps:');
    console.log('  1. Visit /admin/pricing to view and manage tiers');
    console.log('  2. Configure Stripe product/price IDs for each tier');
    console.log('  3. Set up SMS pricing in admin settings');
    console.log('  4. Test signup flow with different plans\n');
  } catch (error) {
    console.error('❌ Error seeding pricing tiers:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seedPricingTiers();
