-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('HAIR_SALON', 'BARBERSHOP', 'NAIL_SALON', 'SPA', 'MASSAGE', 'LASH_BROW', 'WAXING', 'TANNING', 'MAKEUP', 'WELLNESS', 'MULTI_SERVICE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'STAFF', 'CLIENT');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('EMPLOYEE', 'BOOTH_RENTER', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('HOURLY', 'COMMISSION', 'SALARY', 'HYBRID');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'VIP', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('BEFORE', 'AFTER', 'INSPIRATION', 'RESULT');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('APPOINTMENT_BOOKED', 'APPOINTMENT_COMPLETED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_NO_SHOW', 'PURCHASE', 'LOYALTY_EARNED', 'LOYALTY_REDEEMED', 'EMAIL_SENT', 'SMS_SENT', 'CALL_LOGGED', 'NOTE_ADDED', 'PHOTO_ADDED', 'REVIEW_RECEIVED', 'PROFILE_UPDATED', 'REFERRAL_MADE', 'GIFT_CARD_PURCHASED', 'GIFT_CARD_REDEEMED');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'STARTING_AT', 'VARIABLE', 'CONSULTATION');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('ONLINE', 'PHONE', 'WALK_IN', 'APP', 'INSTAGRAM', 'FACEBOOK', 'REFERRAL', 'KIOSK', 'AI_VOICE', 'MARKETPLACE');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'NOTIFIED', 'SEATED', 'LEFT', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'REFUND', 'VOID', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED', 'VOIDED');

-- CreateEnum
CREATE TYPE "LineItemType" AS ENUM ('SERVICE', 'PRODUCT', 'GIFT_CARD', 'PACKAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'GIFT_CARD', 'PREPAID_PACKAGE', 'POINTS', 'APPLE_PAY', 'GOOGLE_PAY', 'OTHER');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "IntegrationDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'RETRY', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('GOOGLE_MAPS', 'YELP', 'REFERRAL', 'WALK_IN', 'TRADE_SHOW', 'COLD_CALL', 'WEBSITE', 'SOCIAL_MEDIA', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_COMPLETED', 'TRIAL', 'NEGOTIATING', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'GROWTH', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIAL');

-- CreateEnum
CREATE TYPE "MarketplaceSource" AS ENUM ('MARKETPLACE_SEARCH', 'MARKETPLACE_BROWSE', 'GOOGLE_ORGANIC', 'FACEBOOK_ADS', 'INSTAGRAM_ADS', 'REFERRAL_LINK', 'DIRECT_LINK', 'EMAIL_CAMPAIGN');

-- CreateEnum
CREATE TYPE "LeadStatusType" AS ENUM ('NEW', 'VIEWED_PROFILE', 'STARTED_BOOKING', 'BOOKED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'PAST_DUE', 'VOID');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BusinessType" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "supportedLanguages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "instagram" TEXT,
    "facebook" TEXT,
    "tiktok" TEXT,
    "yelp" TEXT,
    "googleBusiness" TEXT,
    "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "operatingHours" JSONB,
    "allowOnlineBooking" BOOLEAN NOT NULL DEFAULT true,
    "bookingUrl" TEXT,
    "advanceBookingDays" INTEGER NOT NULL DEFAULT 30,
    "cancellationHours" INTEGER NOT NULL DEFAULT 24,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MobileSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "identityHash" TEXT NOT NULL,
    "succeeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "displayName" TEXT,
    "title" TEXT,
    "bio" TEXT,
    "color" TEXT,
    "photo" TEXT,
    "specialties" TEXT[],
    "serviceIds" TEXT[],
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'EMPLOYEE',
    "hireDate" TIMESTAMP(3),
    "payType" "PayType",
    "hourlyRate" DECIMAL(10,2),
    "commissionPct" DECIMAL(5,2),
    "productCommissionPct" DECIMAL(5,2),
    "boothRent" DECIMAL(10,2),
    "rentFrequency" TEXT,
    "avgRating" DECIMAL(3,2),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "rebookRate" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "acceptsWalkIns" BOOLEAN NOT NULL DEFAULT true,
    "isBookableOnline" BOOLEAN NOT NULL DEFAULT true,
    "googleCalendarToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleCalendarId" TEXT,
    "outlookCalendarToken" TEXT,
    "outlookRefreshToken" TEXT,
    "outlookCalendarId" TEXT,
    "outlookTokenExpiry" TIMESTAMP(3),
    "stripeAccountId" TEXT,
    "stripeAccountStatus" TEXT DEFAULT 'not_connected',
    "bankAccountHolder" TEXT,
    "bankName" TEXT,
    "bankAccountLast4" TEXT,
    "bankRoutingNumber" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountType" TEXT DEFAULT 'checking',
    "payoutMethod" TEXT DEFAULT 'manual',
    "workingHours" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSchedule" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isWorking" BOOLEAN NOT NULL DEFAULT true,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "StaffSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleBreak" (
    "id" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "label" TEXT,
    "scheduleId" TEXT NOT NULL,

    CONSTRAINT "ScheduleBreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOff" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "TimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "mobile" TEXT,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "preferredLanguage" TEXT DEFAULT 'en',
    "preferredStaffId" TEXT,
    "preferredContactMethod" TEXT DEFAULT 'sms',
    "birthday" TIMESTAMP(3),
    "birthdayMonth" INTEGER,
    "birthdayDay" INTEGER,
    "allowSms" BOOLEAN NOT NULL DEFAULT true,
    "allowEmail" BOOLEAN NOT NULL DEFAULT true,
    "referralSource" TEXT,
    "referredById" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "tags" TEXT[],
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "googleCalendarToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleCalendarId" TEXT,
    "outlookCalendarToken" TEXT,
    "outlookRefreshToken" TEXT,
    "outlookCalendarId" TEXT,
    "outlookTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPhoto" (
    "id" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL DEFAULT 'AFTER',
    "filePath" TEXT NOT NULL,
    "caption" TEXT,
    "serviceDate" TIMESTAMP(3),
    "isPortfolio" BOOLEAN NOT NULL DEFAULT false,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "appointmentId" TEXT,

    CONSTRAINT "ClientPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceFormula" (
    "id" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "notes" TEXT,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "ServiceFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPreference" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "notes" TEXT,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "ClientPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ClientNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "priceType" "PriceType" NOT NULL DEFAULT 'FIXED',
    "priceFrom" DECIMAL(10,2),
    "color" TEXT,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "allowOnline" BOOLEAN NOT NULL DEFAULT true,
    "requireDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DECIMAL(10,2),
    "depositPercent" DECIMAL(5,2),
    "canDoubleBook" BOOLEAN NOT NULL DEFAULT false,
    "maxConcurrent" INTEGER NOT NULL DEFAULT 1,
    "processingTime" INTEGER,
    "bufferTime" INTEGER DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAddOn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "ServiceAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'BOOKED',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "clientName" TEXT,
    "clientPhone" TEXT,
    "clientEmail" TEXT,
    "source" "BookingSource" NOT NULL DEFAULT 'PHONE',
    "notes" TEXT,
    "internalNotes" TEXT,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "confirmationSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSentAt" TIMESTAMP(3),
    "emailReminderSent" BOOLEAN NOT NULL DEFAULT false,
    "emailReminderSentAt" TIMESTAMP(3),
    "callReminderSent" BOOLEAN NOT NULL DEFAULT false,
    "callReminderSentAt" TIMESTAMP(3),
    "noShowRisk" DECIMAL(5,2),
    "depositPaid" DECIMAL(10,2),
    "depositPaidAt" TIMESTAMP(3),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "parentAppointmentId" TEXT,
    "googleEventId" TEXT,
    "outlookEventId" TEXT,
    "clientGoogleEventId" TEXT,
    "clientOutlookEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "clientId" TEXT,
    "staffId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "businessId" TEXT,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentService" (
    "id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "duration" INTEGER NOT NULL,
    "notes" TEXT,
    "appointmentId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentAddOn" (
    "id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "duration" INTEGER NOT NULL,
    "appointmentServiceId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,

    CONSTRAINT "AppointmentAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupAppointment" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'group',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "maxParticipants" INTEGER NOT NULL DEFAULT 10,
    "minParticipants" INTEGER NOT NULL DEFAULT 2,
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "depositRequired" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "hostName" TEXT,
    "hostPhone" TEXT,
    "hostEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "staffId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "serviceId" TEXT,

    CONSTRAINT "GroupAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupParticipant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "paidAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupAppointmentId" TEXT NOT NULL,
    "clientId" TEXT,

    CONSTRAINT "GroupParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "estimatedWait" INTEGER,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "serviceNotes" TEXT,
    "estimatedDuration" INTEGER,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seatedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "phone" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL DEFAULT 'SALE',
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountReason" TEXT,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tipAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "pointsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "quickbooksCustomerId" TEXT,
    "quickbooksInvoiceId" TEXT,
    "quickbooksPaymentId" TEXT,
    "quickbooksSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "staffId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "appointmentId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLineItem" (
    "id" TEXT NOT NULL,
    "type" "LineItemType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "performedById" TEXT,
    "transactionId" TEXT NOT NULL,
    "serviceId" TEXT,
    "productId" TEXT,

    CONSTRAINT "TransactionLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionPayment" (
    "id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reference" TEXT,
    "stripePaymentId" TEXT,
    "giftCardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "TransactionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "transactionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "baseAmount" DECIMAL(10,2) NOT NULL,
    "transactionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "size" TEXT,
    "cost" DECIMAL(10,2),
    "price" DECIMAL(10,2) NOT NULL,
    "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "reorderQuantity" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTaxable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "paymentTerms" TEXT,
    "accountNumber" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT,
    "quantityOrdered" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "originalValue" DECIMAL(10,2) NOT NULL,
    "savingsAmount" DECIMAL(10,2) NOT NULL,
    "savingsPercent" DECIMAL(5,2) NOT NULL,
    "validityDays" INTEGER NOT NULL DEFAULT 365,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageService" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "packageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "PackageService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagePurchase" (
    "id" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "totalServices" INTEGER NOT NULL,
    "usedServices" INTEGER NOT NULL DEFAULT 0,
    "remainingServices" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "pricePaid" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "packageId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "PackagePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageUsage" (
    "id" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "purchaseId" TEXT NOT NULL,

    CONSTRAINT "PackageUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "freeServicesPerMonth" INTEGER NOT NULL DEFAULT 0,
    "priorityBooking" BOOLEAN NOT NULL DEFAULT false,
    "guestPasses" INTEGER NOT NULL DEFAULT 0,
    "includedServices" JSONB,
    "image" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipSubscription" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextBillingDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "lastPaymentAmount" DECIMAL(10,2),
    "paymentMethod" TEXT,
    "stripeSubscriptionId" TEXT,
    "freeServicesUsed" INTEGER NOT NULL DEFAULT 0,
    "guestPassesUsed" INTEGER NOT NULL DEFAULT 0,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "membershipId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "MembershipSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pointsPerDollar" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "bonusOnSignup" INTEGER NOT NULL DEFAULT 0,
    "bonusOnBirthday" INTEGER NOT NULL DEFAULT 0,
    "bonusOnReferral" INTEGER NOT NULL DEFAULT 0,
    "tiers" JSONB,
    "pointsExpireMonths" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyAccount" (
    "id" TEXT NOT NULL,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'Bronze',
    "tierExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyReward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointsCost" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "programId" TEXT NOT NULL,

    CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftCard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "initialBalance" DECIMAL(10,2) NOT NULL,
    "currentBalance" DECIMAL(10,2) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDigital" BOOLEAN NOT NULL DEFAULT true,
    "recipientEmail" TEXT,
    "recipientName" TEXT,
    "message" TEXT,
    "sentAt" TIMESTAMP(3),
    "businessId" TEXT NOT NULL,
    "purchasedById" TEXT,
    "ownerId" TEXT,

    CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftCardUsage" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balanceAfter" DECIMAL(10,2) NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "giftCardId" TEXT NOT NULL,

    CONSTRAINT "GiftCardUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "referrerReward" TEXT,
    "referredReward" TEXT,
    "referrerRewarded" BOOLEAN NOT NULL DEFAULT false,
    "referredRewarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "targetTags" TEXT[],
    "targetSegment" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "source" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL,
    "triggerConfig" JSONB,
    "actions" JSONB NOT NULL,
    "timesTriggered" INTEGER NOT NULL DEFAULT 0,
    "lastTriggered" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "businessId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationDelivery" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "IntegrationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastErrorCode" TEXT,
    "lastErrorAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedFilter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "businessId" TEXT,

    CONSTRAINT "SavedFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCloseout" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "staffId" TEXT,
    "totalTransactions" INTEGER NOT NULL,
    "grossSales" DECIMAL(10,2) NOT NULL,
    "discounts" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netSales" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tips" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "refunds" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(10,2) NOT NULL,
    "cashTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cardTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "otherTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cashCounted" DECIMAL(10,2),
    "cashVariance" DECIMAL(10,2),
    "appointmentsTotal" INTEGER NOT NULL DEFAULT 0,
    "appointmentsCompleted" INTEGER NOT NULL DEFAULT 0,
    "appointmentsNoShow" INTEGER NOT NULL DEFAULT 0,
    "newClients" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyCloseout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "primaryContactId" TEXT,

    CONSTRAINT "FamilyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "salonName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'OTHER',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "nextFollowUp" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "businessName" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "taxRate" DECIMAL(5,4),
    "openTime" TEXT,
    "closeTime" TEXT,
    "googleCalendarEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quickbooksAccessToken" TEXT,
    "quickbooksRefreshToken" TEXT,
    "quickbooksRealmId" TEXT,
    "quickbooksTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSubscription" (
    "id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'STARTER',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "monthlyPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "marketplaceCommissionPct" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "BusinessSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceLead" (
    "id" TEXT NOT NULL,
    "source" "MarketplaceSource" NOT NULL DEFAULT 'MARKETPLACE_SEARCH',
    "status" "LeadStatusType" NOT NULL DEFAULT 'NEW',
    "sessionId" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "searchQuery" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "commissionRate" DECIMAL(5,2),
    "commissionAmount" DECIMAL(10,2),
    "commissionPaidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "locationId" TEXT,
    "appointmentId" TEXT,
    "clientId" TEXT,

    CONSTRAINT "MarketplaceLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "subscriptionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "commissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "stripeInvoiceId" TEXT,
    "paidAt" TIMESTAMP(3),
    "lineItems" JSONB,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" TEXT NOT NULL,

    CONSTRAINT "BusinessInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicSalonProfile" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isListed" BOOLEAN NOT NULL DEFAULT true,
    "featuredUntil" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "headline" TEXT,
    "description" TEXT,
    "specialties" TEXT[],
    "amenities" TEXT[],
    "coverImage" TEXT,
    "galleryImages" TEXT[],
    "avgRating" DECIMAL(3,2),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "priceRange" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "bookingClickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "PublicSalonProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SymptomCheck" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "sessionId" TEXT NOT NULL,
    "symptoms" TEXT[],
    "duration" TEXT,
    "severity" TEXT,
    "additionalInfo" TEXT,
    "possibleConditions" JSONB,
    "recommendations" JSONB,
    "urgencyLevel" TEXT,
    "shouldSeekCare" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SymptomCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentalHealthSession" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "sessionId" TEXT NOT NULL,
    "moodScore" INTEGER,
    "stressLevel" INTEGER,
    "anxietyLevel" INTEGER,
    "sleepQuality" INTEGER,
    "messages" JSONB,
    "insights" JSONB,
    "copingStrategies" JSONB,
    "resourcesRecommended" JSONB,
    "needsProfessionalHelp" BOOLEAN NOT NULL DEFAULT false,
    "crisisDetected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentalHealthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkinAnalysis" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "skinType" TEXT,
    "concerns" TEXT[],
    "age" INTEGER,
    "lifestyle" TEXT,
    "currentRoutine" JSONB,
    "skinCondition" JSONB,
    "recommendations" JSONB,
    "productSuggestions" JSONB,
    "routineAdvice" JSONB,
    "treatmentSuggestions" JSONB,
    "imageUrl" TEXT,
    "analysisResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkinAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SleepRecord" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bedtime" TEXT,
    "wakeTime" TEXT,
    "sleepDuration" DECIMAL(4,2),
    "sleepQuality" INTEGER,
    "caffeineIntake" BOOLEAN NOT NULL DEFAULT false,
    "screenTime" INTEGER,
    "exercise" BOOLEAN NOT NULL DEFAULT false,
    "stress" INTEGER,
    "roomTemp" TEXT,
    "noiseLevel" TEXT,
    "lightLevel" TEXT,
    "insights" JSONB,
    "recommendations" JSONB,
    "sleepScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SleepRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostureAssessment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "occupation" TEXT,
    "hoursSeated" INTEGER,
    "painAreas" TEXT[],
    "currentIssues" TEXT[],
    "activityLevel" TEXT,
    "postureScore" INTEGER,
    "issues" JSONB,
    "exercises" JSONB,
    "ergonomicTips" JSONB,
    "improvementPlan" JSONB,
    "previousScore" INTEGER,
    "improvement" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostureAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIProductRecommendation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "skinType" TEXT,
    "hairType" TEXT,
    "concerns" TEXT[],
    "allergies" TEXT[],
    "budget" TEXT,
    "preferences" JSONB,
    "products" JSONB,
    "routines" JSONB,
    "alternatives" JSONB,
    "purchased" TEXT[],
    "rating" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIProductRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AILoyaltyOptimization" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "programData" JSONB,
    "memberData" JSONB,
    "transactionData" JSONB,
    "programSuggestions" JSONB,
    "rewardOptimizations" JSONB,
    "engagementStrategies" JSONB,
    "retentionTactics" JSONB,
    "projectedROI" DECIMAL(10,2),
    "projectedRetention" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AILoyaltyOptimization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiResult" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "businessId" TEXT,
    "userId" TEXT,
    "model" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "tokens" INTEGER,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConsent" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "signature" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WellnessAuditLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WellnessAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "MobileSession_tokenHash_key" ON "MobileSession"("tokenHash");

-- CreateIndex
CREATE INDEX "MobileSession_userId_expiresAt_idx" ON "MobileSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_identityHash_createdAt_idx" ON "LoginAttempt"("identityHash", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "StaffSchedule_staffId_dayOfWeek_idx" ON "StaffSchedule"("staffId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPreference_clientId_category_key" ON "ClientPreference"("clientId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_businessId_name_key" ON "ServiceCategory"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Service_businessId_name_key" ON "Service"("businessId", "name");

-- CreateIndex
CREATE INDEX "Appointment_businessId_scheduledStart_idx" ON "Appointment"("businessId", "scheduledStart");

-- CreateIndex
CREATE INDEX "Appointment_businessId_status_idx" ON "Appointment"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_businessId_idempotencyKey_key" ON "Appointment"("businessId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionNumber_key" ON "Transaction"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_appointmentId_key" ON "Transaction"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_businessId_name_key" ON "ProductCategory"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PackageService_packageId_serviceId_key" ON "PackageService"("packageId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProgram_businessId_key" ON "LoyaltyProgram"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyAccount_clientId_key" ON "LoyaltyAccount"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftCard_code_key" ON "GiftCard"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "AuditLog_businessId_createdAt_idx" ON "AuditLog"("businessId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationDelivery_dedupeKey_key" ON "IntegrationDelivery"("dedupeKey");

-- CreateIndex
CREATE INDEX "IntegrationDelivery_status_nextAttemptAt_idx" ON "IntegrationDelivery"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "IntegrationDelivery_businessId_appointmentId_idx" ON "IntegrationDelivery"("businessId", "appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCloseout_date_staffId_key" ON "DailyCloseout"("date", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMember_familyId_clientId_key" ON "FamilyMember"("familyId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSubscription_businessId_key" ON "BusinessSubscription"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceLead_appointmentId_key" ON "MarketplaceLead"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessInvoice_invoiceNumber_key" ON "BusinessInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PublicSalonProfile_slug_key" ON "PublicSalonProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PublicSalonProfile_businessId_key" ON "PublicSalonProfile"("businessId");

-- CreateIndex
CREATE INDEX "AiResult_businessId_feature_idx" ON "AiResult"("businessId", "feature");

-- CreateIndex
CREATE INDEX "AiResult_feature_createdAt_idx" ON "AiResult"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "AIConsent_clientId_feature_idx" ON "AIConsent"("clientId", "feature");

-- CreateIndex
CREATE INDEX "AIConsent_businessId_feature_idx" ON "AIConsent"("businessId", "feature");

-- CreateIndex
CREATE INDEX "WellnessAuditLog_businessId_feature_createdAt_idx" ON "WellnessAuditLog"("businessId", "feature", "createdAt");

-- CreateIndex
CREATE INDEX "WellnessAuditLog_clientId_createdAt_idx" ON "WellnessAuditLog"("clientId", "createdAt");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileSession" ADD CONSTRAINT "MobileSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSchedule" ADD CONSTRAINT "StaffSchedule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBreak" ADD CONSTRAINT "ScheduleBreak_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "StaffSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOff" ADD CONSTRAINT "TimeOff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPhoto" ADD CONSTRAINT "ClientPhoto_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPhoto" ADD CONSTRAINT "ClientPhoto_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceFormula" ADD CONSTRAINT "ServiceFormula_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAddOn" ADD CONSTRAINT "ServiceAddOn_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAddOn" ADD CONSTRAINT "AppointmentAddOn_appointmentServiceId_fkey" FOREIGN KEY ("appointmentServiceId") REFERENCES "AppointmentService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAddOn" ADD CONSTRAINT "AppointmentAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "ServiceAddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupParticipant" ADD CONSTRAINT "GroupParticipant_groupAppointmentId_fkey" FOREIGN KEY ("groupAppointmentId") REFERENCES "GroupAppointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLineItem" ADD CONSTRAINT "TransactionLineItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLineItem" ADD CONSTRAINT "TransactionLineItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLineItem" ADD CONSTRAINT "TransactionLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionPayment" ADD CONSTRAINT "TransactionPayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageService" ADD CONSTRAINT "PackageService_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagePurchase" ADD CONSTRAINT "PackagePurchase_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageUsage" ADD CONSTRAINT "PackageUsage_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "PackagePurchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipSubscription" ADD CONSTRAINT "MembershipSubscription_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyAccount" ADD CONSTRAINT "LoyaltyAccount_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyAccount" ADD CONSTRAINT "LoyaltyAccount_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LoyaltyAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCardUsage" ADD CONSTRAINT "GiftCardUsage_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationDelivery" ADD CONSTRAINT "IntegrationDelivery_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationDelivery" ADD CONSTRAINT "IntegrationDelivery_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedFilter" ADD CONSTRAINT "SavedFilter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedFilter" ADD CONSTRAINT "SavedFilter_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCloseout" ADD CONSTRAINT "DailyCloseout_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyGroup" ADD CONSTRAINT "FamilyGroup_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSubscription" ADD CONSTRAINT "BusinessSubscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceLead" ADD CONSTRAINT "MarketplaceLead_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceLead" ADD CONSTRAINT "MarketplaceLead_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceLead" ADD CONSTRAINT "MarketplaceLead_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceLead" ADD CONSTRAINT "MarketplaceLead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessInvoice" ADD CONSTRAINT "BusinessInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "BusinessSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicSalonProfile" ADD CONSTRAINT "PublicSalonProfile_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
