# Social Media Studio Documentation

## Overview
The Social Media Studio is a comprehensive AI-powered social media management platform integrated into the Hotel Management System (HMS). It enables hotels to create, schedule, and analyze social media content across multiple platforms.

## Routes
The Social Media Studio includes the following routes under the `/social-media` path:

- `/social-media` - Main dashboard with overview and quick actions
- `/social-media/generator` - AI-powered content generation tool
- `/social-media/calendar` - Visual content calendar for scheduling
- `/social-media/analytics` - Performance analytics and insights
- `/social-media/brand-kit` - Brand management and visual identity
- `/social-media/integrations` - Social platform connections and settings
- `/social-media/advanced` - Advanced features like automation and competitor analysis
- `/social-media/enterprise` - Enterprise-level reporting and security features

## Role-Based Access Control
Access to the Social Media Studio is restricted based on user roles:

### Allowed Roles:
- `admin` - Full access to all features
- `hotel_manager` - Full access to all features
- `marketing_manager` - Full access to all features
- `agency` - Full access to all features

### Access Control Implementation:
- Roles are checked using the `checkSocialMediaAccess()` function from `/src/lib/config.ts`
- Unauthorized users are redirected to the dashboard with an error toast
- The feature card on the dashboard is only shown to users with appropriate roles

## Feature Flag
The Social Media Studio can be enabled/disabled using a feature flag:

```typescript
// In src/lib/config.ts
export const features = {
  socialMedia: true, // Set to false to disable
  // ... other features
};
```

When disabled:
- The feature card is hidden from the dashboard
- All social media routes are blocked
- Users cannot access any social media functionality

## State Management
The Social Media Studio uses Zustand for state management with the following store structure:

### Store Location: `src/stores/social-media-store.ts`

### Data Structures:
- **Brand Kits**: Logo, colors, fonts, brand voice settings
- **Social Accounts**: Connected platform accounts (Instagram, Facebook, LinkedIn, Twitter, TikTok)
- **Content**: Posts, stories, reels with scheduling and status tracking
- **Analytics**: Performance metrics and engagement data

### Key Actions:
- `fetchAccounts()` - Load connected social media accounts
- `fetchBrandKits()` - Load brand kit configurations
- `fetchContent()` - Load content posts and schedules
- `createContent()` - Create new social media content
- `scheduleContent()` - Schedule content for publishing
- `seedDemoData()` - Initialize with demo data for first-time users
- `resetDemoData()` - Reset and re-seed demo data

## Demo Data Seeding
The system automatically seeds demo data on first visit including:

### Demo Brand Kit:
- Primary colors: Blue theme (#1d4ed8, #0ea5e9)
- Fonts: Inter and Playfair Display
- Brand voice: "Boutique Luxury" with sophisticated tone
- Sample logo placeholder

### Demo Accounts:
- Instagram (@yourhotel) - Not connected
- Facebook (Your Hotel Page) - Not connected  
- LinkedIn (Your Hotel Company) - Not connected

### Demo Content:
- 6 sample posts across different platforms
- Mix of draft, scheduled, and published status
- Variety of content types (posts, reels, stories)
- Realistic hotel industry content and hashtags

## Persistence
State is persisted using Zustand's persist middleware with:
- **Storage Key**: `sm:social-media-store`
- **Persisted Data**: accounts, brandKits, content, currentBrandKit
- **Storage**: localStorage (automatically handles serialization)

## Development Features
### Reset Demo Data
A "Reset Demo Data" button is available in the dashboard for development purposes to:
- Clear all existing data
- Re-seed fresh demo data
- Useful for testing and demonstrations

## Extension Guide
To extend the Social Media Studio:

### Adding New Routes:
1. Create component in `src/components/social-media/`
2. Add route in `src/App.tsx` under social media routes section
3. Wrap with `<ProtectedSocialMediaRoute>` for role protection
4. Add navigation links in relevant components

### Adding New Platforms:
1. Update platform types in `src/stores/social-media-store.ts`
2. Add platform icons and styling in components
3. Update demo data seeding to include new platform
4. Add integration logic in IntegrationHub component

### Modifying Access Control:
1. Update `rolePermissions.socialMedia` array in `src/lib/config.ts`
2. Roles are checked automatically by `ProtectedSocialMediaRoute`
3. Dashboard feature card visibility updates automatically

### Adding Features:
1. Add new feature flags to `src/lib/config.ts`
2. Create corresponding permission arrays
3. Use `hasFeatureAccess()` helper for conditional rendering
4. Update demo data and store actions as needed

## Security Considerations
- All routes are protected by role-based access control
- Feature flags provide additional control over functionality
- User roles are validated on every route access
- Unauthorized access attempts show user-friendly error messages
- State persistence only includes non-sensitive data

## Performance Optimizations
- Lazy loading of social media routes
- Persisted state reduces API calls on page refresh
- Demo data seeding only occurs when no data exists
- Selective state updates to minimize re-renders
