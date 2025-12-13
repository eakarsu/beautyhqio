# Beauty & Wellness AI - Complete Implementation Prompt

## Project Overview

Build a complete, production-ready Beauty & Wellness AI salon/spa management system. This is a full-stack web application for hair salons, barbershops, nail salons, spas, and wellness centers that includes client management, appointment booking, point of sale, staff management, inventory, loyalty programs, marketing, and AI-powered features like Multi-Language Voice Receptionist, No-Show Predictor, and Style Recommender.

**Market Size:** 285,000+ locations (Hair Salon, Nail Salon, Spa, Barbershop)

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes, Prisma ORM 5.22.0
- **Database**: PostgreSQL (already running locally, no Docker)
- **Authentication**: NextAuth.js with credentials provider
- **AI**: OpenAI GPT-4 for style recommendations, conversation
- **Voice**: Twilio for multi-language voice AI, ElevenLabs for TTS
- **Payments**: Stripe/Square for POS, tip handling
- **Email/SMS**: Twilio for SMS, Nodemailer for email
- **File Storage**: Local filesystem or AWS S3 for photos

## Key Considerations

- **Multi-language Support**: Vietnamese, Korean, Spanish, Chinese (critical for nail salons)
- **Walk-in Management**: Queue system for walk-in customers
- **Tip Handling**: Tip processing and distribution to staff
- **Visual Portfolio**: Before/after photos for clients
- **Social Integration**: Instagram, Facebook booking links

---

## Complete Feature Set

### Non-AI Features

#### Client Management
- [ ] Client profiles
- [ ] Contact information
- [ ] Service history
- [ ] Product purchase history
- [ ] Preferences & notes
- [ ] Allergies/sensitivities
- [ ] Before/after photos
- [ ] Birthday tracking
- [ ] Referral source tracking
- [ ] Family linking
- [ ] Multi-language support (EN, ES, VI, ZH, KO)

#### Appointment System
- [ ] Online booking (website widget)
- [ ] Mobile booking app
- [ ] Walk-in queue management
- [ ] Multi-service booking
- [ ] Group appointments
- [ ] Recurring appointments
- [ ] Appointment reminders (SMS/Email)
- [ ] Confirmation requests
- [ ] Waitlist management
- [ ] No-show tracking & fees
- [ ] Cancellation policies
- [ ] Buffer time between appointments

#### Service Management
- [ ] Service catalog with categories
- [ ] Service duration settings
- [ ] Pricing tiers (by technician level)
- [ ] Add-on services
- [ ] Package deals
- [ ] Membership plans
- [ ] Service images

#### Staff Management
- [ ] Staff profiles & photos
- [ ] Skills/certifications
- [ ] Working schedules
- [ ] Time-off requests
- [ ] Commission structures
- [ ] Tip tracking
- [ ] Performance metrics
- [ ] Chair/station assignment

#### Point of Sale
- [ ] Checkout process
- [ ] Multiple payment methods
- [ ] Split payments
- [ ] Tips processing
- [ ] Gift card sales & redemption
- [ ] Product sales
- [ ] Receipt printing/emailing
- [ ] Daily close-out

#### Inventory Management
- [ ] Product catalog
- [ ] Stock levels
- [ ] Low stock alerts
- [ ] Purchase orders
- [ ] Vendor management
- [ ] Cost tracking
- [ ] Backbar vs retail tracking

#### Loyalty Program
- [ ] Points earning rules
- [ ] Tier system (Bronze, Silver, Gold, Platinum)
- [ ] Points redemption
- [ ] Referral rewards
- [ ] Birthday rewards
- [ ] Transaction history

#### Marketing & Campaigns
- [ ] Email campaigns
- [ ] SMS campaigns
- [ ] Birthday automation
- [ ] No-show recovery
- [ ] Re-engagement campaigns
- [ ] Special offers
- [ ] Review requests

#### Reporting & Analytics
- [ ] Revenue reports
- [ ] Staff performance
- [ ] Service popularity
- [ ] Client retention rates
- [ ] No-show rates
- [ ] Product sales reports
- [ ] Commission reports
- [ ] Tip reports

#### Kiosk Mode
- [ ] Self check-in
- [ ] Service selection
- [ ] Waitlist sign-up
- [ ] Payment processing

---

### Salesforce-Style CRM Features

#### Activity Timeline/Feed
- [ ] Unified view of all activities (emails, calls, appointments, notes) in chronological order
- [ ] Activity filtering by type
- [ ] Quick action buttons

#### Notes & Attachments
- [ ] File attachments to client records
- [ ] Rich text notes
- [ ] Document management
- [ ] Consent form storage

#### Advanced Search & Filters
- [ ] Global search across all records
- [ ] Saved filters/views
- [ ] Advanced filter criteria
- [ ] Recent items history

#### Email Integration
- [ ] Direct email sending from within client records
- [ ] Email tracking (opens, clicks)
- [ ] Email synchronization with Gmail/Outlook
- [ ] Email templates

#### Calendar Integration
- [ ] Sync with Google Calendar/Outlook
- [ ] Drag-and-drop scheduling
- [ ] Meeting scheduling links
- [ ] Multi-staff calendar view

#### Reporting & Dashboards
- [ ] Interactive dashboards with widgets
- [ ] Custom report builder
- [ ] Charts and visualizations
- [ ] Report scheduling
- [ ] Export to PDF/Excel

#### Workflow Automation
- [ ] Automated task creation based on triggers
- [ ] Email alerts and notifications
- [ ] Field updates on status changes
- [ ] Approval processes for discounts/refunds

#### Client Assignment & Routing
- [ ] Automatic client assignment rules
- [ ] Round-robin distribution for walk-ins
- [ ] Preferred stylist matching

#### Duplicate Detection
- [ ] Duplicate client detection
- [ ] Merge functionality
- [ ] Phone/email deduplication

#### User Management
- [ ] Role-based permissions (Owner, Manager, Receptionist, Staff)
- [ ] Team hierarchies
- [ ] Sharing rules
- [ ] Feature access control

#### Import/Export
- [ ] CSV import with field mapping
- [ ] Bulk operations
- [ ] Data export functionality
- [ ] Client data migration tools

#### Audit Trail
- [ ] Field history tracking
- [ ] Who changed what and when
- [ ] Complete activity log

#### Mass Actions
- [ ] Bulk SMS/email
- [ ] Mass update client tags
- [ ] Bulk appointment rescheduling

---

### AI Features

- [ ] **AI Booking Assistant** - Natural language booking via chat
- [ ] **AI Voice Receptionist** - Phone call handling 24/7 (multi-language: EN, ES, VI, ZH, KO)
- [ ] **AI No-Show Predictor** - Flag risky appointments with risk factors
- [ ] **AI Message Generator** - Personalized marketing messages
- [ ] **AI Appointment Optimizer** - Smart scheduling to reduce gaps
- [ ] **AI Style Recommender** - Suggest styles based on face shape/preferences
- [ ] **AI Upsell Suggestions** - Recommend add-on services
- [ ] **AI Review Response** - Generate professional review replies
- [ ] **AI Reactivation Campaigns** - Target inactive clients
- [ ] **AI Staff Matcher** - Match client preferences to staff
- [ ] **AI Inventory Forecasting** - Predict product needs
- [ ] **AI Price Optimizer** - Dynamic pricing suggestions
- [ ] **AI Social Media Generator** - Create posts from before/after photos
- [ ] **AI Translation** - Real-time message translation

---

### Integrations

- [ ] Payment processors (Stripe, Square)
- [ ] Google Calendar
- [ ] Google Business Profile
- [ ] Facebook/Instagram
- [ ] Yelp
- [ ] Twilio (SMS/Voice)
- [ ] Mailchimp/SendGrid
- [ ] QuickBooks
- [ ] Gmail/Outlook

---

## Project Structure

```
beauty-wellness-ai/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (Dashboard)
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx (Client List)
│   │   │   │   ├── [id]/page.tsx (Client Profile)
│   │   │   │   └── new/page.tsx (New Client)
│   │   │   ├── calendar/
│   │   │   │   ├── page.tsx (Calendar View)
│   │   │   │   └── waitlist/page.tsx
│   │   │   ├── appointments/
│   │   │   │   ├── page.tsx (Appointment List)
│   │   │   │   └── [id]/page.tsx (Appointment Detail)
│   │   │   ├── pos/
│   │   │   │   ├── page.tsx (Point of Sale)
│   │   │   │   └── checkout/[id]/page.tsx
│   │   │   ├── staff/
│   │   │   │   ├── page.tsx (Staff List)
│   │   │   │   ├── [id]/page.tsx (Staff Profile)
│   │   │   │   └── schedule/page.tsx
│   │   │   ├── services/
│   │   │   │   └── page.tsx (Service Menu)
│   │   │   ├── products/
│   │   │   │   ├── page.tsx (Product Inventory)
│   │   │   │   └── orders/page.tsx
│   │   │   ├── loyalty/
│   │   │   │   ├── page.tsx (Loyalty Program)
│   │   │   │   └── rewards/page.tsx
│   │   │   ├── marketing/
│   │   │   │   ├── page.tsx (Campaigns)
│   │   │   │   └── reviews/page.tsx
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx (Reports Dashboard)
│   │   │   │   └── builder/page.tsx (Custom Report Builder)
│   │   │   ├── ai/
│   │   │   │   ├── voice/page.tsx
│   │   │   │   ├── no-show/page.tsx
│   │   │   │   └── style/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       ├── booking/page.tsx
│   │   │       ├── payments/page.tsx
│   │   │       ├── notifications/page.tsx
│   │   │       ├── users/page.tsx (User Management)
│   │   │       ├── roles/page.tsx (Role Permissions)
│   │   │       ├── import/page.tsx (Data Import)
│   │   │       ├── export/page.tsx (Data Export)
│   │   │       └── automations/page.tsx (Workflow Automation)
│   │   ├── book/ (Online Booking Widget)
│   │   │   ├── page.tsx
│   │   │   ├── [locationId]/page.tsx
│   │   │   ├── services/page.tsx
│   │   │   ├── provider/page.tsx
│   │   │   ├── time/page.tsx
│   │   │   └── confirm/page.tsx
│   │   ├── kiosk/ (Self-Service Kiosk)
│   │   │   ├── page.tsx
│   │   │   ├── check-in/page.tsx
│   │   │   └── waitlist/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── clients/route.ts
│   │   │   ├── clients/[id]/route.ts
│   │   │   ├── clients/[id]/activities/route.ts
│   │   │   ├── clients/[id]/notes/route.ts
│   │   │   ├── clients/[id]/attachments/route.ts
│   │   │   ├── clients/merge/route.ts
│   │   │   ├── clients/duplicates/route.ts
│   │   │   ├── appointments/route.ts
│   │   │   ├── appointments/[id]/route.ts
│   │   │   ├── waitlist/route.ts
│   │   │   ├── checkout/route.ts
│   │   │   ├── staff/route.ts
│   │   │   ├── staff/[id]/route.ts
│   │   │   ├── services/route.ts
│   │   │   ├── products/route.ts
│   │   │   ├── loyalty/route.ts
│   │   │   ├── gift-cards/route.ts
│   │   │   ├── marketing/route.ts
│   │   │   ├── reviews/route.ts
│   │   │   ├── reports/route.ts
│   │   │   ├── reports/builder/route.ts
│   │   │   ├── search/route.ts (Global Search)
│   │   │   ├── import/route.ts
│   │   │   ├── export/route.ts
│   │   │   ├── automations/route.ts
│   │   │   ├── audit/route.ts
│   │   │   ├── ai/
│   │   │   │   ├── voice/route.ts
│   │   │   │   ├── no-show-prediction/route.ts
│   │   │   │   ├── style-recommendation/route.ts
│   │   │   │   ├── message-generator/route.ts
│   │   │   │   ├── review-response/route.ts
│   │   │   │   └── translate/route.ts
│   │   │   ├── booking/
│   │   │   │   ├── availability/route.ts
│   │   │   │   └── create/route.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/route.ts
│   │   │   │   └── twilio/route.ts
│   │   │   └── integrations/
│   │   │       ├── google-calendar/route.ts
│   │   │       ├── quickbooks/route.ts
│   │   │       └── email/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── GlobalSearch.tsx
│   │   │   └── LanguageSwitcher.tsx
│   │   ├── clients/
│   │   │   ├── ClientCard.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   ├── ClientTable.tsx
│   │   │   ├── ClientHistory.tsx
│   │   │   ├── ServiceFormula.tsx
│   │   │   ├── PhotoGallery.tsx
│   │   │   ├── ActivityTimeline.tsx
│   │   │   ├── NotesPanel.tsx
│   │   │   ├── AttachmentsPanel.tsx
│   │   │   └── DuplicateDetector.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── AppointmentCard.tsx
│   │   │   ├── BookingModal.tsx
│   │   │   ├── WaitlistQueue.tsx
│   │   │   ├── TimeSlotPicker.tsx
│   │   │   └── DragDropScheduler.tsx
│   │   ├── pos/
│   │   │   ├── CheckoutPanel.tsx
│   │   │   ├── ServiceSelector.tsx
│   │   │   ├── ProductSelector.tsx
│   │   │   ├── TipSelector.tsx
│   │   │   ├── PaymentProcessor.tsx
│   │   │   └── ReceiptPrinter.tsx
│   │   ├── staff/
│   │   │   ├── StaffCard.tsx
│   │   │   ├── StaffForm.tsx
│   │   │   ├── ScheduleEditor.tsx
│   │   │   ├── CommissionReport.tsx
│   │   │   └── PerformanceMetrics.tsx
│   │   ├── loyalty/
│   │   │   ├── LoyaltyCard.tsx
│   │   │   ├── PointsHistory.tsx
│   │   │   ├── RewardRedemption.tsx
│   │   │   └── ReferralTracker.tsx
│   │   ├── booking/
│   │   │   ├── BookingWidget.tsx
│   │   │   ├── ServicePicker.tsx
│   │   │   ├── ProviderPicker.tsx
│   │   │   └── ConfirmationPage.tsx
│   │   ├── reports/
│   │   │   ├── DashboardWidgets.tsx
│   │   │   ├── ReportBuilder.tsx
│   │   │   ├── ChartComponents.tsx
│   │   │   └── ExportOptions.tsx
│   │   ├── automations/
│   │   │   ├── WorkflowBuilder.tsx
│   │   │   ├── TriggerConfig.tsx
│   │   │   └── ActionConfig.tsx
│   │   ├── kiosk/
│   │   │   ├── KioskLayout.tsx
│   │   │   ├── CheckInFlow.tsx
│   │   │   └── WaitlistSignup.tsx
│   │   └── ai/
│   │       ├── VoiceReceptionist.tsx
│   │       ├── NoShowPredictor.tsx
│   │       ├── StyleRecommender.tsx
│   │       ├── MessageGenerator.tsx
│   │       └── ReviewResponseGenerator.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   ├── ai.ts
│   │   ├── stripe.ts
│   │   ├── twilio.ts
│   │   ├── i18n.ts
│   │   ├── email.ts
│   │   ├── search.ts
│   │   ├── audit.ts
│   │   ├── automations.ts
│   │   └── permissions.ts
│   ├── locales/
│   │   ├── en.json
│   │   ├── es.json
│   │   ├── vi.json
│   │   ├── ko.json
│   │   └── zh.json
│   └── types/
│       └── index.ts
├── public/
├── uploads/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── start.sh
```

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ BUSINESS & LOCATIONS ============

model Business {
  id            String    @id @default(cuid())
  name          String
  type          BusinessType
  phone         String?
  email         String?
  website       String?
  logo          String?
  timezone      String    @default("America/New_York")
  defaultLanguage String  @default("en")
  supportedLanguages String[] @default(["en"])

  // Social
  instagram     String?
  facebook      String?
  tiktok        String?
  yelp          String?
  googleBusiness String?

  // Tax
  taxRate       Decimal   @db.Decimal(5, 4) @default(0)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  locations     Location[]
  users         User[]
  services      Service[]
  serviceCategories ServiceCategory[]
  products      Product[]
  productCategories ProductCategory[]
  loyaltyProgram LoyaltyProgram?
  giftCards     GiftCard[]
  campaigns     Campaign[]
  automations   Automation[]
  savedFilters  SavedFilter[]
}

enum BusinessType {
  HAIR_SALON
  BARBERSHOP
  NAIL_SALON
  SPA
  MASSAGE
  LASH_BROW
  WAXING
  TANNING
  MAKEUP
  WELLNESS
  MULTI_SERVICE
}

model Location {
  id            String    @id @default(cuid())
  name          String
  phone         String?
  email         String?

  // Address
  address       String
  address2      String?
  city          String
  state         String
  zip           String
  country       String    @default("USA")

  // Coordinates (for map)
  latitude      Decimal?  @db.Decimal(10, 7)
  longitude     Decimal?  @db.Decimal(10, 7)

  // Hours (JSON for flexibility)
  operatingHours Json?

  // Booking settings
  allowOnlineBooking Boolean @default(true)
  bookingUrl    String?
  advanceBookingDays Int   @default(30)
  cancellationHours Int    @default(24)

  isActive      Boolean   @default(true)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  business      Business  @relation(fields: [businessId], references: [id])
  businessId    String
  staff         Staff[]
  appointments  Appointment[]
  waitlist      WaitlistEntry[]
  transactions  Transaction[]
}

// ============ USERS & STAFF ============

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  firstName     String
  lastName      String
  phone         String?
  role          UserRole
  language      String    @default("en")
  avatar        String?
  isActive      Boolean   @default(true)

  // Permissions (JSON for flexibility)
  permissions   Json?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  business      Business  @relation(fields: [businessId], references: [id])
  businessId    String
  staff         Staff?
  auditLogs     AuditLog[]
  savedFilters  SavedFilter[]
}

enum UserRole {
  OWNER
  MANAGER
  RECEPTIONIST
  STAFF
}

model Staff {
  id            String    @id @default(cuid())
  displayName   String?
  title         String?   // Stylist, Nail Tech, Esthetician, etc.
  bio           String?
  color         String?   // For calendar display
  photo         String?

  // Skills
  specialties   String[]
  serviceIds    String[]  // Services they can perform

  // Employment
  employmentType EmploymentType @default(EMPLOYEE)
  hireDate      DateTime?

  // Compensation (for employees)
  payType       PayType?
  hourlyRate    Decimal?  @db.Decimal(10, 2)
  commissionPct Decimal?  @db.Decimal(5, 2)
  productCommissionPct Decimal? @db.Decimal(5, 2)

  // For booth renters
  boothRent     Decimal?  @db.Decimal(10, 2)
  rentFrequency String?   // weekly, monthly

  // Performance metrics (cached)
  avgRating     Decimal?  @db.Decimal(3, 2)
  reviewCount   Int       @default(0)
  rebookRate    Decimal?  @db.Decimal(5, 2)

  isActive      Boolean   @default(true)
  acceptsWalkIns Boolean  @default(true)
  isBookableOnline Boolean @default(true)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id])
  userId        String    @unique
  location      Location  @relation(fields: [locationId], references: [id])
  locationId    String
  schedules     StaffSchedule[]
  timeOff       TimeOff[]
  appointments  Appointment[]
  transactions  Transaction[]
  tips          Tip[]
  commissions   Commission[]
}

enum EmploymentType {
  EMPLOYEE
  BOOTH_RENTER
  CONTRACTOR
}

enum PayType {
  HOURLY
  COMMISSION
  SALARY
  HYBRID
}

model StaffSchedule {
  id            String    @id @default(cuid())
  dayOfWeek     Int       // 0-6 (Sunday-Saturday)
  startTime     String    // HH:MM
  endTime       String
  breakStart    String?
  breakEnd      String?
  isWorking     Boolean   @default(true)

  staff         Staff     @relation(fields: [staffId], references: [id])
  staffId       String

  @@unique([staffId, dayOfWeek])
}

model TimeOff {
  id            String    @id @default(cuid())
  type          String    // Vacation, Sick, Personal, etc.
  startDate     DateTime
  endDate       DateTime
  allDay        Boolean   @default(true)
  startTime     String?
  endTime       String?
  notes         String?
  status        String    @default("approved")

  createdAt     DateTime  @default(now())

  staff         Staff     @relation(fields: [staffId], references: [id])
  staffId       String
}

// ============ CLIENTS ============

model Client {
  id            String        @id @default(cuid())
  firstName     String
  lastName      String
  email         String?
  phone         String
  mobile        String?

  // Preferences
  preferredLanguage String?  @default("en")
  preferredStaffId String?
  preferredContactMethod String? @default("sms")

  // Birthday for promotions
  birthday      DateTime?
  birthdayMonth Int?
  birthdayDay   Int?

  // Marketing
  allowSms      Boolean       @default(true)
  allowEmail    Boolean       @default(true)
  referralSource String?
  referredById  String?

  // Notes
  notes         String?
  internalNotes String?       // Not shown to client

  // Tags for segmentation
  tags          String[]

  // Status
  status        ClientStatus  @default(ACTIVE)

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations (no businessId - clients are global)
  appointments  Appointment[]
  photos        ClientPhoto[]
  formulas      ServiceFormula[]
  preferences   ClientPreference[]
  loyaltyAccount LoyaltyAccount?
  giftCards     GiftCard[]    @relation("GiftCardOwner")
  purchasedGiftCards GiftCard[] @relation("GiftCardPurchaser")
  transactions  Transaction[]
  reviews       Review[]
  referrals     Referral[]    @relation("Referrer")
  referredBy    Referral?     @relation("Referred")
  communications Communication[]
  waitlistEntries WaitlistEntry[]
  activities    Activity[]
  clientNotes   ClientNote[]
  attachments   Attachment[]
}

enum ClientStatus {
  ACTIVE
  INACTIVE
  VIP
  BLOCKED
}

model ClientPhoto {
  id            String    @id @default(cuid())
  type          PhotoType @default(AFTER)
  filePath      String
  caption       String?
  serviceDate   DateTime?
  isPortfolio   Boolean   @default(false) // Can show in portfolio
  takenAt       DateTime  @default(now())

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
  appointment   Appointment? @relation(fields: [appointmentId], references: [id])
  appointmentId String?
}

enum PhotoType {
  BEFORE
  AFTER
  INSPIRATION
  RESULT
}

model ServiceFormula {
  id            String    @id @default(cuid())
  serviceType   String    // Hair Color, Highlights, Perm, etc.
  formula       String    // The actual formula/notes
  notes         String?
  lastUsed      DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
}

model ClientPreference {
  id            String    @id @default(cuid())
  category      String    // Pressure, Temperature, Music, Drinks, etc.
  value         String
  notes         String?

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String

  @@unique([clientId, category])
}

// ============ ACTIVITY TIMELINE ============

model Activity {
  id            String    @id @default(cuid())
  type          ActivityType
  title         String
  description   String?
  metadata      Json?     // Additional data based on type

  createdAt     DateTime  @default(now())

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
  userId        String?   // Who performed the activity
}

enum ActivityType {
  APPOINTMENT_BOOKED
  APPOINTMENT_COMPLETED
  APPOINTMENT_CANCELLED
  APPOINTMENT_NO_SHOW
  PURCHASE
  LOYALTY_EARNED
  LOYALTY_REDEEMED
  EMAIL_SENT
  SMS_SENT
  CALL_LOGGED
  NOTE_ADDED
  PHOTO_ADDED
  REVIEW_RECEIVED
  PROFILE_UPDATED
  REFERRAL_MADE
  GIFT_CARD_PURCHASED
  GIFT_CARD_REDEEMED
}

model ClientNote {
  id            String    @id @default(cuid())
  content       String
  isPinned      Boolean   @default(false)
  isPrivate     Boolean   @default(false)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
  createdById   String    // User who created the note
}

model Attachment {
  id            String    @id @default(cuid())
  fileName      String
  fileType      String
  fileSize      Int
  filePath      String
  description   String?

  createdAt     DateTime  @default(now())

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
  uploadedById  String    // User who uploaded
}

// ============ SERVICES ============

model ServiceCategory {
  id            String    @id @default(cuid())
  name          String
  description   String?
  sortOrder     Int       @default(0)
  color         String?
  icon          String?
  isActive      Boolean   @default(true)

  business      Business  @relation(fields: [businessId], references: [id])
  businessId    String
  services      Service[]

  @@unique([businessId, name])
}

model Service {
  id            String    @id @default(cuid())
  name          String
  description   String?
  duration      Int       // minutes
  price         Decimal   @db.Decimal(10, 2)
  priceType     PriceType @default(FIXED)
  priceFrom     Decimal?  @db.Decimal(10, 2) // For "from $X" pricing

  // Display
  color         String?
  image         String?
  sortOrder     Int       @default(0)

  // Booking settings
  allowOnline   Boolean   @default(true)
  requireDeposit Boolean  @default(false)
  depositAmount Decimal?  @db.Decimal(10, 2)
  depositPercent Decimal? @db.Decimal(5, 2)

  // Capacity
  canDoubleBook Boolean   @default(false) // For services like nails
  maxConcurrent Int       @default(1)

  // Processing/Drying time (client waits but staff available)
  processingTime Int?     // minutes

  isActive      Boolean   @default(true)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  business      Business  @relation(fields: [businessId], references: [id])
  businessId    String
  category      ServiceCategory? @relation(fields: [categoryId], references: [id])
  categoryId    String?
  addOns        ServiceAddOn[]
  appointmentServices AppointmentService[]

  @@unique([businessId, name])
}

enum PriceType {
  FIXED
  STARTING_AT
  VARIABLE
  CONSULTATION
}

model ServiceAddOn {
  id            String    @id @default(cuid())
  name          String
  description   String?
  duration      Int       // additional minutes
  price         Decimal   @db.Decimal(10, 2)
  isActive      Boolean   @default(true)

  service       Service   @relation(fields: [serviceId], references: [id])
  serviceId     String
  appointmentAddOns AppointmentAddOn[]
}

// ============ APPOINTMENTS ============

model Appointment {
  id            String            @id @default(cuid())
  status        AppointmentStatus @default(BOOKED)

  // Timing
  scheduledStart DateTime
  scheduledEnd  DateTime
  actualStart   DateTime?
  actualEnd     DateTime?

  // Check-in
  checkedInAt   DateTime?
  checkedOutAt  DateTime?

  // Client info (for walk-ins without client record)
  clientName    String?
  clientPhone   String?
  clientEmail   String?

  // Booking source
  source        BookingSource     @default(PHONE)

  // Notes
  notes         String?
  internalNotes String?

  // Confirmation
  isConfirmed   Boolean           @default(false)
  confirmedAt   DateTime?
  confirmationSent Boolean        @default(false)

  // Reminders
  reminderSent  Boolean           @default(false)
  reminderSentAt DateTime?

  // No-show prediction
  noShowRisk    Decimal?          @db.Decimal(5, 2)

  // Deposit
  depositPaid   Decimal?          @db.Decimal(10, 2)
  depositPaidAt DateTime?

  // Recurrence
  isRecurring   Boolean           @default(false)
  recurrenceRule String?
  parentAppointmentId String?

  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  // Relations
  client        Client?           @relation(fields: [clientId], references: [id])
  clientId      String?
  staff         Staff             @relation(fields: [staffId], references: [id])
  staffId       String
  location      Location          @relation(fields: [locationId], references: [id])
  locationId    String
  services      AppointmentService[]
  photos        ClientPhoto[]
  transaction   Transaction?
}

enum AppointmentStatus {
  BOOKED
  CONFIRMED
  CHECKED_IN
  IN_SERVICE
  COMPLETED
  CANCELLED
  NO_SHOW
  RESCHEDULED
}

enum BookingSource {
  ONLINE
  PHONE
  WALK_IN
  APP
  INSTAGRAM
  FACEBOOK
  REFERRAL
  KIOSK
  AI_VOICE
}

model AppointmentService {
  id            String    @id @default(cuid())
  price         Decimal   @db.Decimal(10, 2)
  duration      Int       // minutes
  notes         String?

  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  appointmentId String
  service       Service   @relation(fields: [serviceId], references: [id])
  serviceId     String
  addOns        AppointmentAddOn[]
}

model AppointmentAddOn {
  id            String    @id @default(cuid())
  price         Decimal   @db.Decimal(10, 2)
  duration      Int

  appointmentService AppointmentService @relation(fields: [appointmentServiceId], references: [id])
  appointmentServiceId String
  addOn         ServiceAddOn @relation(fields: [addOnId], references: [id])
  addOnId       String
}

model WaitlistEntry {
  id            String    @id @default(cuid())
  position      Int
  estimatedWait Int?      // minutes
  status        WaitlistStatus @default(WAITING)

  // Service requested
  serviceNotes  String?
  estimatedDuration Int?

  addedAt       DateTime  @default(now())
  seatedAt      DateTime?
  leftAt        DateTime?

  // Contact for notification
  phone         String?
  notificationSent Boolean @default(false)

  client        Client?   @relation(fields: [clientId], references: [id])
  clientId      String?
  location      Location  @relation(fields: [locationId], references: [id])
  locationId    String
}

enum WaitlistStatus {
  WAITING
  NOTIFIED
  SEATED
  LEFT
  NO_SHOW
}

// ============ POINT OF SALE ============

model Transaction {
  id            String          @id @default(cuid())
  transactionNumber String      @unique
  type          TransactionType @default(SALE)
  status        TransactionStatus @default(COMPLETED)

  // Timing
  date          DateTime        @default(now())

  // Amounts
  subtotal      Decimal         @db.Decimal(10, 2)
  discountAmount Decimal        @db.Decimal(10, 2) @default(0)
  discountReason String?
  taxAmount     Decimal         @db.Decimal(10, 2) @default(0)
  tipAmount     Decimal         @db.Decimal(10, 2) @default(0)
  totalAmount   Decimal         @db.Decimal(10, 2)

  // Loyalty
  pointsEarned  Int             @default(0)
  pointsRedeemed Int            @default(0)

  notes         String?

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  // Relations
  client        Client?         @relation(fields: [clientId], references: [id])
  clientId      String?
  staff         Staff           @relation(fields: [staffId], references: [id])
  staffId       String
  location      Location        @relation(fields: [locationId], references: [id])
  locationId    String
  appointment   Appointment?    @relation(fields: [appointmentId], references: [id])
  appointmentId String?         @unique
  lineItems     TransactionLineItem[]
  payments      TransactionPayment[]
  tips          Tip[]
  commissions   Commission[]
}

enum TransactionType {
  SALE
  REFUND
  VOID
  ADJUSTMENT
}

enum TransactionStatus {
  PENDING
  COMPLETED
  REFUNDED
  VOIDED
}

model TransactionLineItem {
  id            String    @id @default(cuid())
  type          LineItemType
  name          String
  description   String?
  quantity      Int       @default(1)
  unitPrice     Decimal   @db.Decimal(10, 2)
  totalPrice    Decimal   @db.Decimal(10, 2)

  // Staff who performed service (may differ from transaction staff)
  performedById String?

  transaction   Transaction @relation(fields: [transactionId], references: [id])
  transactionId String
  service       Service?  @relation(fields: [serviceId], references: [id])
  serviceId     String?
  product       Product?  @relation(fields: [productId], references: [id])
  productId     String?
}

enum LineItemType {
  SERVICE
  PRODUCT
  GIFT_CARD
  PACKAGE
  OTHER
}

model TransactionPayment {
  id            String        @id @default(cuid())
  method        PaymentMethod
  amount        Decimal       @db.Decimal(10, 2)
  reference     String?       // Last 4 digits, check number, etc.

  // For card payments
  stripePaymentId String?

  // For gift card payments
  giftCardId    String?

  createdAt     DateTime      @default(now())

  transaction   Transaction   @relation(fields: [transactionId], references: [id])
  transactionId String
}

enum PaymentMethod {
  CASH
  CREDIT_CARD
  DEBIT_CARD
  GIFT_CARD
  PREPAID_PACKAGE
  POINTS
  APPLE_PAY
  GOOGLE_PAY
  OTHER
}

model Tip {
  id            String    @id @default(cuid())
  amount        Decimal   @db.Decimal(10, 2)
  method        PaymentMethod

  transaction   Transaction @relation(fields: [transactionId], references: [id])
  transactionId String
  staff         Staff     @relation(fields: [staffId], references: [id])
  staffId       String
}

model Commission {
  id            String    @id @default(cuid())
  amount        Decimal   @db.Decimal(10, 2)
  type          String    // Service, Product, etc.
  rate          Decimal   @db.Decimal(5, 2)
  baseAmount    Decimal   @db.Decimal(10, 2)

  transaction   Transaction @relation(fields: [transactionId], references: [id])
  transactionId String
  staff         Staff     @relation(fields: [staffId], references: [id])
  staffId       String
}

// ============ PRODUCTS ============

model ProductCategory {
  id            String    @id @default(cuid())
  name          String
  description   String?
  sortOrder     Int       @default(0)
  isActive      Boolean   @default(true)

  business      Business  @relation(fields: [businessId], references: [id])
  businessId    String
  products      Product[]

  @@unique([businessId, name])
}

model Product {
  id            String    @id @default(cuid())
  sku           String?
  barcode       String?
  name          String
  description   String?
  brand         String?
  size          String?   // 8 oz, 300ml, etc.

  // Pricing
  cost          Decimal?  @db.Decimal(10, 2)
  price         Decimal   @db.Decimal(10, 2)

  // Inventory
  trackInventory Boolean  @default(true)
  quantityOnHand Int      @default(0)
  reorderLevel  Int       @default(0)
  reorderQuantity Int     @default(0)

  // Display
  image         String?
  sortOrder     Int       @default(0)

  isActive      Boolean   @default(true)
  isTaxable     Boolean   @default(true)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  business      Business  @relation(fields: [businessId], references: [id])
  businessId    String
  category      ProductCategory? @relation(fields: [categoryId], references: [id])
  categoryId    String?
  lineItems     TransactionLineItem[]
}

// ============ LOYALTY & GIFT CARDS ============

model LoyaltyProgram {
  id              String    @id @default(cuid())
  name            String
  isActive        Boolean   @default(true)

  // Earning rules
  pointsPerDollar Decimal   @db.Decimal(5, 2) @default(1)
  bonusOnSignup   Int       @default(0)
  bonusOnBirthday Int       @default(0)
  bonusOnReferral Int       @default(0)

  // Tiers (JSON array of tier definitions)
  tiers           Json?

  // Expiration
  pointsExpireMonths Int?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  business        Business  @relation(fields: [businessId], references: [id])
  businessId      String    @unique
  accounts        LoyaltyAccount[]
  rewards         LoyaltyReward[]
}

model LoyaltyAccount {
  id            String    @id @default(cuid())
  pointsBalance Int       @default(0)
  lifetimePoints Int      @default(0)
  tier          String    @default("Bronze")
  tierExpiresAt DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String    @unique
  program       LoyaltyProgram @relation(fields: [programId], references: [id])
  programId     String
  transactions  LoyaltyTransaction[]
}

model LoyaltyTransaction {
  id            String    @id @default(cuid())
  type          String    // earn, redeem, expire, adjust, bonus
  points        Int
  description   String?
  expiresAt     DateTime?

  createdAt     DateTime  @default(now())

  account       LoyaltyAccount @relation(fields: [accountId], references: [id])
  accountId     String
}

model LoyaltyReward {
  id            String    @id @default(cuid())
  name          String
  description   String?
  pointsCost    Int
  type          String    // discount_percent, discount_amount, free_service, free_product
  value         Decimal   @db.Decimal(10, 2)
  image         String?
  isActive      Boolean   @default(true)

  program       LoyaltyProgram @relation(fields: [programId], references: [id])
  programId     String
}

model GiftCard {
  id            String    @id @default(cuid())
  code          String    @unique
  initialBalance Decimal  @db.Decimal(10, 2)
  currentBalance Decimal  @db.Decimal(10, 2)
  expiresAt     DateTime?
  status        String    @default("active")

  purchasedAt   DateTime  @default(now())

  // Can be physical or digital
  isDigital     Boolean   @default(true)
  recipientEmail String?
  recipientName String?
  message       String?
  sentAt        DateTime?

  business      Business  @relation(fields: [businessId], references: [id])
  businessId    String
  purchasedBy   Client?   @relation("GiftCardPurchaser", fields: [purchasedById], references: [id])
  purchasedById String?
  owner         Client?   @relation("GiftCardOwner", fields: [ownerId], references: [id])
  ownerId       String?
  usageHistory  GiftCardUsage[]
}

model GiftCardUsage {
  id            String    @id @default(cuid())
  amount        Decimal   @db.Decimal(10, 2)
  balanceAfter  Decimal   @db.Decimal(10, 2)
  usedAt        DateTime  @default(now())

  giftCard      GiftCard  @relation(fields: [giftCardId], references: [id])
  giftCardId    String
}

// ============ REFERRALS ============

model Referral {
  id            String    @id @default(cuid())
  status        String    @default("pending") // pending, completed, rewarded

  // Rewards
  referrerReward String?  // $10 off, 100 points, etc.
  referredReward String?
  referrerRewarded Boolean @default(false)
  referredRewarded Boolean @default(false)

  createdAt     DateTime  @default(now())
  completedAt   DateTime?

  referrer      Client    @relation("Referrer", fields: [referrerId], references: [id])
  referrerId    String
  referred      Client    @relation("Referred", fields: [referredId], references: [id])
  referredId    String    @unique
}

// ============ MARKETING ============

model Campaign {
  id            String    @id @default(cuid())
  name          String
  type          CampaignType
  status        String    @default("draft")

  // Content
  subject       String?
  content       String
  image         String?

  // Targeting
  targetTags    String[]
  targetSegment String?   // all, new, inactive, birthday, etc.

  // Scheduling
  scheduledAt   DateTime?
  sentAt        DateTime?

  // Stats
  sentCount     Int       @default(0)
  openCount     Int       @default(0)
  clickCount    Int       @default(0)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  business      Business  @relation(fields: [businessId], references: [id])
  businessId    String
}

enum CampaignType {
  EMAIL
  SMS
  PUSH
}

model Review {
  id            String    @id @default(cuid())
  rating        Int       // 1-5
  comment       String?
  source        String    // Google, Yelp, Facebook, Internal
  isPublic      Boolean   @default(true)

  // Response
  response      String?
  respondedAt   DateTime?

  createdAt     DateTime  @default(now())

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
}

model Communication {
  id            String    @id @default(cuid())
  type          String    // sms, email, call
  direction     String    // inbound, outbound
  content       String?
  status        String    @default("sent")
  sentAt        DateTime  @default(now())

  // For email tracking
  openedAt      DateTime?
  clickedAt     DateTime?

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
}

// ============ WORKFLOW AUTOMATION ============

model Automation {
  id            String    @id @default(cuid())
  name          String
  description   String?
  isActive      Boolean   @default(true)

  // Trigger
  triggerType   String    // appointment_booked, appointment_completed, no_show, birthday, inactive_client, etc.
  triggerConfig Json?

  // Actions
  actions       Json      // Array of action definitions

  // Stats
  timesTriggered Int      @default(0)
  lastTriggered DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  business      Business  @relation(fields: [businessId], references: [id])
  businessId    String
}

// ============ AUDIT & SEARCH ============

model AuditLog {
  id            String    @id @default(cuid())
  action        String    // create, update, delete
  entityType    String    // Client, Appointment, Transaction, etc.
  entityId      String
  changes       Json?     // What changed

  createdAt     DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id])
  userId        String
}

model SavedFilter {
  id            String    @id @default(cuid())
  name          String
  entityType    String    // clients, appointments, transactions
  filters       Json      // Filter criteria
  isDefault     Boolean   @default(false)

  createdAt     DateTime  @default(now())

  user          User?     @relation(fields: [userId], references: [id])
  userId        String?
  business      Business? @relation(fields: [businessId], references: [id])
  businessId    String?
}
```

## Seed Data (prisma/seed.ts)

Create comprehensive seed data including:

1. **Business**: "Luxe Beauty Studio"

2. **Locations** (2 locations):
   - Main Salon - Downtown
   - Express Salon - Mall location

3. **Users** (8 users):
   - Maria Garcia (Owner)
   - Jennifer Kim (Manager)
   - Lisa Nguyen (Receptionist)
   - 5 Stylists/Technicians

4. **Staff** (5 staff members):
   - Sarah Johnson (Senior Stylist) - Hair Color Specialist
   - Ashley Williams (Stylist) - Cuts & Styling
   - Michelle Tran (Nail Technician) - Vietnamese speaking
   - David Chen (Barber) - Men's cuts
   - Emma Davis (Esthetician) - Facials & Waxing

5. **Service Categories** (6 categories):
   - Hair Services
   - Nail Services
   - Spa & Facial
   - Barbershop
   - Lash & Brow
   - Waxing

6. **Services** (30 services):
   - Women's Haircut ($45, 45 min)
   - Men's Haircut ($25, 30 min)
   - Full Color ($120, 120 min)
   - Highlights ($150, 150 min)
   - Manicure ($25, 30 min)
   - Pedicure ($40, 45 min)
   - Gel Manicure ($35, 45 min)
   - Facial ($85, 60 min)
   - Lash Extensions ($150, 90 min)
   - Brazilian Wax ($55, 30 min)
   - ... etc

7. **Service Add-Ons** (15 add-ons):
   - Deep Conditioning Treatment (+$25, 15 min)
   - Nail Art (+$10-$30)
   - Scalp Massage (+$15, 10 min)
   - ... etc

8. **Product Categories** (4 categories):
   - Hair Care
   - Nail Products
   - Skincare
   - Styling Tools

9. **Products** (20 products):
   - Shampoos, conditioners, styling products
   - With prices and inventory

10. **Clients** (50 clients):
    - Full profiles with preferences
    - Service formulas for hair clients
    - Loyalty accounts
    - Activity history

11. **Appointments** (100 appointments):
    - Past 30 days and next 30 days
    - Various statuses
    - Multiple services per appointment

12. **Transactions** (80 transactions):
    - With line items, tips, payments
    - Various payment methods

13. **Loyalty Program**:
    - 1 point per $1 spent
    - 100 bonus points on signup
    - 50 points on birthday
    - Tiers: Bronze (0), Silver (500), Gold (1000), Platinum (2000)

14. **Loyalty Rewards** (5 rewards):
    - $10 off any service (200 points)
    - Free add-on service (150 points)
    - 20% off products (300 points)
    - Free blowout (400 points)
    - Free manicure (500 points)

15. **Gift Cards** (10 gift cards):
    - Various amounts and balances

16. **Reviews** (30 reviews):
    - 4-5 star ratings mostly
    - Some with responses

17. **Automations** (5 sample automations):
    - Appointment reminder (24h before)
    - Post-visit thank you
    - Birthday special
    - No-show follow-up
    - Re-engagement for inactive clients

## API Endpoints

### Clients API (/api/clients)

```typescript
// GET /api/clients - List clients with search
// POST /api/clients - Create client
// GET /api/clients/[id] - Get client profile
// PUT /api/clients/[id] - Update client
// DELETE /api/clients/[id] - Delete client
// GET /api/clients/[id]/history - Get service history
// POST /api/clients/[id]/photos - Upload photos
// POST /api/clients/[id]/formula - Save formula
// GET /api/clients/[id]/activities - Get activity timeline
// POST /api/clients/[id]/notes - Add note
// GET /api/clients/[id]/notes - Get notes
// POST /api/clients/[id]/attachments - Upload attachment
// GET /api/clients/[id]/attachments - Get attachments
// GET /api/clients/duplicates - Find potential duplicates
// POST /api/clients/merge - Merge duplicate clients
```

### Appointments API (/api/appointments)

```typescript
// GET /api/appointments - List appointments by date
// POST /api/appointments - Create appointment
// GET /api/appointments/[id] - Get appointment details
// PUT /api/appointments/[id] - Update appointment
// POST /api/appointments/[id]/check-in - Check in client
// POST /api/appointments/[id]/complete - Complete appointment
// POST /api/appointments/[id]/cancel - Cancel appointment
// DELETE /api/appointments/[id] - Delete appointment
```

### Booking API (/api/booking/*)

```typescript
// GET /api/booking/availability - Get available slots
// POST /api/booking/create - Create online booking
// POST /api/booking/confirm - Confirm appointment
// GET /api/booking/services - Get bookable services
// GET /api/booking/staff - Get available staff
```

### Waitlist API (/api/waitlist)

```typescript
// GET /api/waitlist - Get current waitlist
// POST /api/waitlist - Add to waitlist
// PUT /api/waitlist/[id] - Update entry
// POST /api/waitlist/[id]/seat - Seat client
// DELETE /api/waitlist/[id] - Remove from waitlist
```

### Checkout API (/api/checkout)

```typescript
// POST /api/checkout - Process checkout
// POST /api/checkout/payment - Process payment
// POST /api/checkout/tip - Process tip
// GET /api/checkout/receipt/[id] - Get receipt
```

### Staff API (/api/staff)

```typescript
// GET /api/staff - List staff
// POST /api/staff - Create staff
// GET /api/staff/[id] - Get staff profile
// PUT /api/staff/[id] - Update staff
// GET /api/staff/[id]/schedule - Get schedule
// PUT /api/staff/[id]/schedule - Update schedule
// POST /api/staff/[id]/time-off - Request time off
// GET /api/staff/[id]/commissions - Get commissions
// GET /api/staff/[id]/performance - Get performance metrics
```

### Loyalty API (/api/loyalty)

```typescript
// GET /api/loyalty/account/[clientId] - Get loyalty account
// POST /api/loyalty/earn - Award points
// POST /api/loyalty/redeem - Redeem reward
// GET /api/loyalty/rewards - List available rewards
// GET /api/loyalty/transactions - Get points history
```

### Reports API (/api/reports)

```typescript
// GET /api/reports/revenue - Revenue reports
// GET /api/reports/staff-performance - Staff metrics
// GET /api/reports/services - Service popularity
// GET /api/reports/clients - Client analytics
// GET /api/reports/custom - Custom report builder
// POST /api/reports/export - Export report
```

### Search API (/api/search)

```typescript
// GET /api/search - Global search across all entities
// GET /api/search/clients - Search clients
// GET /api/search/appointments - Search appointments
```

### Automations API (/api/automations)

```typescript
// GET /api/automations - List automations
// POST /api/automations - Create automation
// PUT /api/automations/[id] - Update automation
// DELETE /api/automations/[id] - Delete automation
// POST /api/automations/[id]/test - Test automation
```

### Audit API (/api/audit)

```typescript
// GET /api/audit - Get audit logs
// GET /api/audit/[entityType]/[entityId] - Get entity history
```

### AI APIs (/api/ai/*)

```typescript
// POST /api/ai/voice/handle - Handle voice call
// POST /api/ai/no-show-prediction - Predict no-show risk
// POST /api/ai/style-recommendation - Get style suggestions
// POST /api/ai/message-generator - Generate marketing message
// POST /api/ai/review-response - Generate review response
// POST /api/ai/translate - Translate text
```

## UI Components

### Dashboard Page
- Today's appointments
- Revenue today/week/month
- Walk-in queue status
- Staff on duty
- Low inventory alerts
- Upcoming birthdays
- Reviews summary
- Quick actions

### Calendar Page
- Day/Week view
- Staff columns
- Color-coded services
- Drag to reschedule
- Click slot to book
- Walk-in queue panel
- Google Calendar sync indicator

### Client Profile Page
- Client info header
- Activity timeline
- Photo gallery
- Service formulas
- Visit history
- Loyalty points
- Notes section (pinnable)
- Attachments
- Preferences
- Quick actions (book, checkout, email, SMS)

### Point of Sale Page
- Service selector with staff
- Product selector with barcode
- Cart summary
- Discount application
- Tip selection (%, $, custom)
- Split payment
- Receipt options
- Loyalty points display

### Staff Page
- Staff list with photos
- Schedule overview
- Click for profile
- Performance metrics
- Commission summary

### Staff Profile Page
- Bio and photo
- Services offered
- Schedule editor
- Time-off requests
- Earnings report
- Performance charts

### Online Booking Widget (/book/*)
- Location selector
- Service picker
- Staff preference (or "Any")
- Date/time picker
- Client info form
- Confirmation + SMS

### Kiosk Mode (/kiosk/*)
- Large touch-friendly buttons
- Self check-in flow
- Walk-in sign-up
- Service selection
- Estimated wait time

### Reports Dashboard
- Interactive widgets
- Revenue charts
- Staff performance
- Service popularity
- Client retention
- Custom report builder
- Export options

### Automations Page
- Automation list
- Visual workflow builder
- Trigger configuration
- Action configuration
- Test functionality
- Run history

### Loyalty Dashboard
- Program settings
- Members list
- Points activity
- Reward redemptions
- Tier distribution

### Marketing Page
- Campaign list
- Email/SMS composer
- Audience targeting
- Campaign stats
- Review management

### AI Voice Dashboard
- Call logs
- Language stats
- Booking success rate
- Common requests
- Failed calls analysis

### AI No-Show Predictor
- High-risk appointments
- Risk factors breakdown
- Suggested actions
- Overbooking recommendations

### AI Style Recommender
- Photo upload
- Face shape analysis
- Style suggestions gallery
- Color recommendations
- Save to client profile

### Settings Pages
- Business settings
- Booking settings
- Payment settings
- Notification settings
- User management
- Role permissions
- Import/Export
- Integrations
- Automations

## Multi-Language Support

Implement i18n for:
- English (en)
- Spanish (es)
- Vietnamese (vi)
- Korean (ko)
- Chinese Simplified (zh)

Key areas:
- Voice AI responses
- Booking widget
- SMS notifications
- Client-facing content
- Kiosk interface

## start.sh Script

```bash
#!/bin/bash

echo "Starting Beauty & Wellness AI..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please update .env with your database credentials"
    exit 1
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed database
echo "Seeding database..."
npx prisma db seed 2>/dev/null || echo "Database may already be seeded"

# Start the development server
echo "Starting Next.js development server..."
npm run dev
```

## Environment Variables (.env.example)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/beauty_wellness_ai"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI (for AI features)
OPENAI_API_KEY="sk-..."

# ElevenLabs (for voice TTS)
ELEVENLABS_API_KEY="..."

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Twilio (for SMS/Voice)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1..."

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# File uploads
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"

# Google (for reviews and calendar integration)
GOOGLE_PLACES_API_KEY="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# QuickBooks (for accounting)
QUICKBOOKS_CLIENT_ID="..."
QUICKBOOKS_CLIENT_SECRET="..."
```

## Color Scheme

- Primary: Rose (#F43F5E)
- Secondary: Slate (#64748B)
- Success: Green (#22C55E)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)
- Background: White (#FFFFFF)
- Surface: Pink tint (#FFF1F2)
- Text: Slate (#0F172A)

## Implementation Priority

### Phase 1: Core Features
1. Authentication & User Management
2. Client Management with Activity Timeline
3. Service & Staff Setup
4. Basic Appointment Booking
5. Calendar View

### Phase 2: Operations
6. Point of Sale & Checkout
7. Waitlist Management
8. Inventory Management
9. Basic Reporting

### Phase 3: Engagement
10. Loyalty Program
11. Gift Cards
12. Email/SMS Campaigns
13. Review Management

### Phase 4: Advanced
14. Online Booking Widget
15. Kiosk Mode
16. Workflow Automation
17. Advanced Reporting

### Phase 5: AI Features
18. AI Voice Receptionist
19. AI No-Show Predictor
20. AI Style Recommender
21. AI Message Generator

### Phase 6: Integrations
22. Google Calendar Sync
23. QuickBooks Integration
24. Social Media Integration

---

Build this complete beauty & wellness application with all features working, multi-language voice AI, tip handling, loyalty program, Salesforce-style CRM features, and beautiful booking experience.
