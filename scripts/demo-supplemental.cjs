/**
 * Supplemental demo rows.
 *
 * Called by `scripts/load-demo-data.cjs` inside its transaction and advisory
 * lock, after the main loader has created the salon catalogue, clients, staff,
 * services and products. This tops every remaining feature table up to at least
 * MIN_ROWS so each feature has a usable list in the UI.
 *
 * Principles:
 *   - Idempotent. Deterministic ids + upsert, so re-running changes nothing.
 *   - Fictional. Every row carries `note` and no provider is contacted.
 *   - Honest. Tables that represent money moved, messages sent, or real events
 *     are NOT fabricated (see NOT_SEEDED). Those must stay empty until the
 *     system genuinely produces them.
 */

const MIN_ROWS = 15;

/**
 * Model (lowercase delegate name) -> why we refuse to fabricate rows.
 * Seeding these would put fiction into ledgers, delivery logs and audit trails,
 * which is worse than leaving them empty.
 */
const NOT_SEEDED = {
  account: 'created by NextAuth when a user first signs in',
  settings: 'one row per business, created on setup',
  loginAttempt: 'security log, written only by real sign-in attempts',
  mutationReceipt: 'idempotency record, written only by real mutations',
  mobileSession: 'issued on real device login',
  auditLog: 'audit trail of real events',
  wellnessAuditLog: 'audit trail of real events',
  integrationConnection: 'must reflect a genuinely connected provider',
  businessBillingAttempt: 'billing history; would fabricate money movement',
  paymentRefund: 'refunds; would fabricate money movement',
  loyaltyTransaction: 'points ledger; would fabricate balances',
  giftCardUsage: 'redemption ledger; would fabricate balances',
  packageUsage: 'consumption against a paid package',
  packagePurchase: 'a purchase implies payment taken',
  salonCheckout: 'implies a completed sale',
  salonClaim: 'implies an insurance submission',
  salonPosTransaction: 'till takings',
  salonDrawerEvent: 'till reconciliation',
  cashDrawerSession: 'till state',
  cashDrawerMovement: 'cash movement',
  cashDrawerAllocation: 'cash movement',
  dailyCloseout: 'daily reconciliation of real money',
  timeEntry: 'payroll hours actually worked',
  wearableSample: 'must originate from a real device sync',
  integrationDelivery: 'claims a message was delivered',
  outboundMessage: 'claims a message was sent',
  groupAppointment: 'implies a real group booking',
  groupParticipant: 'implies a real group booking',
  roomReservation: 'implies a real booking',
  appointmentAddOn: 'implies a real booking',
  appointmentService: 'implies a real booking',
  contactMessage: 'written by the public marketing form',
  campaign: 'a campaign implies real recipients',
  businessSubscription: 'billing state must not be fabricated',
  businessInvoice: 'invoice implies money owed',
  referral: 'a referral implies a real person was referred',
  publicSalonProfile: 'one public profile per business (unique on businessId)',
  loyaltyProgram: 'one loyalty program per business (unique on businessId)',
};

/**
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {object} ctx
 */
async function seedSupplemental(tx, ctx) {
  const {
    businessId, admin, note,
    clients, services, products, staff, locations, packages,
    k, stamp, insert,
  } = ctx;

  const client = (i) => clients[i % clients.length];
  const service = (i) => services[i % services.length];
  const product = (i) => products[i % products.length];
  const staffRow = (i) => staff[i % staff.length];
  const location = locations[0];
  const text = (i) => `Demo record ${i + 1}. ${note}`;

  const required = { clients, services, products, staff, locations };
  for (const [name, list] of Object.entries(required)) {
    if (!list || list.length === 0) throw new Error(`seedSupplemental requires seeded ${name}`);
  }

  const done = {};

  // ── AI history and consent ────────────────────────────────────────────────
  for (let i = 0; i < MIN_ROWS; i += 1) {
    await insert(tx, 'aiResult', k('ai-result', i), {
      feature: ['client-insights', 'no-show', 'revenue', 'sentiment'][i % 4],
      businessId, userId: admin.id, model: 'demo-not-called',
      input: { demo: true, index: i }, output: { demo: true, summary: text(i) },
      tokens: 0, durationMs: 0, status: 'DRAFT',
    });
    await insert(tx, 'aIConsent', k('ai-consent', i), {
      businessId, clientId: client(i).id, userId: admin.id, feature: 'demo_consent',
      granted: true, userAgent: 'demo-loader',
    });
    await insert(tx, 'aILoyaltyOptimization', k('loyalty-opt', i), {
      businessId, programData: { demo: true },
      memberData: { demo: true }, transactionData: { demo: true },
      programSuggestions: { demo: true, note: text(i) },
      rewardOptimizations: { demo: true }, engagementStrategies: { demo: true },
      retentionTactics: { demo: true },
    });
    await insert(tx, 'aIProductRecommendation', k('ai-product-rec', i), {
      clientId: client(i).id, concerns: ['Demo concern'],
      preferences: { demo: true, note: text(i) },
      products: [{ id: product(i).id, name: product(i).name, why: text(i) }],
      routines: { demo: true }, rating: null,
    });
  }
  done.aiResult = done.aIConsent = done.aILoyaltyOptimization = done.aIProductRecommendation = MIN_ROWS;

  // ── Client-linked assessment records (schema shapes, no clinical claims) ───
  for (let i = 0; i < MIN_ROWS; i += 1) {
    await insert(tx, 'skinAnalysis', k('skin-analysis', i), {
      clientId: client(i).id, skinType: ['oily', 'dry', 'combination', 'normal'][i % 4],
      concerns: ['Demo concern'], age: 30 + i, lifestyle: 'Demo lifestyle',
      currentRoutine: { demo: true }, skinCondition: { demo: true },
      recommendations: { demo: true }, productSuggestions: { demo: true },
      routineAdvice: { demo: true }, treatmentSuggestions: { demo: true },
    });
    await insert(tx, 'sleepRecord', k('sleep-record', i), {
      clientId: client(i).id, date: stamp(-i), bedtime: '22:30', wakeTime: '06:30',
      sleepDuration: 8, sleepQuality: 7, caffeineIntake: false,
      screenTime: 30, exercise: true, stress: 4, roomTemp: '20C',
    });
    await insert(tx, 'symptomCheck', k('symptom-check', i), {
      clientId: client(i).id, sessionId: k('symptom-session', i),
      symptoms: ['Demo symptom'], duration: '1 day', severity: 'mild',
      additionalInfo: note, possibleConditions: { demo: true },
      recommendations: { demo: true }, urgencyLevel: 'low', shouldSeekCare: false,
    });
    await insert(tx, 'postureAssessment', k('posture', i), {
      clientId: client(i).id, occupation: 'Demo occupation', hoursSeated: 6,
      painAreas: ['Demo area'], currentIssues: ['Demo issue'], activityLevel: 'moderate',
      postureScore: 70, issues: { demo: true }, exercises: { demo: true },
      ergonomicTips: { demo: true }, improvementPlan: { demo: true },
    });
    await insert(tx, 'mentalHealthSession', k('mental-health', i), {
      clientId: client(i).id, sessionId: k('mental-session', i),
      moodScore: 6, stressLevel: 4, anxietyLevel: 3, sleepQuality: 7,
      messages: [], insights: { demo: true }, copingStrategies: { demo: true },
      resourcesRecommended: { demo: true }, needsProfessionalHelp: false,
    });
  }
  done.skinAnalysis = done.sleepRecord = done.symptomCheck =
    done.postureAssessment = done.mentalHealthSession = MIN_ROWS;

  // ── Client records, comms, attachments ────────────────────────────────────
  for (let i = 0; i < MIN_ROWS; i += 1) {
    await insert(tx, 'communication', k('communication', i), {
      clientId: client(i).id, type: ['SMS', 'EMAIL', 'NOTE'][i % 3],
      direction: 'OUTBOUND', content: `${text(i)} ${note}`, status: 'DRAFT',
    });
    await insert(tx, 'attachment', k('attachment', i), {
      clientId: client(i).id, fileName: `demo-attachment-${i + 1}.pdf`,
      filePath: `/uploads/demo/demo-attachment-${i + 1}.pdf`, fileType: 'application/pdf',
      fileSize: 1024, description: note, uploadedById: admin.id,
    });
    await insert(tx, 'clientPhoto', k('client-photo', i), {
      clientId: client(i).id, type: 'AFTER',
      filePath: `/uploads/demo/demo-photo-${i + 1}.jpg`,
      caption: text(i), isPortfolio: false,
    });
    await insert(tx, 'clientNote', k('client-note', i), {
      clientId: client(i).id, content: text(i),
      isPinned: i % 5 === 0, isPrivate: false, createdById: admin.id,
    });
    // Unique on (clientId, category): stagger the category so each pair differs.
    await insert(tx, 'clientPreference', k('client-preference', i), {
      clientId: client(i).id,
      category: ['Hair', 'Skin', 'Wellness', 'Nails', 'Brows'][i % 5],
      value: text(i), notes: note,
    });
  }
  done.communication = done.attachment = done.clientPhoto =
    done.clientNote = done.clientPreference = MIN_ROWS;

  // ── Scheduling support ────────────────────────────────────────────────────
  // ScheduleBreak hangs off a real StaffSchedule row, so resolve those first.
  const schedules = await tx.staffSchedule.findMany({
    where: { staff: { location: { businessId } } },
    orderBy: { id: 'asc' }, take: MIN_ROWS,
  });
  for (let i = 0; i < MIN_ROWS && schedules.length; i += 1) {
    await insert(tx, 'scheduleBreak', k('schedule-break', i), {
      scheduleId: schedules[i % schedules.length].id,
      startTime: '12:00', endTime: '12:30', label: text(i),
    });
  }
  for (let i = 0; i < MIN_ROWS; i += 1) {
    await insert(tx, 'treatmentRoom', k('treatment-room', i), {
      businessId, locationId: location.id, name: `Demo room ${i + 1}`,
      status: 'READY', notes: note,
      checklist: [], completedChecklist: [], updatedById: admin.id,
    });
    await insert(tx, 'knowledgeDocument', k('knowledge', i), {
      businessId, title: text(i), content: note,
      tags: ['demo'], isActive: false, createdById: admin.id,
    });
    await insert(tx, 'savedFilter', k('saved-filter', i), {
      businessId, userId: admin.id, name: `Demo filter ${i + 1}`,
      entityType: ['clients', 'appointments', 'transactions'][i % 3],
      filters: { demo: true }, isDefault: false,
    });
    await insert(tx, 'automation', k('automation', i), {
      businessId, name: `Demo automation ${i + 1}`,
      description: note, triggerType: 'appointment.created',
      triggerConfig: { demo: true }, actions: [{ type: 'queue_email', demo: true }],
      isActive: false, timesTriggered: 0,
    });
  }
  done.scheduleBreak = done.treatmentRoom = done.knowledgeDocument =
    done.savedFilter = done.automation = MIN_ROWS;

  // ── Loyalty catalogue, packages, memberships ──────────────────────────────
  const program = await tx.loyaltyProgram.findFirst({ where: { businessId } });
  for (let i = 0; i < MIN_ROWS; i += 1) {
    if (program) {
      await insert(tx, 'loyaltyReward', k('loyalty-reward', i), {
        programId: program.id, name: `Demo reward ${i + 1}`,
        description: note, pointsCost: 100 + i * 10, isActive: false,
        type: 'DISCOUNT', value: 5,
      });
      // LoyaltyAccount.clientId is unique, so only create an account for a client
      // that does not already have one (an existing account may predate this load).
      const c = client(i);
      const existing = await tx.loyaltyAccount.findFirst({ where: { clientId: c.id } });
      if (!existing) {
        await insert(tx, 'loyaltyAccount', k('loyalty-account', i), {
          programId: program.id, clientId: c.id,
          pointsBalance: 0, lifetimePoints: 0, tier: 'BRONZE',
        });
      }
    }
    await insert(tx, 'packageService', k('package-service', i), {
      packageId: packages[i % packages.length].id, serviceId: service(i).id,
    });
  	await insert(tx, 'campaign', k('campaign', i), {
      businessId, name: `Demo campaign ${i + 1}`,
      type: ['EMAIL', 'SMS'][i % 2], status: 'draft', content: note,
      targetTags: [], sentCount: 0, openCount: 0, clickCount: 0,
    });
  }
  done.loyaltyReward = done.loyaltyAccount = done.packageService = done.campaign = MIN_ROWS;

  // ── Categories and family groups ──────────────────────────────────────────
  for (let i = 0; i < MIN_ROWS; i += 1) {
    await insert(tx, 'serviceCategory', k('service-category', i), {
      businessId, name: `Demo service category ${i + 1}`, sortOrder: i, isActive: false,
    });
    await insert(tx, 'productCategory', k('product-category', i), {
      businessId, name: `Demo product category ${i + 1}`, sortOrder: i, isActive: false,
    });
    // FamilyGroup has no businessId; it hangs off a primary contact client.
    await insert(tx, 'familyGroup', k('family-group', i), {
      name: `Demo family ${i + 1}`, primaryContactId: client(i).id,
    });
    await insert(tx, 'marketplaceLead', k('marketplace-lead', i), {
      businessId, locationId: location.id,
      source: 'MARKETPLACE_SEARCH', status: 'NEW',
      searchQuery: `demo search ${i + 1}`, utmSource: 'demo',
    });
  }
  done.serviceCategory = done.productCategory = done.familyGroup = done.marketplaceLead = MIN_ROWS;

  const families = await tx.familyGroup.findMany({
    where: { primaryContactId: { in: clients.map((c) => c.id) } },
    orderBy: { id: 'asc' }, take: MIN_ROWS,
  });
  for (let i = 0; i < MIN_ROWS && families.length; i += 1) {
    await insert(tx, 'familyMember', k('family-member', i), {
      familyId: families[i % families.length].id, clientId: client(i).id,
      relationship: ['Sibling', 'Parent', 'Child'][i % 3],
    });
  }
  done.familyMember = families.length ? MIN_ROWS : 0;

  // ── Sales CRM pipeline ─────────────────────────────────────────────────────
  // Lead is the platform-level sales pipeline (no businessId) shown to platform
  // admins and owners. It is distinct from marketplaceLead above. Seed more
  // than MIN_ROWS so the executive pipeline view is a usable list.
  const LEAD_ROWS = 18;
  const leadOwners = [
    'Jordan Blake', 'Casey Nguyen', 'Taylor Brooks', 'Riley Chen', 'Morgan Ellis',
    'Alex Ramirez', 'Jamie Foster', 'Cameron Reed', 'Drew Patel', 'Reese Coleman',
    'Quinn Harper', 'Skyler Diaz', 'Rowan Price', 'Emerson Wright', 'Avery Kim',
    'Parker Lane', 'Sage Monroe', 'Hayden Cole',
  ];
  const leadPlaces = [
    ['Austin', 'TX', '78701'], ['Seattle', 'WA', '98101'], ['Denver', 'CO', '80202'],
    ['Miami', 'FL', '33101'], ['Chicago', 'IL', '60601'], ['Portland', 'OR', '97201'],
    ['Nashville', 'TN', '37201'], ['Phoenix', 'AZ', '85004'], ['Boston', 'MA', '02108'],
    ['Atlanta', 'GA', '30303'], ['San Diego', 'CA', '92101'], ['Minneapolis', 'MN', '55401'],
    ['Dallas', 'TX', '75201'], ['Brooklyn', 'NY', '11201'], ['Scottsdale', 'AZ', '85251'],
    ['Charlotte', 'NC', '28202'], ['Salt Lake City', 'UT', '84101'], ['Tampa', 'FL', '33602'],
  ];
  const leadSources = ['GOOGLE_MAPS', 'YELP', 'REFERRAL', 'WALK_IN', 'TRADE_SHOW', 'COLD_CALL', 'WEBSITE', 'SOCIAL_MEDIA', 'OTHER'];
  const leadStatuses = ['NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_COMPLETED', 'TRIAL', 'NEGOTIATING', 'CONVERTED', 'LOST'];
  const leadPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  for (let i = 0; i < LEAD_ROWS; i += 1) {
    const [city, state, zip] = leadPlaces[i % leadPlaces.length];
    const status = leadStatuses[i % leadStatuses.length];
    await insert(tx, 'lead', k('sales-lead', i), {
      salonName: `Demo salon lead ${i + 1}`,
      ownerName: leadOwners[i % leadOwners.length],
      email: `demo.lead.${i + 1}@example.invalid`,
      phone: `+1804555${String(1000 + i).slice(-4)}`,
      website: i % 3 === 0 ? `https://demo-lead-${i + 1}.example.invalid` : null,
      address: `${100 + i} Demo Avenue`,
      city, state, zip,
      source: leadSources[i % leadSources.length],
      status,
      priority: leadPriorities[i % leadPriorities.length],
      notes: `${text(i)} ${note}`,
      lastContactAt: stamp(-(i + 1)),
      nextFollowUp: i % 2 === 0 ? stamp(i + 1) : null,
      convertedAt: status === 'CONVERTED' ? stamp(-(i + 2)) : null,
      lostReason: status === 'LOST' ? 'Demo lead lost reason.' : null,
    });
  }
  done.lead = LEAD_ROWS;

  // ── Tips and reviews (business records that do not move money) ────────────
  // Tip requires a real Transaction to hang off.
  const txnIds = (await tx.transaction.findMany({ select: { id: true }, orderBy: { id: 'asc' }, take: MIN_ROWS })).map((t) => t.id);
  for (let i = 0; i < MIN_ROWS; i += 1) {
    if (txnIds.length) {
      await insert(tx, 'tip', k('tip', i), {
        staffId: staffRow(i).id, amount: 5 + i, method: 'CASH',
        transactionId: txnIds[i % txnIds.length],
      });
    }
    await insert(tx, 'review', k('review', i), {
      clientId: client(i).id, rating: (i % 5) + 1,
      comment: text(i), source: 'DEMO', isPublic: false,
    });
    await insert(tx, 'waitlistEntry', k('waitlist', i), {
      clientId: client(i).id, locationId: location.id,
      position: i + 1, status: 'WAITING', serviceNotes: note,
      estimatedWait: 15 + i, estimatedDuration: 45,
      phone: '+18045550100', notificationSent: false,
    });
  }
  done.tip = done.review = done.waitlistEntry = MIN_ROWS;

  return done;
}

module.exports = { seedSupplemental, MIN_ROWS, NOT_SEEDED };
