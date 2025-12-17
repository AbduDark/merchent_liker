# Design Guidelines: Campaign Management Platform for Merchants

## Design Approach
**Hybrid System**: Linear's clean minimalism + Material Design components + Stripe's professional restraint, optimized for RTL Arabic interface.

**Core Principle**: Trust and efficiency. Merchants need confidence in security (encrypted accounts) and clarity in campaign performance.

---

## Typography System

**Font Family**: 
- Primary: 'Cairo' (Google Fonts - excellent Arabic support)
- Fallback: system-ui, sans-serif

**Hierarchy**:
- Page Titles: 32px/2xl, bold (700)
- Section Headers: 24px/xl, semibold (600)
- Card Titles: 18px/lg, semibold (600)
- Body Text: 16px/base, regular (400)
- Captions/Labels: 14px/sm, medium (500)
- Small Text: 12px/xs, regular (400)

---

## Layout System

**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12
- Component padding: p-6
- Card spacing: p-8
- Section gaps: gap-6 or gap-8
- Small gaps: gap-3 or gap-4

**Grid Structure**:
- Sidebar: Fixed 280px on desktop (hidden on mobile)
- Main Content: flex-1 with max-w-7xl container
- Dashboard Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Campaign List: Single column for clarity

---

## Core Components

### Navigation
**Sidebar Navigation** (RTL-aware):
- Fixed right-side on desktop
- Collapsible hamburger on mobile
- Sections: Dashboard, Campaigns, Accounts, Billing, Settings
- Active state: Background highlight + border accent
- Icons from Heroicons (outline style)

### Dashboard Cards
**Stats Overview**:
- Three-column grid showing: Active Campaigns, Total Interactions, Subscription Usage
- Large numbers (3xl font) with trend indicators
- Subtle background with border

### Campaign Cards
**Campaign Display**:
- Post URL preview (truncated with tooltip)
- Progress bars for likes/comments (showing current vs target)
- Status badges (Active/Completed/Pending)
- Action buttons (View, Edit, Pause)
- Timestamp in Arabic format

### Account Management
**Account List**:
- Table layout with columns: Username, Status, Last Used, Actions
- Status indicators (Active/Inactive) with dot + text
- Encrypted password indicator (••••••••)
- Add Account button (prominent)

### Forms
**Campaign Creation Form**:
- Large text input for post URL
- Number inputs for target likes/comments
- Account selector (multi-select checkboxes)
- Preview section showing estimated completion time
- Two-button layout: Cancel (ghost) + Create Campaign (primary)

**Account Addition Form**:
- Username and password fields
- Password visibility toggle
- Security notice (encryption badge)
- Test connection button before saving

### Data Visualization
**Progress Tracking**:
- Horizontal progress bars (rounded-full)
- Percentage completion text
- Live update indicators (subtle pulse animation only when active)

### Buttons
**Hierarchy**:
- Primary: Solid fill, medium weight text
- Secondary: Border outline, medium weight
- Ghost: No background, hover state only
- Danger: For delete/cancel actions

**Sizes**: 
- Large (h-12): CTA buttons
- Medium (h-10): Standard forms
- Small (h-8): Inline actions

### Status Badges
- Rounded-full shape with px-3 py-1
- Background with matching text
- Sizes: text-xs to text-sm

### Tables
- Striped rows for readability
- Hover state on rows
- Sticky header on scroll
- Responsive: Convert to cards on mobile

---

## Page-Specific Layouts

### Login/Register Pages
- Centered card (max-w-md)
- Logo at top
- Form fields with clear labels
- Remember me checkbox
- Forgot password link (subtle)
- Switch between login/register (tab-like)

### Dashboard Home
- Stats cards row (3 columns)
- Recent campaigns section
- Quick actions panel
- Subscription status widget

### Campaigns Page
- Filter bar (Status, Date range)
- Create Campaign button (top-right in RTL)
- Campaign cards list
- Pagination at bottom

### Accounts Page
- Add Account button (prominent)
- Accounts table/grid
- Bulk actions (select multiple)

### Settings Page
- Tabbed sections (Profile, Billing, Notifications, Security)
- Single-column form layout (max-w-2xl)

---

## RTL Considerations
- All layouts flip horizontally
- Sidebar on right side
- Text alignment: right
- Icons position: right side of text
- Progress bars: fill from right to left
- Numeric inputs: Left-align numbers, right-align labels

---

## Interactions
**Minimal Animations**:
- Button hover: Subtle brightness change
- Card hover: Slight elevation (shadow increase)
- Loading states: Skeleton screens
- No page transitions or scroll animations

---

## Images
**No hero images** - This is a dashboard application focused on data and functionality.

**Icon Usage**:
- Heroicons (outline) via CDN
- Consistent 24px size
- Positioned to right of text in RTL

---

## Accessibility
- Clear focus states (ring-2 with offset)
- High contrast text (WCAG AA minimum)
- Form labels always visible
- Error messages inline with red accent
- Screen reader text for status indicators
- Keyboard navigation throughout