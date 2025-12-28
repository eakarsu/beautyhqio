import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create Business
  const business = await prisma.business.create({
    data: {
      name: "Luxe Beauty Studio",
      type: "MULTI_SERVICE",
      phone: "5551234567",
      email: "hello@luxebeauty.com",
      website: "https://luxebeauty.com",
      timezone: "America/New_York",
      defaultLanguage: "en",
      supportedLanguages: ["en", "es", "vi", "ko", "zh"],
      instagram: "@luxebeautystudio",
      facebook: "luxebeautystudio",
      taxRate: 0.0875,
    },
  });
  console.log("Created business:", business.name);

  // Create Locations
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        businessId: business.id,
        name: "Main Salon - Downtown",
        phone: "5551234567",
        email: "downtown@luxebeauty.com",
        address: "123 Main Street",
        city: "New York",
        state: "NY",
        zip: "10001",
        country: "USA",
        operatingHours: {
          monday: { open: "09:00", close: "20:00" },
          tuesday: { open: "09:00", close: "20:00" },
          wednesday: { open: "09:00", close: "20:00" },
          thursday: { open: "09:00", close: "21:00" },
          friday: { open: "09:00", close: "21:00" },
          saturday: { open: "08:00", close: "18:00" },
          sunday: { open: "10:00", close: "17:00" },
        },
      },
    }),
    prisma.location.create({
      data: {
        businessId: business.id,
        name: "Express Salon - Mall",
        phone: "5559876543",
        email: "mall@luxebeauty.com",
        address: "456 Shopping Center Blvd",
        city: "New York",
        state: "NY",
        zip: "10002",
        country: "USA",
        operatingHours: {
          monday: { open: "10:00", close: "21:00" },
          tuesday: { open: "10:00", close: "21:00" },
          wednesday: { open: "10:00", close: "21:00" },
          thursday: { open: "10:00", close: "21:00" },
          friday: { open: "10:00", close: "21:00" },
          saturday: { open: "10:00", close: "21:00" },
          sunday: { open: "11:00", close: "19:00" },
        },
      },
    }),
  ]);
  console.log("Created locations:", locations.length);

  // Create Users and Staff
  const hashedPassword = await bcrypt.hash("password123", 12);
  const adminPassword = await bcrypt.hash("admin123", 12);

  // Create admin user first
  const adminUser = await prisma.user.create({
    data: {
      businessId: business.id,
      email: "admin@luxebeauty.com",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "OWNER",
      phone: "5550000000",
      isActive: true,
    },
  });
  console.log("Created admin user:", adminUser.email);

  const usersData = [
    {
      email: "maria@luxebeauty.com",
      firstName: "Maria",
      lastName: "Garcia",
      role: "OWNER" as const,
      phone: "5551111111",
    },
    {
      email: "jennifer@luxebeauty.com",
      firstName: "Jennifer",
      lastName: "Kim",
      role: "MANAGER" as const,
      phone: "5552222222",
    },
    {
      email: "lisa@luxebeauty.com",
      firstName: "Lisa",
      lastName: "Nguyen",
      role: "RECEPTIONIST" as const,
      phone: "5553333333",
    },
    {
      email: "sarah@luxebeauty.com",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "STAFF" as const,
      phone: "5554444444",
      staffData: {
        displayName: "Sarah J.",
        title: "Senior Stylist",
        bio: "Color specialist with 10 years experience",
        color: "#F43F5E",
        specialties: ["Hair Color", "Highlights", "Balayage"],
        employmentType: "EMPLOYEE" as const,
        payType: "COMMISSION" as const,
        commissionPct: 45,
      },
    },
    {
      email: "ashley@luxebeauty.com",
      firstName: "Ashley",
      lastName: "Williams",
      role: "STAFF" as const,
      phone: "5555555555",
      staffData: {
        displayName: "Ashley W.",
        title: "Stylist",
        bio: "Specializing in cuts and styling",
        color: "#8B5CF6",
        specialties: ["Haircuts", "Blowouts", "Styling"],
        employmentType: "EMPLOYEE" as const,
        payType: "HYBRID" as const,
        hourlyRate: 15,
        commissionPct: 35,
      },
    },
    {
      email: "michelle@luxebeauty.com",
      firstName: "Michelle",
      lastName: "Tran",
      role: "STAFF" as const,
      phone: "5556666666",
      staffData: {
        displayName: "Michelle T.",
        title: "Nail Technician",
        bio: "Expert nail artist, fluent in Vietnamese",
        color: "#EC4899",
        specialties: ["Gel Nails", "Nail Art", "Pedicures"],
        employmentType: "EMPLOYEE" as const,
        payType: "COMMISSION" as const,
        commissionPct: 50,
      },
    },
    {
      email: "david@luxebeauty.com",
      firstName: "David",
      lastName: "Chen",
      role: "STAFF" as const,
      phone: "5557777777",
      staffData: {
        displayName: "David C.",
        title: "Barber",
        bio: "Master barber with classic and modern cuts",
        color: "#3B82F6",
        specialties: ["Men's Cuts", "Beard Trim", "Hot Shave"],
        employmentType: "BOOTH_RENTER" as const,
        boothRent: 400,
        rentFrequency: "weekly",
      },
    },
    {
      email: "emma@luxebeauty.com",
      firstName: "Emma",
      lastName: "Davis",
      role: "STAFF" as const,
      phone: "5558888888",
      staffData: {
        displayName: "Emma D.",
        title: "Esthetician",
        bio: "Skincare expert specializing in facials",
        color: "#10B981",
        specialties: ["Facials", "Waxing", "Skincare"],
        employmentType: "EMPLOYEE" as const,
        payType: "COMMISSION" as const,
        commissionPct: 45,
      },
    },
  ];

  const users = [];
  for (const userData of usersData) {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        phone: userData.phone,
        businessId: business.id,
      },
    });
    users.push(user);

    // Create staff record if staffData exists
    if (userData.staffData) {
      await prisma.staff.create({
        data: {
          userId: user.id,
          locationId: locations[0].id,
          displayName: userData.staffData.displayName,
          title: userData.staffData.title,
          bio: userData.staffData.bio,
          color: userData.staffData.color,
          specialties: userData.staffData.specialties,
          employmentType: userData.staffData.employmentType,
          payType: userData.staffData.payType,
          hourlyRate: userData.staffData.hourlyRate,
          commissionPct: userData.staffData.commissionPct,
          boothRent: userData.staffData.boothRent,
          rentFrequency: userData.staffData.rentFrequency,
        },
      });
    }
  }
  console.log("Created users:", users.length);

  // Create Service Categories
  const serviceCategories = await Promise.all([
    prisma.serviceCategory.create({
      data: {
        businessId: business.id,
        name: "Hair Services",
        description: "Cuts, color, styling and treatments",
        color: "#F43F5E",
        sortOrder: 1,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        businessId: business.id,
        name: "Nail Services",
        description: "Manicures, pedicures, and nail art",
        color: "#EC4899",
        sortOrder: 2,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        businessId: business.id,
        name: "Spa & Facial",
        description: "Facials, skincare, and relaxation",
        color: "#10B981",
        sortOrder: 3,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        businessId: business.id,
        name: "Barbershop",
        description: "Men's grooming services",
        color: "#3B82F6",
        sortOrder: 4,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        businessId: business.id,
        name: "Lash & Brow",
        description: "Lash extensions and brow services",
        color: "#8B5CF6",
        sortOrder: 5,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        businessId: business.id,
        name: "Waxing",
        description: "Hair removal services",
        color: "#F59E0B",
        sortOrder: 6,
      },
    }),
  ]);
  console.log("Created service categories:", serviceCategories.length);

  // Create Services
  const servicesData = [
    // Hair Services
    { categoryIdx: 0, name: "Women's Haircut", price: 45, duration: 45 },
    { categoryIdx: 0, name: "Men's Haircut", price: 25, duration: 30 },
    { categoryIdx: 0, name: "Children's Haircut", price: 20, duration: 20 },
    { categoryIdx: 0, name: "Blowout", price: 40, duration: 30 },
    { categoryIdx: 0, name: "Full Color", price: 120, duration: 120 },
    { categoryIdx: 0, name: "Root Touch-up", price: 75, duration: 75 },
    { categoryIdx: 0, name: "Partial Highlights", price: 120, duration: 90 },
    { categoryIdx: 0, name: "Full Highlights", price: 180, duration: 150 },
    { categoryIdx: 0, name: "Balayage", price: 200, duration: 180 },
    { categoryIdx: 0, name: "Keratin Treatment", price: 250, duration: 180 },
    // Nail Services
    { categoryIdx: 1, name: "Manicure", price: 25, duration: 30 },
    { categoryIdx: 1, name: "Pedicure", price: 40, duration: 45 },
    { categoryIdx: 1, name: "Gel Manicure", price: 35, duration: 45 },
    { categoryIdx: 1, name: "Gel Pedicure", price: 50, duration: 60 },
    { categoryIdx: 1, name: "Acrylic Full Set", price: 55, duration: 75 },
    { categoryIdx: 1, name: "Acrylic Fill", price: 35, duration: 45 },
    { categoryIdx: 1, name: "Nail Art", price: 15, duration: 15, priceType: "STARTING_AT" as const },
    // Spa & Facial
    { categoryIdx: 2, name: "Express Facial", price: 65, duration: 30 },
    { categoryIdx: 2, name: "Classic Facial", price: 85, duration: 60 },
    { categoryIdx: 2, name: "Anti-Aging Facial", price: 120, duration: 75 },
    { categoryIdx: 2, name: "Hydrafacial", price: 175, duration: 60 },
    // Barbershop
    { categoryIdx: 3, name: "Buzz Cut", price: 15, duration: 15 },
    { categoryIdx: 3, name: "Classic Cut", price: 25, duration: 30 },
    { categoryIdx: 3, name: "Beard Trim", price: 15, duration: 15 },
    { categoryIdx: 3, name: "Hot Towel Shave", price: 30, duration: 30 },
    // Lash & Brow
    { categoryIdx: 4, name: "Lash Lift", price: 75, duration: 45 },
    { categoryIdx: 4, name: "Classic Lash Extensions", price: 150, duration: 90 },
    { categoryIdx: 4, name: "Volume Lash Extensions", price: 200, duration: 120 },
    { categoryIdx: 4, name: "Brow Wax", price: 18, duration: 15 },
    { categoryIdx: 4, name: "Brow Tint", price: 20, duration: 15 },
    // Waxing
    { categoryIdx: 5, name: "Lip Wax", price: 12, duration: 10 },
    { categoryIdx: 5, name: "Chin Wax", price: 12, duration: 10 },
    { categoryIdx: 5, name: "Underarm Wax", price: 20, duration: 15 },
    { categoryIdx: 5, name: "Half Leg Wax", price: 35, duration: 30 },
    { categoryIdx: 5, name: "Full Leg Wax", price: 60, duration: 45 },
    { categoryIdx: 5, name: "Brazilian Wax", price: 55, duration: 30 },
  ];

  const services = [];
  for (const serviceData of servicesData) {
    const service = await prisma.service.create({
      data: {
        businessId: business.id,
        categoryId: serviceCategories[serviceData.categoryIdx].id,
        name: serviceData.name,
        price: serviceData.price,
        duration: serviceData.duration,
        priceType: serviceData.priceType || "FIXED",
      },
    });
    services.push(service);
  }
  console.log("Created services:", services.length);

  // Create Product Categories
  const productCategories = await Promise.all([
    prisma.productCategory.create({
      data: { businessId: business.id, name: "Hair Care", sortOrder: 1 },
    }),
    prisma.productCategory.create({
      data: { businessId: business.id, name: "Styling", sortOrder: 2 },
    }),
    prisma.productCategory.create({
      data: { businessId: business.id, name: "Skincare", sortOrder: 3 },
    }),
    prisma.productCategory.create({
      data: { businessId: business.id, name: "Nail Products", sortOrder: 4 },
    }),
  ]);
  console.log("Created product categories:", productCategories.length);

  // Create Products (20+ products)
  const productsData = [
    // Hair Care
    { categoryIdx: 0, name: "Moroccan Oil Shampoo", brand: "Moroccanoil", price: 28, cost: 14, qty: 25 },
    { categoryIdx: 0, name: "Moroccan Oil Conditioner", brand: "Moroccanoil", price: 28, cost: 14, qty: 22 },
    { categoryIdx: 0, name: "Olaplex No. 3", brand: "Olaplex", price: 28, cost: 15, qty: 18 },
    { categoryIdx: 0, name: "Olaplex No. 4 Shampoo", brand: "Olaplex", price: 30, cost: 16, qty: 20 },
    { categoryIdx: 0, name: "Olaplex No. 5 Conditioner", brand: "Olaplex", price: 30, cost: 16, qty: 17 },
    { categoryIdx: 0, name: "Redken Color Extend Shampoo", brand: "Redken", price: 24, cost: 12, qty: 30 },
    { categoryIdx: 0, name: "Pureology Hydrate Shampoo", brand: "Pureology", price: 35, cost: 18, qty: 15 },
    // Styling
    { categoryIdx: 1, name: "Moroccan Oil Treatment", brand: "Moroccanoil", price: 44, cost: 22, qty: 15 },
    { categoryIdx: 1, name: "Kenra Volume Spray 25", brand: "Kenra", price: 22, cost: 11, qty: 30 },
    { categoryIdx: 1, name: "Sebastian Shaper Plus", brand: "Sebastian", price: 20, cost: 10, qty: 28 },
    { categoryIdx: 1, name: "Bumble and Bumble Thickening Spray", brand: "Bumble and Bumble", price: 32, cost: 16, qty: 20 },
    { categoryIdx: 1, name: "Living Proof Perfect Hair Day", brand: "Living Proof", price: 29, cost: 15, qty: 18 },
    { categoryIdx: 1, name: "CHI Silk Infusion", brand: "CHI", price: 18, cost: 9, qty: 35 },
    // Skincare
    { categoryIdx: 2, name: "CeraVe Cleanser", brand: "CeraVe", price: 18, cost: 9, qty: 35 },
    { categoryIdx: 2, name: "The Ordinary Niacinamide", brand: "The Ordinary", price: 12, cost: 6, qty: 40 },
    { categoryIdx: 2, name: "La Roche-Posay SPF 50", brand: "La Roche-Posay", price: 35, cost: 18, qty: 25 },
    { categoryIdx: 2, name: "CeraVe Moisturizing Cream", brand: "CeraVe", price: 22, cost: 11, qty: 30 },
    { categoryIdx: 2, name: "Paula's Choice BHA Exfoliant", brand: "Paula's Choice", price: 32, cost: 16, qty: 20 },
    // Nail Products
    { categoryIdx: 3, name: "OPI Nail Lacquer", brand: "OPI", price: 12, cost: 6, qty: 50 },
    { categoryIdx: 3, name: "Essie Gel Couture", brand: "Essie", price: 14, cost: 7, qty: 45 },
    { categoryIdx: 3, name: "CND Vinylux", brand: "CND", price: 11, cost: 5, qty: 55 },
    { categoryIdx: 3, name: "OPI Nail Envy Strengthener", brand: "OPI", price: 18, cost: 9, qty: 25 },
    { categoryIdx: 3, name: "Zoya Nail Polish", brand: "Zoya", price: 10, cost: 5, qty: 60 },
  ];

  for (const productData of productsData) {
    await prisma.product.create({
      data: {
        businessId: business.id,
        categoryId: productCategories[productData.categoryIdx].id,
        name: productData.name,
        brand: productData.brand,
        price: productData.price,
        cost: productData.cost,
        quantityOnHand: productData.qty,
        reorderLevel: 5,
      },
    });
  }
  console.log("Created products:", productsData.length);

  // Create Clients (25+ clients)
  const clientsData = [
    { firstName: "Sarah", lastName: "Johnson", email: "sarah.johnson@email.com", phone: "5551234567", status: "VIP" as const },
    { firstName: "Emily", lastName: "Chen", email: "emily.chen@email.com", phone: "5552345678", status: "ACTIVE" as const },
    { firstName: "Jessica", lastName: "Williams", email: "jessica.w@email.com", phone: "5553456789", status: "ACTIVE" as const },
    { firstName: "Amanda", lastName: "Garcia", email: "amanda.g@email.com", phone: "5554567890", status: "ACTIVE" as const },
    { firstName: "Nicole", lastName: "Brown", email: "nicole.b@email.com", phone: "5555678901", status: "VIP" as const },
    { firstName: "Rachel", lastName: "Lee", email: "rachel.l@email.com", phone: "5556789012", status: "ACTIVE" as const },
    { firstName: "Michelle", lastName: "Taylor", email: "michelle.t@email.com", phone: "5557890123", status: "ACTIVE" as const },
    { firstName: "Jennifer", lastName: "Anderson", email: "jennifer.a@email.com", phone: "5558901234", status: "ACTIVE" as const },
    { firstName: "Lisa", lastName: "Thomas", email: "lisa.t@email.com", phone: "5559012345", status: "INACTIVE" as const },
    { firstName: "Karen", lastName: "Jackson", email: "karen.j@email.com", phone: "5550123456", status: "ACTIVE" as const },
    { firstName: "Sophia", lastName: "Martinez", email: "sophia.m@email.com", phone: "5551112222", status: "VIP" as const },
    { firstName: "Olivia", lastName: "Rodriguez", email: "olivia.r@email.com", phone: "5552223333", status: "ACTIVE" as const },
    { firstName: "Isabella", lastName: "Hernandez", email: "isabella.h@email.com", phone: "5553334444", status: "ACTIVE" as const },
    { firstName: "Mia", lastName: "Lopez", email: "mia.l@email.com", phone: "5554445555", status: "ACTIVE" as const },
    { firstName: "Charlotte", lastName: "Gonzalez", email: "charlotte.g@email.com", phone: "5555556666", status: "VIP" as const },
    { firstName: "Amelia", lastName: "Wilson", email: "amelia.w@email.com", phone: "5556667777", status: "ACTIVE" as const },
    { firstName: "Harper", lastName: "Moore", email: "harper.m@email.com", phone: "5557778888", status: "ACTIVE" as const },
    { firstName: "Evelyn", lastName: "Taylor", email: "evelyn.t@email.com", phone: "5558889999", status: "INACTIVE" as const },
    { firstName: "Abigail", lastName: "Davis", email: "abigail.d@email.com", phone: "5559990000", status: "ACTIVE" as const },
    { firstName: "Luna", lastName: "White", email: "luna.w@email.com", phone: "5550001111", status: "ACTIVE" as const },
    { firstName: "Ella", lastName: "Harris", email: "ella.h@email.com", phone: "5551119999", status: "ACTIVE" as const },
    { firstName: "Scarlett", lastName: "Clark", email: "scarlett.c@email.com", phone: "5552228888", status: "VIP" as const },
    { firstName: "Victoria", lastName: "Lewis", email: "victoria.l@email.com", phone: "5553337777", status: "ACTIVE" as const },
    { firstName: "Grace", lastName: "Robinson", email: "grace.r@email.com", phone: "5554446666", status: "ACTIVE" as const },
    { firstName: "Chloe", lastName: "Walker", email: "chloe.w@email.com", phone: "5555555555", status: "VIP" as const },
  ];

  const clients = [];
  for (const clientData of clientsData) {
    const client = await prisma.client.create({
      data: {
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        email: clientData.email,
        phone: clientData.phone,
        status: clientData.status,
        allowSms: true,
        allowEmail: true,
        tags: clientData.status === "VIP" ? ["VIP", "Regular"] : ["Regular"],
      },
    });
    clients.push(client);
  }
  console.log("Created clients:", clients.length);

  // Create Loyalty Program
  const loyaltyProgram = await prisma.loyaltyProgram.create({
    data: {
      businessId: business.id,
      name: "Luxe Rewards",
      pointsPerDollar: 1,
      bonusOnSignup: 100,
      bonusOnBirthday: 50,
      bonusOnReferral: 100,
      tiers: [
        { name: "Bronze", minPoints: 0, benefits: ["1 point per $1"] },
        { name: "Silver", minPoints: 500, benefits: ["1.25 points per $1", "10% off products"] },
        { name: "Gold", minPoints: 1000, benefits: ["1.5 points per $1", "15% off products", "Priority booking"] },
        { name: "Platinum", minPoints: 2000, benefits: ["2 points per $1", "20% off products", "Priority booking", "Free birthday service"] },
      ],
    },
  });
  console.log("Created loyalty program");

  // Create Loyalty Rewards (25+ rewards)
  const rewardsData = [
    { name: "$10 Off Any Service", pointsCost: 200, type: "discount_amount", value: 10 },
    { name: "Free Add-On Service", pointsCost: 150, type: "free_service", value: 25 },
    { name: "20% Off Products", pointsCost: 300, type: "discount_percent", value: 20 },
    { name: "Free Blowout", pointsCost: 400, type: "free_service", value: 40 },
    { name: "$25 Off Any Service", pointsCost: 450, type: "discount_amount", value: 25 },
    { name: "Free Manicure", pointsCost: 300, type: "free_service", value: 25 },
    { name: "Free Express Facial", pointsCost: 600, type: "free_service", value: 65 },
    { name: "15% Off Entire Purchase", pointsCost: 250, type: "discount_percent", value: 15 },
    { name: "Free Product Sample Set", pointsCost: 100, type: "free_product", value: 20 },
    { name: "VIP Priority Booking", pointsCost: 500, type: "perk", value: 0 },
    { name: "$50 Off Color Service", pointsCost: 800, type: "discount_amount", value: 50 },
    { name: "Free Deep Conditioning Treatment", pointsCost: 200, type: "free_service", value: 30 },
    { name: "30% Off Next Visit", pointsCost: 600, type: "discount_percent", value: 30 },
    { name: "Free Brow Wax", pointsCost: 150, type: "free_service", value: 18 },
    { name: "Birthday Double Points", pointsCost: 100, type: "perk", value: 0 },
    { name: "Free Pedicure", pointsCost: 350, type: "free_service", value: 40 },
    { name: "$15 Off Any Service", pointsCost: 275, type: "discount_amount", value: 15 },
    { name: "Free Gel Manicure", pointsCost: 325, type: "free_service", value: 35 },
    { name: "25% Off Products", pointsCost: 375, type: "discount_percent", value: 25 },
    { name: "Free Lash Lift", pointsCost: 700, type: "free_service", value: 75 },
    { name: "$75 Off Balayage", pointsCost: 1000, type: "discount_amount", value: 75 },
    { name: "Free Hot Towel Shave", pointsCost: 280, type: "free_service", value: 30 },
    { name: "10% Off All Services", pointsCost: 175, type: "discount_percent", value: 10 },
    { name: "Free Lip Wax", pointsCost: 100, type: "free_service", value: 12 },
    { name: "$100 Off Keratin Treatment", pointsCost: 1200, type: "discount_amount", value: 100 },
  ];
  for (const reward of rewardsData) {
    await prisma.loyaltyReward.create({
      data: {
        programId: loyaltyProgram.id,
        ...reward,
      },
    });
  }
  console.log("Created loyalty rewards:", rewardsData.length);

  // Create Loyalty Accounts for clients
  for (const client of clients) {
    const points = Math.floor(Math.random() * 2500);
    let tier = "Bronze";
    if (points >= 2000) tier = "Platinum";
    else if (points >= 1000) tier = "Gold";
    else if (points >= 500) tier = "Silver";

    await prisma.loyaltyAccount.create({
      data: {
        clientId: client.id,
        programId: loyaltyProgram.id,
        pointsBalance: points,
        lifetimePoints: points + Math.floor(Math.random() * 500),
        tier,
      },
    });
  }
  console.log("Created loyalty accounts");

  // Create Automations (25+ automations)
  const automationsData = [
    { name: "Appointment Reminder (24hr)", description: "Send SMS reminder 24 hours before appointment", triggerType: "appointment_reminder", triggerConfig: { hours: 24 }, actions: [{ type: "send_sms", template: "appointment_reminder" }] },
    { name: "Appointment Reminder (2hr)", description: "Send SMS reminder 2 hours before appointment", triggerType: "appointment_reminder", triggerConfig: { hours: 2 }, actions: [{ type: "send_sms", template: "appointment_reminder_2hr" }] },
    { name: "Post-Visit Thank You", description: "Send thank you email after appointment", triggerType: "appointment_completed", actions: [{ type: "send_email", template: "thank_you" }] },
    { name: "Birthday Special", description: "Send birthday discount on client's birthday", triggerType: "birthday", actions: [{ type: "send_sms", template: "birthday_offer" }] },
    { name: "No-Show Follow-up", description: "Send message after no-show", triggerType: "no_show", actions: [{ type: "send_sms", template: "no_show_followup" }] },
    { name: "Re-engagement (60 days)", description: "Send offer to inactive clients after 60 days", triggerType: "inactive_client", triggerConfig: { days: 60 }, actions: [{ type: "send_email", template: "come_back" }] },
    { name: "Re-engagement (90 days)", description: "Send special offer to inactive clients after 90 days", triggerType: "inactive_client", triggerConfig: { days: 90 }, actions: [{ type: "send_email", template: "miss_you" }] },
    { name: "Review Request", description: "Ask for review 24 hours after appointment", triggerType: "appointment_completed", triggerConfig: { delay: 24 }, actions: [{ type: "send_email", template: "review_request" }] },
    { name: "New Client Welcome", description: "Send welcome email to new clients", triggerType: "new_client", actions: [{ type: "send_email", template: "welcome" }] },
    { name: "Loyalty Points Earned", description: "Notify when points are earned", triggerType: "points_earned", actions: [{ type: "send_sms", template: "points_earned" }] },
    { name: "Loyalty Tier Upgrade", description: "Congratulate on tier upgrade", triggerType: "tier_upgrade", actions: [{ type: "send_email", template: "tier_upgrade" }] },
    { name: "Appointment Cancelled", description: "Send cancellation confirmation", triggerType: "appointment_cancelled", actions: [{ type: "send_email", template: "cancellation_confirm" }] },
    { name: "Rebooking Reminder", description: "Remind to rebook after 4 weeks", triggerType: "post_visit", triggerConfig: { days: 28 }, actions: [{ type: "send_sms", template: "rebook_reminder" }] },
    { name: "Low Stock Alert", description: "Notify staff when product is low", triggerType: "low_stock", actions: [{ type: "internal_notify", template: "low_stock" }] },
    { name: "VIP Special Treatment", description: "Send VIP-only offers", triggerType: "vip_status", actions: [{ type: "send_email", template: "vip_exclusive" }] },
    { name: "Appointment Confirmation", description: "Send confirmation after booking", triggerType: "appointment_booked", actions: [{ type: "send_email", template: "appointment_confirmed" }] },
    { name: "Gift Card Received", description: "Notify recipient of gift card", triggerType: "gift_card_purchased", actions: [{ type: "send_email", template: "gift_card_received" }] },
    { name: "Referral Thank You", description: "Thank clients for referrals", triggerType: "referral_completed", actions: [{ type: "send_sms", template: "referral_thanks" }] },
    { name: "Weekly Digest", description: "Send weekly appointment summary to staff", triggerType: "weekly_schedule", actions: [{ type: "internal_notify", template: "weekly_digest" }] },
    { name: "Service Follow-up", description: "Follow up after specific services", triggerType: "service_completed", actions: [{ type: "send_email", template: "service_followup" }] },
    { name: "Product Reorder Reminder", description: "Remind clients to reorder products", triggerType: "product_reorder", triggerConfig: { days: 30 }, actions: [{ type: "send_email", template: "reorder_reminder" }] },
    { name: "Anniversary Celebration", description: "Celebrate client anniversary", triggerType: "anniversary", actions: [{ type: "send_email", template: "anniversary" }] },
    { name: "Appointment Reschedule", description: "Send reschedule confirmation", triggerType: "appointment_rescheduled", actions: [{ type: "send_sms", template: "reschedule_confirm" }] },
    { name: "Payment Receipt", description: "Send receipt after payment", triggerType: "payment_completed", actions: [{ type: "send_email", template: "payment_receipt" }] },
    { name: "Waitlist Notification", description: "Notify when spot becomes available", triggerType: "waitlist_available", actions: [{ type: "send_sms", template: "waitlist_available" }] },
  ];
  for (const automation of automationsData) {
    await prisma.automation.create({
      data: {
        businessId: business.id,
        ...automation,
      },
    });
  }
  console.log("Created automations:", automationsData.length);

  // Get staff members for appointments
  const staffMembers = await prisma.staff.findMany({
    take: 5,
  });

  // Create Sample Appointments (30+ appointments)
  const today = new Date();
  const appointmentsData = [];

  for (let i = 0; i < 35; i++) {
    const dayOffset = Math.floor(Math.random() * 14) - 7; // -7 to +7 days
    const hour = 9 + Math.floor(Math.random() * 9); // 9am to 6pm
    const appointmentDate = new Date(today);
    appointmentDate.setDate(today.getDate() + dayOffset);
    appointmentDate.setHours(hour, 0, 0, 0);

    const endDate = new Date(appointmentDate);
    endDate.setMinutes(endDate.getMinutes() + services[Math.floor(Math.random() * 10)].duration);

    const status = dayOffset < 0
      ? (Math.random() > 0.2 ? "completed" : (Math.random() > 0.5 ? "cancelled" : "no_show"))
      : (Math.random() > 0.3 ? "confirmed" : "booked");

    const statusMap: Record<string, string> = {
      completed: "COMPLETED",
      cancelled: "CANCELLED",
      no_show: "NO_SHOW",
      confirmed: "CONFIRMED",
      booked: "BOOKED",
    };

    const sourceMap: Record<string, string> = {
      online: "ONLINE",
      phone: "PHONE",
      walk_in: "WALK_IN",
      app: "APP",
    };

    const sourceKey = ["online", "phone", "walk_in", "app"][Math.floor(Math.random() * 4)];

    const aptEntry: any = {
      clientId: clients[Math.floor(Math.random() * clients.length)].id,
      locationId: locations[0].id,
      scheduledStart: appointmentDate,
      scheduledEnd: endDate,
      status: statusMap[status] as any,
      source: sourceMap[sourceKey] as any,
    };
    if (staffMembers.length > 0) {
      aptEntry.staffId = staffMembers[Math.floor(Math.random() * staffMembers.length)].id;
    }
    appointmentsData.push(aptEntry);
  }

  for (const aptData of appointmentsData) {
    if (aptData.staffId) {
      const apt = await prisma.appointment.create({
        data: aptData,
      });

      // Add service to appointment
      await prisma.appointmentService.create({
        data: {
          appointmentId: apt.id,
          serviceId: services[Math.floor(Math.random() * 10)].id,
          price: services[Math.floor(Math.random() * 10)].price,
          duration: services[Math.floor(Math.random() * 10)].duration,
        },
      });
    }
  }
  console.log("Created appointments:", appointmentsData.length);

  // Create Sample Transactions (50+ transactions)
  for (let i = 0; i < 50; i++) {
    const dayOffset = Math.floor(Math.random() * 30);
    const transactionDate = new Date(today);
    transactionDate.setDate(today.getDate() - dayOffset);

    const subtotal = 50 + Math.floor(Math.random() * 200);
    const tax = subtotal * 0.0875;
    const tip = Math.random() > 0.3 ? Math.floor(subtotal * 0.15 + Math.random() * 10) : 0;
    const discount = Math.random() > 0.8 ? Math.floor(subtotal * 0.1) : 0;

    const transaction = await prisma.transaction.create({
      data: {
        transactionNumber: `TXN-${Date.now()}-${i}`,
        locationId: locations[0].id,
        clientId: clients[Math.floor(Math.random() * clients.length)].id,
        ...(staffMembers.length > 0 ? { staffId: staffMembers[Math.floor(Math.random() * staffMembers.length)].id } : {}),
        subtotal,
        taxAmount: tax,
        discountAmount: discount,
        tipAmount: tip,
        totalAmount: subtotal - discount + tax + tip,
        date: transactionDate,
        type: "SALE",
        status: "COMPLETED",
      },
    });

    // Add transaction line items
    const numItems = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numItems; j++) {
      const isService = Math.random() > 0.3;
      if (isService) {
        const service = services[Math.floor(Math.random() * services.length)];
        await prisma.transactionLineItem.create({
          data: {
            transactionId: transaction.id,
            type: "SERVICE",
            serviceId: service.id,
            name: service.name,
            quantity: 1,
            unitPrice: service.price,
            totalPrice: service.price,
          },
        });
      }
    }

    // Add payment record
    const paymentMethod = ["CREDIT_CARD", "CASH", "DEBIT_CARD"][Math.floor(Math.random() * 3)] as "CREDIT_CARD" | "CASH" | "DEBIT_CARD";
    await prisma.transactionPayment.create({
      data: {
        transactionId: transaction.id,
        method: paymentMethod,
        amount: subtotal - discount + tax + tip,
      },
    });
  }
  console.log("Created transactions: 50");

  // Create Gift Cards (25+ gift cards)
  const giftCardCodes = [
    { code: "GIFT2024001", amount: 50 },
    { code: "GIFT2024002", amount: 100 },
    { code: "GIFT2024003", amount: 75 },
    { code: "WELCOME50", amount: 50 },
    { code: "BIRTHDAY100", amount: 100 },
    { code: "HOLIDAY25", amount: 25 },
    { code: "MOTHERSDAY", amount: 150 },
    { code: "VALENTINES", amount: 75 },
    { code: "THANKYOU50", amount: 50 },
    { code: "REFERRAL25", amount: 25 },
    { code: "NEWYEAR100", amount: 100 },
    { code: "GRADUATION", amount: 200 },
    { code: "CORPORATE01", amount: 500 },
    { code: "CORPORATE02", amount: 250 },
    { code: "PROMO2024A", amount: 30 },
    { code: "PROMO2024B", amount: 40 },
    { code: "WEDDING150", amount: 150 },
    { code: "BRIDALPARTY", amount: 100 },
    { code: "LOYALTY500", amount: 500 },
    { code: "EMPLOYEE50", amount: 50 },
    { code: "SPRING2024", amount: 60 },
    { code: "SUMMER2024", amount: 80 },
    { code: "FALL2024", amount: 70 },
    { code: "WINTER2024", amount: 90 },
    { code: "BLACKFRIDAY", amount: 125 },
  ];
  for (const gc of giftCardCodes) {
    const currentBalance = gc.amount - Math.floor(Math.random() * gc.amount * 0.5);

    await prisma.giftCard.create({
      data: {
        businessId: business.id,
        code: gc.code,
        initialBalance: gc.amount,
        currentBalance,
        status: currentBalance > 0 ? "active" : "redeemed",
        purchasedAt: new Date(today.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000),
        recipientName: ["Gift Recipient", "Birthday Gift", "Holiday Gift", "Thank You Gift"][Math.floor(Math.random() * 4)],
      },
    });
  }
  console.log("Created gift cards:", giftCardCodes.length);

  // Create Reviews (25+ reviews)
  const reviewComments = [
    "Amazing experience! Sarah did a fantastic job on my highlights.",
    "Love the atmosphere and the team is so friendly. Will definitely be back!",
    "Best salon in town. My nails have never looked better!",
    "Great service but had to wait a bit longer than expected.",
    "Michelle is an absolute artist with nail art. Highly recommend!",
    "Perfect haircut, exactly what I wanted. Thank you!",
    "The facial was so relaxing. My skin feels amazing!",
    "Good service overall, prices are reasonable for the quality.",
    "Incredible color work! My balayage looks stunning.",
    "Very professional staff. Clean and modern facility.",
    "Best pedicure I've ever had. So relaxing!",
    "Fast service without compromising quality. Impressive!",
    "The products they use are top quality. My hair feels so healthy.",
    "Friendly reception desk, made booking super easy.",
    "Been coming here for years. Never disappointed!",
    "The lash extensions look so natural. Love them!",
    "Great experience from start to finish. Highly recommend!",
    "Parking can be tricky but worth it for the service.",
    "Ashley is amazing with scissors. Best haircut ever!",
    "The deep conditioning treatment transformed my hair.",
  ];

  for (let i = 0; i < 25; i++) {
    const rating = 3 + Math.floor(Math.random() * 3); // 3-5 stars
    const reviewDate = new Date(today);
    reviewDate.setDate(today.getDate() - Math.floor(Math.random() * 60));
    const sources = ["GOOGLE", "YELP", "FACEBOOK", "INTERNAL"];

    await prisma.review.create({
      data: {
        clientId: clients[Math.floor(Math.random() * clients.length)].id,
        rating,
        comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        isPublic: Math.random() > 0.1,
        response: Math.random() > 0.6 ? "Thank you for your wonderful feedback! We're so glad you enjoyed your experience with us." : undefined,
        respondedAt: Math.random() > 0.6 ? new Date(reviewDate.getTime() + 24 * 60 * 60 * 1000) : undefined,
        createdAt: reviewDate,
      },
    });
  }
  console.log("Created reviews: 25");

  // Create Marketing Campaigns (25+ campaigns)
  const campaignsData = [
    { name: "Summer Special", type: "EMAIL" as const, subject: "Beat the Heat with 20% Off All Hair Services!", content: "Summer is here! Book your appointment now and get 20% off all hair services.", status: "sent", sentAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), sentCount: 450, openCount: 180, clickCount: 45 },
    { name: "Birthday Club", type: "SMS" as const, subject: "Happy Birthday!", content: "Happy Birthday! Enjoy a FREE blowout on us this month.", status: "active" },
    { name: "New Client Welcome", type: "EMAIL" as const, subject: "Welcome to Luxe Beauty Studio!", content: "Welcome to the Luxe family! Here's 15% off your first service.", status: "active" },
    { name: "Holiday Promo", type: "EMAIL" as const, subject: "Holiday Gift Guide + Special Offers", content: "Find the perfect gift for everyone on your list.", status: "draft" },
    { name: "Valentine's Day Special", type: "EMAIL" as const, subject: "Treat Yourself This Valentine's Day", content: "Book a couples spa day or pamper yourself with our special packages.", status: "scheduled", scheduledAt: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) },
    { name: "Mother's Day Campaign", type: "EMAIL" as const, subject: "Give Mom the Gift of Beauty", content: "Show mom you care with a luxe gift card or spa package.", status: "sent", sentAt: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000), sentCount: 380, openCount: 150, clickCount: 35 },
    { name: "Back to School", type: "SMS" as const, subject: "Back to School Styles!", content: "Kids haircuts 20% off all August!", status: "sent", sentAt: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), sentCount: 520, openCount: 0, clickCount: 0 },
    { name: "Fall Hair Trends", type: "EMAIL" as const, subject: "Hot Fall Hair Trends You Need to Try", content: "From warm balayage to trendy cuts, discover what's hot this season.", status: "sent", sentAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), sentCount: 420, openCount: 195, clickCount: 52 },
    { name: "Referral Program", type: "EMAIL" as const, subject: "Refer a Friend, Get $25!", content: "Know someone who'd love our salon? Refer them and you both win!", status: "active" },
    { name: "VIP Exclusive", type: "EMAIL" as const, subject: "You're Invited: VIP Early Access", content: "As a valued VIP member, get early access to our new services.", status: "sent", sentAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000), sentCount: 85, openCount: 65, clickCount: 28 },
    { name: "Weekend Flash Sale", type: "SMS" as const, subject: "Flash Sale!", content: "This weekend only: 30% off all nail services!", status: "sent", sentAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), sentCount: 480, openCount: 0, clickCount: 0 },
    { name: "Loyalty Points Reminder", type: "EMAIL" as const, subject: "Don't Let Your Points Expire!", content: "You have loyalty points waiting to be redeemed.", status: "active" },
    { name: "Re-engagement Campaign", type: "EMAIL" as const, subject: "We Miss You! Come Back for 20% Off", content: "It's been a while since your last visit. Here's a special offer.", status: "active" },
    { name: "New Service Launch", type: "EMAIL" as const, subject: "Introducing: Hydrafacial - Now Available!", content: "Experience the latest in skincare technology.", status: "sent", sentAt: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000), sentCount: 400, openCount: 210, clickCount: 78 },
    { name: "Staff Spotlight", type: "EMAIL" as const, subject: "Meet Ashley - Our New Color Expert", content: "Get to know our talented new team member.", status: "sent", sentAt: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000), sentCount: 390, openCount: 120, clickCount: 15 },
    { name: "Bridal Package Promo", type: "EMAIL" as const, subject: "Say 'I Do' to Gorgeous Hair", content: "Book your bridal party and get the bride's trial free!", status: "active" },
    { name: "Winter Skincare", type: "EMAIL" as const, subject: "Winter Skin SOS - Solutions Inside", content: "Combat dry winter skin with our facial treatments.", status: "draft" },
    { name: "Anniversary Sale", type: "EMAIL" as const, subject: "Celebrating 5 Years - Special Offers!", content: "Thank you for being part of our journey. Here's 25% off!", status: "scheduled", scheduledAt: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000) },
    { name: "New Year New You", type: "EMAIL" as const, subject: "New Year, New Look - Book Now!", content: "Start the year fresh with a new style.", status: "draft" },
    { name: "Product Launch", type: "EMAIL" as const, subject: "Now Stocking: Olaplex Products!", content: "Your favorite products are now available for purchase.", status: "sent", sentAt: new Date(today.getTime() - 50 * 24 * 60 * 60 * 1000), sentCount: 410, openCount: 185, clickCount: 95 },
    { name: "Spring Refresh", type: "EMAIL" as const, subject: "Spring Into a New Look!", content: "Freshen up your style this spring with our seasonal specials.", status: "sent", sentAt: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000), sentCount: 380, openCount: 160, clickCount: 42 },
    { name: "Thanksgiving Thanks", type: "EMAIL" as const, subject: "Thank You for Being Part of Our Family", content: "As a token of our appreciation, enjoy 15% off your next visit.", status: "sent", sentAt: new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000), sentCount: 420, openCount: 190, clickCount: 55 },
    { name: "Father's Day Grooming", type: "SMS" as const, subject: "Treat Dad Right!", content: "Book a grooming session for Dad and get 20% off!", status: "sent", sentAt: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000), sentCount: 280, openCount: 0, clickCount: 0 },
    { name: "Prom Season Special", type: "EMAIL" as const, subject: "Look Perfect for Prom!", content: "Hair, makeup, and nails - we've got you covered for the big night.", status: "sent", sentAt: new Date(today.getTime() - 200 * 24 * 60 * 60 * 1000), sentCount: 150, openCount: 95, clickCount: 38 },
    { name: "Black Friday Deals", type: "EMAIL" as const, subject: "Our Biggest Sale of the Year!", content: "Up to 40% off services and gift cards. One day only!", status: "sent", sentAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), sentCount: 520, openCount: 320, clickCount: 145 },
  ];

  for (const campaign of campaignsData) {
    await prisma.campaign.create({
      data: {
        businessId: business.id,
        ...campaign,
      },
    });
  }
  console.log("Created campaigns:", campaignsData.length);

  // Create Activities for Clients
  const activityTypes = [
    { type: "APPOINTMENT_BOOKED" as const, title: "Booked appointment" },
    { type: "APPOINTMENT_COMPLETED" as const, title: "Completed appointment" },
    { type: "PURCHASE" as const, title: "Made a purchase" },
    { type: "REVIEW_RECEIVED" as const, title: "Left a review" },
    { type: "LOYALTY_EARNED" as const, title: "Earned loyalty points" },
  ];

  for (const client of clients.slice(0, 5)) {
    for (let i = 0; i < 5; i++) {
      const actType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const actDate = new Date(today);
      actDate.setDate(today.getDate() - Math.floor(Math.random() * 30));

      await prisma.activity.create({
        data: {
          clientId: client.id,
          type: actType.type,
          title: actType.title,
          description: `Activity recorded on ${actDate.toLocaleDateString()}`,
          createdAt: actDate,
        },
      });
    }
  }
  console.log("Created client activities");

  // ============================================
  // MARKETPLACE & SUBSCRIPTION SAMPLE DATA
  // ============================================

  // Create additional businesses for marketplace variety
  const additionalBusinesses = await Promise.all([
    prisma.business.create({
      data: {
        name: "Glamour Hair Studio",
        type: "HAIR_SALON",
        phone: "5551111000",
        email: "hello@glamourhair.com",
        timezone: "America/New_York",
        defaultLanguage: "en",
        supportedLanguages: ["en", "es"],
      },
    }),
    prisma.business.create({
      data: {
        name: "Zen Spa & Wellness",
        type: "SPA",
        phone: "5552222000",
        email: "info@zenspa.com",
        timezone: "America/Los_Angeles",
        defaultLanguage: "en",
        supportedLanguages: ["en"],
      },
    }),
    prisma.business.create({
      data: {
        name: "Nails by Nicole",
        type: "NAIL_SALON",
        phone: "5553333000",
        email: "nicole@nailsbynicole.com",
        timezone: "America/Chicago",
        defaultLanguage: "en",
        supportedLanguages: ["en", "vi"],
      },
    }),
    prisma.business.create({
      data: {
        name: "The Gentlemen's Barber",
        type: "BARBERSHOP",
        phone: "5554444000",
        email: "book@gentlemensbarber.com",
        timezone: "America/New_York",
        defaultLanguage: "en",
        supportedLanguages: ["en"],
      },
    }),
    prisma.business.create({
      data: {
        name: "Radiant Skin Clinic",
        type: "SPA",
        phone: "5555555000",
        email: "hello@radiantskin.com",
        timezone: "America/Denver",
        defaultLanguage: "en",
        supportedLanguages: ["en", "es"],
      },
    }),
    prisma.business.create({
      data: {
        name: "Lash & Brow Bar",
        type: "LASH_BROW",
        phone: "5556666000",
        email: "appointments@lashandbrow.com",
        timezone: "America/New_York",
        defaultLanguage: "en",
        supportedLanguages: ["en"],
      },
    }),
    prisma.business.create({
      data: {
        name: "Urban Cuts NYC",
        type: "HAIR_SALON",
        phone: "5557777000",
        email: "info@urbancuts.nyc",
        timezone: "America/New_York",
        defaultLanguage: "en",
        supportedLanguages: ["en", "es", "zh"],
      },
    }),
    prisma.business.create({
      data: {
        name: "Serenity Day Spa",
        type: "SPA",
        phone: "5558888000",
        email: "relax@serenityspa.com",
        timezone: "America/Los_Angeles",
        defaultLanguage: "en",
        supportedLanguages: ["en"],
      },
    }),
    prisma.business.create({
      data: {
        name: "Polished Nails & Beauty",
        type: "NAIL_SALON",
        phone: "5559999000",
        email: "book@polishednails.com",
        timezone: "America/Chicago",
        defaultLanguage: "en",
        supportedLanguages: ["en", "ko"],
      },
    }),
    prisma.business.create({
      data: {
        name: "Mane Attraction Salon",
        type: "HAIR_SALON",
        phone: "5550001111",
        email: "hello@maneattraction.com",
        timezone: "America/New_York",
        defaultLanguage: "en",
        supportedLanguages: ["en"],
      },
    }),
    prisma.business.create({
      data: {
        name: "Classic Fade Barbershop",
        type: "BARBERSHOP",
        phone: "5550002222",
        email: "cuts@classicfade.com",
        timezone: "America/Phoenix",
        defaultLanguage: "en",
        supportedLanguages: ["en", "es"],
      },
    }),
    prisma.business.create({
      data: {
        name: "Blush Beauty Lounge",
        type: "MAKEUP",
        phone: "5550003333",
        email: "info@blushbeauty.com",
        timezone: "America/New_York",
        defaultLanguage: "en",
        supportedLanguages: ["en"],
      },
    }),
    prisma.business.create({
      data: {
        name: "Harmony Wellness Center",
        type: "SPA",
        phone: "5550004444",
        email: "wellness@harmonycenter.com",
        timezone: "America/Denver",
        defaultLanguage: "en",
        supportedLanguages: ["en", "es"],
      },
    }),
    prisma.business.create({
      data: {
        name: "Trendy Tresses Salon",
        type: "HAIR_SALON",
        phone: "5550005555",
        email: "style@trendytresses.com",
        timezone: "America/Los_Angeles",
        defaultLanguage: "en",
        supportedLanguages: ["en"],
      },
    }),
  ]);
  console.log("Created additional businesses:", additionalBusinesses.length);

  // Combine all businesses for subscriptions
  const allBusinesses = [business, ...additionalBusinesses];

  // Create BusinessSubscription for each business (15 total)
  const subscriptionPlans = [
    { plan: "STARTER" as const, monthlyPrice: 0, commission: 20, status: "ACTIVE" as const },
    { plan: "GROWTH" as const, monthlyPrice: 49, commission: 12, status: "ACTIVE" as const },
    { plan: "PRO" as const, monthlyPrice: 149, commission: 5, status: "ACTIVE" as const },
  ];

  const subscriptions = [];
  for (let i = 0; i < allBusinesses.length; i++) {
    const planData = subscriptionPlans[i % subscriptionPlans.length];
    const trialEnd = i % 4 === 0 ? new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) : null;

    const subscription = await prisma.businessSubscription.create({
      data: {
        businessId: allBusinesses[i].id,
        plan: planData.plan,
        status: trialEnd ? "TRIAL" : planData.status,
        monthlyPrice: planData.monthlyPrice,
        marketplaceCommissionPct: planData.commission,
        trialEndsAt: trialEnd,
        currentPeriodStart: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
      },
    });
    subscriptions.push(subscription);
  }
  console.log("Created business subscriptions:", subscriptions.length);

  // Create PublicSalonProfile for each business (15 total)
  const profileData = [
    { slug: "luxe-beauty-studio", headline: "Your Premier Full-Service Beauty Destination", description: "Award-winning salon offering hair, nails, and spa services in the heart of downtown NYC.", specialties: ["Balayage", "Keratin Treatment", "Bridal Styling"], amenities: ["Free WiFi", "Parking", "Online Booking", "Credit Cards Accepted"], priceRange: "$$$", isVerified: true, avgRating: 4.8, reviewCount: 156, viewCount: 2450, bookingClickCount: 380 },
    { slug: "glamour-hair-studio", headline: "Where Style Meets Sophistication", description: "Trendy hair salon specializing in color transformations and modern cuts.", specialties: ["Hair Color", "Highlights", "Hair Extensions"], amenities: ["Free WiFi", "Online Booking", "Late Hours"], priceRange: "$$", avgRating: 4.6, reviewCount: 89, viewCount: 1820, bookingClickCount: 245 },
    { slug: "zen-spa-wellness", headline: "Find Your Inner Peace", description: "Escape the daily stress with our luxurious spa treatments and wellness therapies.", specialties: ["Hot Stone Massage", "Deep Tissue Massage", "Aromatherapy"], amenities: ["Private Rooms", "Refreshments", "Parking", "Wheelchair Accessible"], priceRange: "$$$$", isVerified: true, avgRating: 4.9, reviewCount: 203, viewCount: 3100, bookingClickCount: 520 },
    { slug: "nails-by-nicole", headline: "Art at Your Fingertips", description: "Creative nail artistry and meticulous care for beautiful, healthy nails.", specialties: ["Nail Art", "Gel Extensions", "Japanese Manicure"], amenities: ["Free WiFi", "Credit Cards Accepted", "Online Booking"], priceRange: "$$", avgRating: 4.7, reviewCount: 124, viewCount: 1650, bookingClickCount: 290 },
    { slug: "gentlemens-barber", headline: "Classic Cuts, Modern Style", description: "Traditional barbershop experience with a contemporary twist. Expert fades and hot shaves.", specialties: ["Fades", "Hot Towel Shave", "Beard Grooming"], amenities: ["Free WiFi", "Refreshments", "Late Hours"], priceRange: "$$", avgRating: 4.8, reviewCount: 178, viewCount: 2100, bookingClickCount: 410 },
    { slug: "radiant-skin-clinic", headline: "Glow From Within", description: "Medical-grade skincare treatments for all skin types and concerns.", specialties: ["Hydrafacial", "Chemical Peels", "Microneedling"], amenities: ["Private Rooms", "Parking", "Credit Cards Accepted"], priceRange: "$$$", isVerified: true, avgRating: 4.9, reviewCount: 145, viewCount: 1980, bookingClickCount: 340 },
    { slug: "lash-brow-bar", headline: "Eyes That Wow", description: "Specialists in lash extensions, lifts, and brow shaping for stunning eyes.", specialties: ["Lash Extensions", "Lash Lift", "Brow Lamination"], amenities: ["Free WiFi", "Online Booking", "Credit Cards Accepted"], priceRange: "$$", avgRating: 4.6, reviewCount: 98, viewCount: 1420, bookingClickCount: 215 },
    { slug: "urban-cuts-nyc", headline: "New York's Cutting Edge Salon", description: "Trendsetting hair salon in the heart of Manhattan with celebrity stylists.", specialties: ["Precision Cuts", "Vivid Colors", "Hair Restoration"], amenities: ["Free WiFi", "Refreshments", "Online Booking", "Credit Cards Accepted"], priceRange: "$$$$", isVerified: true, avgRating: 4.7, reviewCount: 234, viewCount: 4200, bookingClickCount: 680 },
    { slug: "serenity-day-spa", headline: "A Day of Pure Bliss", description: "Full-day spa packages for ultimate relaxation and rejuvenation.", specialties: ["Couples Massage", "Body Wraps", "Hydrotherapy"], amenities: ["Private Rooms", "Refreshments", "Parking", "Wheelchair Accessible"], priceRange: "$$$", avgRating: 4.8, reviewCount: 167, viewCount: 2800, bookingClickCount: 450 },
    { slug: "polished-nails-beauty", headline: "Perfectly Polished Every Time", description: "Fast, friendly nail services with the highest hygiene standards.", specialties: ["Dip Powder", "Acrylic Sets", "Pedicure Spa"], amenities: ["Free WiFi", "Online Booking", "Kids Friendly"], priceRange: "$", avgRating: 4.5, reviewCount: 256, viewCount: 3500, bookingClickCount: 580 },
    { slug: "mane-attraction-salon", headline: "Your Hair, Your Statement", description: "Creative color work and precision cuts for all hair types.", specialties: ["Curly Hair", "Textured Hair", "Color Correction"], amenities: ["Free WiFi", "Parking", "Online Booking"], priceRange: "$$", avgRating: 4.7, reviewCount: 112, viewCount: 1580, bookingClickCount: 225 },
    { slug: "classic-fade-barbershop", headline: "Fresh Cuts, Clean Lines", description: "Master barbers delivering flawless fades and classic styles.", specialties: ["Skin Fades", "Line Ups", "Kids Cuts"], amenities: ["Free WiFi", "Late Hours", "Credit Cards Accepted"], priceRange: "$", avgRating: 4.6, reviewCount: 189, viewCount: 2250, bookingClickCount: 390 },
    { slug: "blush-beauty-lounge", headline: "Beauty Without Limits", description: "Full-service beauty lounge offering makeup, hair, and skincare.", specialties: ["Bridal Makeup", "Special Effects", "Makeup Lessons"], amenities: ["Free WiFi", "Private Rooms", "Online Booking"], priceRange: "$$", avgRating: 4.5, reviewCount: 78, viewCount: 1120, bookingClickCount: 165 },
    { slug: "harmony-wellness-center", headline: "Balance Mind, Body & Spirit", description: "Holistic wellness center combining traditional and modern healing.", specialties: ["Reiki", "Acupuncture", "Meditation Classes"], amenities: ["Private Rooms", "Parking", "Refreshments", "Wheelchair Accessible"], priceRange: "$$$", avgRating: 4.8, reviewCount: 134, viewCount: 1890, bookingClickCount: 295 },
    { slug: "trendy-tresses-salon", headline: "Stay Ahead of the Trends", description: "LA's hottest salon for cutting-edge styles and viral hair trends.", specialties: ["Money Pieces", "Face Framing", "Lived-in Color"], amenities: ["Free WiFi", "Refreshments", "Online Booking", "Late Hours"], priceRange: "$$", avgRating: 4.6, reviewCount: 145, viewCount: 2340, bookingClickCount: 375 },
  ];

  const profiles = [];
  for (let i = 0; i < allBusinesses.length; i++) {
    const pData = profileData[i];
    const profile = await prisma.publicSalonProfile.create({
      data: {
        businessId: allBusinesses[i].id,
        slug: pData.slug,
        isListed: true,
        headline: pData.headline,
        description: pData.description,
        specialties: pData.specialties,
        amenities: pData.amenities,
        priceRange: pData.priceRange,
        isVerified: pData.isVerified || false,
        avgRating: pData.avgRating,
        reviewCount: pData.reviewCount,
        viewCount: pData.viewCount,
        bookingClickCount: pData.bookingClickCount,
        galleryImages: [],
      },
    });
    profiles.push(profile);
  }
  console.log("Created public salon profiles:", profiles.length);

  // Create MarketplaceLead for each business (20+ leads total)
  const leadSources = ["MARKETPLACE_SEARCH", "MARKETPLACE_BROWSE", "GOOGLE_ORGANIC", "FACEBOOK_ADS", "REFERRAL_LINK"] as const;
  const leadStatuses = ["NEW", "VIEWED_PROFILE", "STARTED_BOOKING", "BOOKED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

  const utmSources = ["google", "facebook", "instagram", "email", "direct"];
  const utmMediums = ["cpc", "organic", "social", "email", "referral"];
  const utmCampaigns = ["summer_promo", "new_client", "holiday_special", "brand_awareness", null];
  const searchQueries = ["hair salon near me", "balayage specialist", "best spa manhattan", "affordable nail salon", "mens haircut downtown", "lash extensions", "massage therapy", null];

  const leads = [];
  // Create 25 leads - first 15 for main business, rest distributed
  for (let i = 0; i < 40; i++) {
    // First 20 leads go to main business (Luxe Beauty Studio)
    const businessIdx = i < 20 ? 0 : (i % allBusinesses.length);
    const targetBusiness = allBusinesses[businessIdx];
    const subscription = subscriptions[businessIdx];

    const statusIdx = Math.floor(Math.random() * leadStatuses.length);
    const status = leadStatuses[statusIdx];

    const dayOffset = Math.floor(Math.random() * 30);
    const viewedDate = new Date(today);
    viewedDate.setDate(today.getDate() - dayOffset);

    let bookedAt = null;
    let completedAt = null;
    let commissionRate = null;
    let commissionAmount = null;

    if (["BOOKED", "COMPLETED", "CANCELLED", "NO_SHOW"].includes(status)) {
      bookedAt = new Date(viewedDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
    }

    if (status === "COMPLETED") {
      completedAt = new Date(bookedAt!.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      commissionRate = subscription.marketplaceCommissionPct;
      const bookingValue = 50 + Math.floor(Math.random() * 200);
      commissionAmount = Math.round(bookingValue * Number(commissionRate) / 100 * 100) / 100;
    }

    const lead = await prisma.marketplaceLead.create({
      data: {
        businessId: targetBusiness.id,
        locationId: locations[0].id,
        clientId: clients[Math.floor(Math.random() * clients.length)].id,
        source: leadSources[Math.floor(Math.random() * leadSources.length)],
        status,
        sessionId: `session_${Date.now()}_${i}`,
        utmSource: utmSources[Math.floor(Math.random() * utmSources.length)],
        utmMedium: utmMediums[Math.floor(Math.random() * utmMediums.length)],
        utmCampaign: utmCampaigns[Math.floor(Math.random() * utmCampaigns.length)],
        searchQuery: searchQueries[Math.floor(Math.random() * searchQueries.length)],
        viewedAt: viewedDate,
        bookedAt,
        completedAt,
        commissionRate,
        commissionAmount,
        commissionPaidAt: status === "COMPLETED" && Math.random() > 0.5 ? new Date() : null,
      },
    });
    leads.push(lead);
  }
  console.log("Created marketplace leads:", leads.length);

  // Create BusinessInvoice for businesses with completed leads
  const invoices = [];
  for (let i = 0; i < 10; i++) {
    const businessIdx = i % allBusinesses.length;
    const subscription = subscriptions[businessIdx];

    const periodStart = new Date(today);
    periodStart.setMonth(periodStart.getMonth() - 1);
    periodStart.setDate(1);

    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(0);

    const dueDate = new Date(periodEnd);
    dueDate.setDate(dueDate.getDate() + 15);

    const subscriptionAmount = Number(subscription.monthlyPrice);
    const commissionAmount = 50 + Math.floor(Math.random() * 200);
    const totalAmount = subscriptionAmount + commissionAmount;

    const statuses = ["PENDING", "PAID", "PAID", "PAID", "PAST_DUE"] as const;
    const invoiceStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const invoice = await prisma.businessInvoice.create({
      data: {
        subscriptionId: subscription.id,
        invoiceNumber: `INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, "0")}-${(i + 1).toString().padStart(4, "0")}`,
        periodStart,
        periodEnd,
        subscriptionAmount,
        commissionAmount,
        totalAmount,
        status: invoiceStatus,
        dueDate,
        paidAt: invoiceStatus === "PAID" ? new Date(dueDate.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000) : null,
        lineItems: {
          items: [
            { description: `${subscription.plan} Plan - Monthly`, amount: subscriptionAmount },
            { description: "Marketplace Commission", amount: commissionAmount },
          ],
        },
      },
    });
    invoices.push(invoice);
  }
  console.log("Created business invoices:", invoices.length);

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Summary:");
  console.log(`   - Businesses: ${allBusinesses.length} (1 main + 14 marketplace)`);
  console.log(`   - Locations: ${locations.length}`);
  console.log(`   - Users: ${users.length + 1}`);
  console.log(`   - Services: ${services.length} (36 services)`);
  console.log(`   - Products: ${productsData.length} (23 products)`);
  console.log(`   - Clients: ${clients.length} (25 clients)`);
  console.log(`   - Appointments: ${appointmentsData.length} (35 appointments)`);
  console.log(`   - Sales: 50 transactions`);
  console.log(`   - Gift Cards: ${giftCardCodes.length} (25 gift cards)`);
  console.log(`   - Reviews: 25 reviews`);
  console.log(`   - Campaigns: ${campaignsData.length} (25 campaigns)`);
  console.log(`   - Loyalty Rewards: ${rewardsData.length} (25 rewards)`);
  console.log(`   - Automations: ${automationsData.length} (25 automations)`);
  console.log("\n🏪 Marketplace Data:");
  console.log(`   - Business Subscriptions: ${subscriptions.length}`);
  console.log(`   - Public Salon Profiles: ${profiles.length}`);
  console.log(`   - Marketplace Leads: ${leads.length}`);
  console.log(`   - Business Invoices: ${invoices.length}`);
  console.log("\n🔑 Login credentials:");
  console.log("   Admin: admin@luxebeauty.com / admin123");
  console.log("   Staff: any staff email / password123");
  console.log("\n🌐 Marketplace URLs:");
  console.log("   /explore - Browse all salons");
  console.log("   /salon/luxe-beauty-studio - Example salon profile");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
