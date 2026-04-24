import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedHealthcareData() {
  console.log("Seeding healthcare AI features...");

  // Seed Symptom Checks (15+ items)
  const symptomChecks = [
    {
      sessionId: "session-001",
      symptoms: ["headache", "fatigue", "neck tension"],
      duration: "3 days",
      severity: "moderate",
      additionalInfo: "Work-related stress, long hours at computer",
      possibleConditions: [
        { condition: "Tension Headache", probability: 85, description: "Often caused by stress and muscle tension" },
        { condition: "Eye Strain", probability: 70, description: "From prolonged screen time" },
        { condition: "Dehydration", probability: 50, description: "Common cause of headaches" }
      ],
      recommendations: ["Take regular breaks from screen", "Stay hydrated", "Practice relaxation exercises", "Consider massage therapy"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-002",
      symptoms: ["skin rash", "itching", "redness"],
      duration: "2 days",
      severity: "mild",
      additionalInfo: "Started after trying new skincare product",
      possibleConditions: [
        { condition: "Contact Dermatitis", probability: 90, description: "Allergic reaction to product" },
        { condition: "Eczema Flare", probability: 40, description: "Chronic skin condition" }
      ],
      recommendations: ["Discontinue new product", "Use gentle cleanser", "Apply soothing moisturizer", "Book skin consultation"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-003",
      symptoms: ["hair loss", "scalp irritation", "thinning"],
      duration: "1 month",
      severity: "moderate",
      additionalInfo: "Recent stress at work, diet changes",
      possibleConditions: [
        { condition: "Stress-Related Hair Loss", probability: 75, description: "Telogen effluvium from stress" },
        { condition: "Nutritional Deficiency", probability: 60, description: "Lack of essential vitamins" }
      ],
      recommendations: ["Reduce stress levels", "Improve diet", "Consider biotin supplements", "Schedule scalp treatment"],
      urgencyLevel: "low",
      shouldSeekCare: true
    },
    {
      sessionId: "session-004",
      symptoms: ["dry skin", "flaking", "tightness"],
      duration: "2 weeks",
      severity: "mild",
      additionalInfo: "Winter season, using hot water for showers",
      possibleConditions: [
        { condition: "Seasonal Dry Skin", probability: 95, description: "Common in winter months" },
        { condition: "Mild Dehydration", probability: 40, description: "Internal moisture deficit" }
      ],
      recommendations: ["Use lukewarm water", "Apply rich moisturizer", "Use humidifier", "Book hydrating facial"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-005",
      symptoms: ["acne breakout", "oily skin", "inflammation"],
      duration: "1 week",
      severity: "moderate",
      additionalInfo: "Started around menstrual cycle",
      possibleConditions: [
        { condition: "Hormonal Acne", probability: 85, description: "Related to hormonal fluctuations" },
        { condition: "Stress Acne", probability: 50, description: "Triggered by cortisol increase" }
      ],
      recommendations: ["Gentle cleansing routine", "Non-comedogenic products", "Book acne treatment facial", "Track cycle patterns"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-006",
      symptoms: ["nail discoloration", "brittleness", "peeling"],
      duration: "3 weeks",
      severity: "moderate",
      additionalInfo: "Regular gel manicures",
      possibleConditions: [
        { condition: "Nail Damage from Gel", probability: 80, description: "UV exposure and removal damage" },
        { condition: "Fungal Infection", probability: 30, description: "Possible but less likely" }
      ],
      recommendations: ["Take break from gel", "Use nail strengthener", "Moisturize cuticles", "Book nail restoration service"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-007",
      symptoms: ["back pain", "stiffness", "muscle tension"],
      duration: "5 days",
      severity: "moderate",
      additionalInfo: "Desk job, poor posture",
      possibleConditions: [
        { condition: "Muscular Strain", probability: 85, description: "From poor posture" },
        { condition: "Sedentary Lifestyle Effects", probability: 70, description: "Lack of movement" }
      ],
      recommendations: ["Improve workstation ergonomics", "Regular stretching", "Book therapeutic massage", "Consider posture assessment"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-008",
      symptoms: ["eye puffiness", "dark circles", "tired appearance"],
      duration: "ongoing",
      severity: "mild",
      additionalInfo: "Sleeping 5-6 hours, high salt diet",
      possibleConditions: [
        { condition: "Sleep Deprivation Effects", probability: 90, description: "Insufficient rest" },
        { condition: "Fluid Retention", probability: 60, description: "From dietary sodium" }
      ],
      recommendations: ["Improve sleep schedule", "Reduce salt intake", "Book eye treatment facial", "Use cold compress"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-009",
      symptoms: ["split ends", "frizzy hair", "lack of shine"],
      duration: "2 months",
      severity: "mild",
      additionalInfo: "Regular heat styling, coloring",
      possibleConditions: [
        { condition: "Heat Damage", probability: 90, description: "From styling tools" },
        { condition: "Chemical Damage", probability: 75, description: "From color treatments" }
      ],
      recommendations: ["Use heat protectant", "Deep conditioning treatments", "Book hair repair treatment", "Reduce heat styling"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-010",
      symptoms: ["chapped lips", "cracking", "dryness"],
      duration: "1 week",
      severity: "mild",
      additionalInfo: "Cold weather, mouth breathing",
      possibleConditions: [
        { condition: "Environmental Dryness", probability: 95, description: "Weather-related" },
        { condition: "Mild Dehydration", probability: 40, description: "Not drinking enough water" }
      ],
      recommendations: ["Apply lip balm regularly", "Stay hydrated", "Use humidifier", "Avoid licking lips"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-011",
      symptoms: ["foot pain", "calluses", "dry heels"],
      duration: "ongoing",
      severity: "moderate",
      additionalInfo: "On feet all day for work",
      possibleConditions: [
        { condition: "Plantar Stress", probability: 80, description: "From prolonged standing" },
        { condition: "Improper Footwear", probability: 70, description: "Inadequate support" }
      ],
      recommendations: ["Wear supportive shoes", "Regular foot soaks", "Book pedicure with callus treatment", "Moisturize feet nightly"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-012",
      symptoms: ["shoulder tension", "limited mobility", "discomfort"],
      duration: "1 week",
      severity: "moderate",
      additionalInfo: "Carrying heavy bag on one shoulder",
      possibleConditions: [
        { condition: "Muscle Imbalance", probability: 85, description: "From uneven weight distribution" },
        { condition: "Trapezius Strain", probability: 70, description: "Overworked muscle" }
      ],
      recommendations: ["Use backpack instead", "Stretching exercises", "Book deep tissue massage", "Alternate shoulders"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-013",
      symptoms: ["uneven skin tone", "hyperpigmentation", "sun spots"],
      duration: "6 months",
      severity: "mild",
      additionalInfo: "Didn't use sunscreen regularly",
      possibleConditions: [
        { condition: "Sun Damage", probability: 90, description: "UV-induced pigmentation" },
        { condition: "Post-Inflammatory Hyperpigmentation", probability: 50, description: "From past breakouts" }
      ],
      recommendations: ["Daily SPF 50", "Vitamin C serum", "Book brightening facial", "Consider chemical peel"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-014",
      symptoms: ["jaw tension", "headache", "facial pain"],
      duration: "2 weeks",
      severity: "moderate",
      additionalInfo: "Grinding teeth at night, stress",
      possibleConditions: [
        { condition: "TMJ Dysfunction", probability: 75, description: "Jaw joint stress" },
        { condition: "Bruxism Effects", probability: 85, description: "From teeth grinding" }
      ],
      recommendations: ["See dentist for night guard", "Facial massage", "Stress management", "Book facial with TMJ release"],
      urgencyLevel: "medium",
      shouldSeekCare: true
    },
    {
      sessionId: "session-015",
      symptoms: ["leg cramps", "heaviness", "mild swelling"],
      duration: "3 days",
      severity: "mild",
      additionalInfo: "Long flight yesterday",
      possibleConditions: [
        { condition: "Travel-Related Circulation Issues", probability: 85, description: "From prolonged sitting" },
        { condition: "Mild Dehydration", probability: 60, description: "Common during flights" }
      ],
      recommendations: ["Walk frequently", "Elevate legs", "Compression socks", "Book leg massage treatment"],
      urgencyLevel: "low",
      shouldSeekCare: false
    },
    {
      sessionId: "session-016",
      symptoms: ["cuticle damage", "hangnails", "redness"],
      duration: "1 week",
      severity: "mild",
      additionalInfo: "Picking at cuticles, dry hands",
      possibleConditions: [
        { condition: "Cuticle Damage", probability: 95, description: "From picking and dryness" },
        { condition: "Mild Paronychia", probability: 25, description: "If infection present" }
      ],
      recommendations: ["Stop picking cuticles", "Apply cuticle oil daily", "Moisturize hands", "Book manicure with cuticle care"],
      urgencyLevel: "low",
      shouldSeekCare: false
    }
  ];

  for (const check of symptomChecks) {
    await prisma.symptomCheck.create({ data: check });
  }
  console.log(`Created ${symptomChecks.length} symptom checks`);

  // Seed Mental Health Sessions (15+ items)
  const mentalHealthSessions = [
    {
      sessionId: "mh-001",
      moodScore: 4,
      stressLevel: 8,
      anxietyLevel: 7,
      sleepQuality: 4,
      messages: [
        { role: "user", content: "I've been feeling overwhelmed with work lately" },
        { role: "assistant", content: "I hear you. Work stress can really affect our wellbeing. Let's explore some coping strategies together." }
      ],
      insights: { primaryConcern: "Work-related stress", patterns: ["High stress correlated with poor sleep"] },
      copingStrategies: ["Progressive muscle relaxation", "Time blocking", "Setting boundaries", "Regular breaks"],
      resourcesRecommended: ["Meditation apps", "Stress management workshops", "Relaxation massage"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-002",
      moodScore: 6,
      stressLevel: 5,
      anxietyLevel: 4,
      sleepQuality: 7,
      messages: [
        { role: "user", content: "Feeling better this week, the breathing exercises helped" },
        { role: "assistant", content: "That's wonderful progress! Let's build on this momentum." }
      ],
      insights: { primaryConcern: "Anxiety management", patterns: ["Improvement with consistent practice"] },
      copingStrategies: ["Continue breathing exercises", "Journaling", "Nature walks", "Spa self-care day"],
      resourcesRecommended: ["Yoga classes", "Aromatherapy", "Sound bath sessions"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-003",
      moodScore: 3,
      stressLevel: 9,
      anxietyLevel: 8,
      sleepQuality: 3,
      messages: [
        { role: "user", content: "Big presentation coming up and I can't stop worrying" },
        { role: "assistant", content: "Performance anxiety is common. Let's work on some techniques to help you feel more prepared." }
      ],
      insights: { primaryConcern: "Performance anxiety", patterns: ["Anticipatory stress", "Sleep disruption"] },
      copingStrategies: ["Visualization techniques", "Power posing", "Preparation routine", "Calming ritual"],
      resourcesRecommended: ["Pre-event relaxation massage", "Aromatherapy diffuser", "Calming tea"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-004",
      moodScore: 5,
      stressLevel: 6,
      anxietyLevel: 5,
      sleepQuality: 5,
      messages: [
        { role: "user", content: "Feeling stuck in a rut, need some motivation" },
        { role: "assistant", content: "Feeling stuck is a signal for change. Let's explore small steps to bring back momentum." }
      ],
      insights: { primaryConcern: "Motivation and purpose", patterns: ["Routine fatigue", "Need for novelty"] },
      copingStrategies: ["Try new activity weekly", "Goal setting", "Social connection", "Self-care routine"],
      resourcesRecommended: ["New wellness treatment", "Group fitness class", "Creative workshop"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-005",
      moodScore: 7,
      stressLevel: 4,
      anxietyLevel: 3,
      sleepQuality: 8,
      messages: [
        { role: "user", content: "Started meditation and it's really helping" },
        { role: "assistant", content: "Meditation can be transformative! Let's explore how to deepen your practice." }
      ],
      insights: { primaryConcern: "Maintaining positive habits", patterns: ["Meditation benefits"] },
      copingStrategies: ["Extend meditation time", "Try different techniques", "Join meditation group"],
      resourcesRecommended: ["Guided meditation sessions", "Mindfulness workshops", "Spa meditation package"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-006",
      moodScore: 4,
      stressLevel: 7,
      anxietyLevel: 6,
      sleepQuality: 4,
      messages: [
        { role: "user", content: "Relationship issues are affecting my mood" },
        { role: "assistant", content: "Relationship stress can deeply impact our emotional state. Let's focus on self-care while you navigate this." }
      ],
      insights: { primaryConcern: "Relationship stress", patterns: ["External factors affecting mood"] },
      copingStrategies: ["Self-compassion practice", "Support network", "Healthy boundaries", "Personal time"],
      resourcesRecommended: ["Solo spa day", "Journaling", "Consider couples counseling"],
      needsProfessionalHelp: true,
      crisisDetected: false
    },
    {
      sessionId: "mh-007",
      moodScore: 6,
      stressLevel: 5,
      anxietyLevel: 4,
      sleepQuality: 6,
      messages: [
        { role: "user", content: "Seasonal changes are affecting my energy levels" },
        { role: "assistant", content: "Seasonal mood changes are very common. Let's create a plan to boost your energy naturally." }
      ],
      insights: { primaryConcern: "Seasonal mood changes", patterns: ["Less daylight affecting mood"] },
      copingStrategies: ["Light therapy", "Morning walks", "Vitamin D", "Bright colors in environment"],
      resourcesRecommended: ["Energizing treatments", "Sauna sessions", "Uplifting aromatherapy"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-008",
      moodScore: 5,
      stressLevel: 6,
      anxietyLevel: 5,
      sleepQuality: 5,
      messages: [
        { role: "user", content: "Social anxiety making it hard to meet new people" },
        { role: "assistant", content: "Social anxiety is challenging but manageable. Let's work on gradual exposure techniques." }
      ],
      insights: { primaryConcern: "Social anxiety", patterns: ["Avoidance behavior"] },
      copingStrategies: ["Small social interactions", "Prepare conversation starters", "Self-affirmations"],
      resourcesRecommended: ["Group wellness activities", "Partner spa treatments", "Community events"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-009",
      moodScore: 3,
      stressLevel: 8,
      anxietyLevel: 7,
      sleepQuality: 3,
      messages: [
        { role: "user", content: "Financial worries keeping me up at night" },
        { role: "assistant", content: "Financial stress can be overwhelming. Let's focus on what you can control and find ways to manage the anxiety." }
      ],
      insights: { primaryConcern: "Financial anxiety", patterns: ["Sleep disruption", "Rumination"] },
      copingStrategies: ["Budgeting exercise", "Worry time limits", "Focus on small wins", "Free self-care"],
      resourcesRecommended: ["At-home relaxation techniques", "Budget-friendly spa options", "Free meditation apps"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-010",
      moodScore: 7,
      stressLevel: 3,
      anxietyLevel: 2,
      sleepQuality: 8,
      messages: [
        { role: "user", content: "Just completed a wellness retreat, feeling great!" },
        { role: "assistant", content: "That's wonderful! Let's create a plan to maintain these positive feelings in daily life." }
      ],
      insights: { primaryConcern: "Maintaining wellness gains", patterns: ["Post-retreat glow"] },
      copingStrategies: ["Create daily rituals", "Schedule regular self-care", "Connect with retreat community"],
      resourcesRecommended: ["Monthly spa membership", "Wellness classes", "At-home spa products"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-011",
      moodScore: 4,
      stressLevel: 7,
      anxietyLevel: 6,
      sleepQuality: 4,
      messages: [
        { role: "user", content: "Feeling burnt out from caregiving responsibilities" },
        { role: "assistant", content: "Caregiver burnout is real and valid. You need to care for yourself too. Let's find ways to recharge." }
      ],
      insights: { primaryConcern: "Caregiver burnout", patterns: ["Self-neglect", "Compassion fatigue"] },
      copingStrategies: ["Schedule respite time", "Ask for help", "Quick self-care moments", "Support group"],
      resourcesRecommended: ["Express spa treatments", "Respite care resources", "Caregiver support groups"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-012",
      moodScore: 5,
      stressLevel: 5,
      anxietyLevel: 4,
      sleepQuality: 6,
      messages: [
        { role: "user", content: "Struggling with body image after weight changes" },
        { role: "assistant", content: "Body image concerns are very common. Let's work on self-acceptance and positive self-talk." }
      ],
      insights: { primaryConcern: "Body image", patterns: ["Self-criticism", "Comparison behavior"] },
      copingStrategies: ["Body neutrality practice", "Focus on function", "Limit social media", "Self-appreciation"],
      resourcesRecommended: ["Body positive treatments", "Wellness coaching", "Self-care rituals"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-013",
      moodScore: 6,
      stressLevel: 4,
      anxietyLevel: 3,
      sleepQuality: 7,
      messages: [
        { role: "user", content: "Learning to set better boundaries at work" },
        { role: "assistant", content: "Setting boundaries is a powerful skill! Let's reinforce these positive changes." }
      ],
      insights: { primaryConcern: "Boundary setting", patterns: ["Growth mindset", "Self-advocacy"] },
      copingStrategies: ["Practice saying no", "Clear communication", "Prioritize self-care", "Celebrate wins"],
      resourcesRecommended: ["Assertiveness workshops", "Reward spa day", "Mindfulness training"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-014",
      moodScore: 4,
      stressLevel: 6,
      anxietyLevel: 5,
      sleepQuality: 5,
      messages: [
        { role: "user", content: "Dealing with grief after losing a pet" },
        { role: "assistant", content: "Pet loss is a significant grief. Your feelings are completely valid. Let's honor your loss while supporting healing." }
      ],
      insights: { primaryConcern: "Grief processing", patterns: ["Loss-related sadness", "Healthy grieving"] },
      copingStrategies: ["Allow yourself to grieve", "Create memorial", "Reach out to others", "Self-compassion"],
      resourcesRecommended: ["Comfort treatments", "Nature walks", "Pet loss support groups"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-015",
      moodScore: 5,
      stressLevel: 5,
      anxietyLevel: 5,
      sleepQuality: 6,
      messages: [
        { role: "user", content: "Procrastination is affecting my productivity and self-esteem" },
        { role: "assistant", content: "Procrastination often has deeper roots. Let's explore what might be driving it and find practical solutions." }
      ],
      insights: { primaryConcern: "Procrastination and productivity", patterns: ["Perfectionism", "Fear of failure"] },
      copingStrategies: ["Break tasks into small steps", "Pomodoro technique", "Celebrate progress", "Address perfectionism"],
      resourcesRecommended: ["Focus-enhancing treatments", "Productivity coaching", "Energy-boosting services"],
      needsProfessionalHelp: false,
      crisisDetected: false
    },
    {
      sessionId: "mh-016",
      moodScore: 6,
      stressLevel: 4,
      anxietyLevel: 3,
      sleepQuality: 7,
      messages: [
        { role: "user", content: "Feeling more confident after starting regular self-care" },
        { role: "assistant", content: "The connection between self-care and confidence is powerful! Let's build on this positive momentum." }
      ],
      insights: { primaryConcern: "Building confidence", patterns: ["Self-care leading to self-esteem"] },
      copingStrategies: ["Maintain routine", "Try new experiences", "Positive affirmations", "Document progress"],
      resourcesRecommended: ["Confidence-boosting treatments", "New service trials", "Wellness packages"],
      needsProfessionalHelp: false,
      crisisDetected: false
    }
  ];

  for (const session of mentalHealthSessions) {
    await prisma.mentalHealthSession.create({ data: session });
  }
  console.log(`Created ${mentalHealthSessions.length} mental health sessions`);

  // Seed Skin Analyses (15+ items)
  const skinAnalyses = [
    {
      skinType: "oily",
      concerns: ["acne", "large pores", "shine"],
      age: 25,
      lifestyle: "Urban, high stress job",
      currentRoutine: { morning: ["cleanser", "moisturizer"], evening: ["cleanser"] },
      skinCondition: { hydration: 40, oiliness: 80, sensitivity: 30 },
      recommendations: ["Double cleansing", "Salicylic acid", "Niacinamide"],
      productSuggestions: [
        { name: "Oil-Free Cleanser", benefit: "Controls excess sebum" },
        { name: "BHA Toner", benefit: "Clears pores" },
        { name: "Mattifying Moisturizer", benefit: "Hydrates without shine" }
      ],
      routineAdvice: { step1: "Gentle cleanser", step2: "Exfoliant 2x week", step3: "Light moisturizer", step4: "SPF daily" },
      treatmentSuggestions: ["Chemical peel", "HydraFacial", "LED therapy"]
    },
    {
      skinType: "dry",
      concerns: ["flakiness", "tightness", "fine lines"],
      age: 42,
      lifestyle: "Cold climate, travels frequently",
      currentRoutine: { morning: ["water splash"], evening: ["makeup wipes"] },
      skinCondition: { hydration: 20, oiliness: 10, sensitivity: 50 },
      recommendations: ["Hyaluronic acid", "Ceramides", "Facial oils"],
      productSuggestions: [
        { name: "Cream Cleanser", benefit: "Non-stripping" },
        { name: "Hyaluronic Serum", benefit: "Deep hydration" },
        { name: "Rich Night Cream", benefit: "Overnight repair" }
      ],
      routineAdvice: { step1: "Cream cleanser", step2: "Hydrating toner", step3: "Serum", step4: "Rich moisturizer", step5: "Facial oil" },
      treatmentSuggestions: ["Hydrating facial", "Microcurrent", "Oxygen therapy"]
    },
    {
      skinType: "combination",
      concerns: ["oily T-zone", "dry cheeks", "occasional breakouts"],
      age: 33,
      lifestyle: "Office job, exercises regularly",
      currentRoutine: { morning: ["cleanser", "moisturizer", "SPF"], evening: ["cleanser", "serum"] },
      skinCondition: { hydration: 50, oiliness: 60, sensitivity: 30 },
      recommendations: ["Zone-specific care", "Balancing products", "Weekly masks"],
      productSuggestions: [
        { name: "Gel Cleanser", benefit: "Balances skin" },
        { name: "Lightweight Serum", benefit: "Hydrates without oil" },
        { name: "Zone Moisturizers", benefit: "Target different areas" }
      ],
      routineAdvice: { step1: "Gel cleanser", step2: "Balancing toner", step3: "Lightweight serum", step4: "Light moisturizer", step5: "Multi-mask weekly" },
      treatmentSuggestions: ["Custom facial", "Dermaplaning", "Enzyme peel"]
    },
    {
      skinType: "sensitive",
      concerns: ["redness", "reactions", "rosacea-prone"],
      age: 38,
      lifestyle: "Health-conscious, avoids harsh products",
      currentRoutine: { morning: ["water", "cream"], evening: ["micellar water", "cream"] },
      skinCondition: { hydration: 45, oiliness: 25, sensitivity: 85 },
      recommendations: ["Centella asiatica", "Fragrance-free products", "Gentle formulas"],
      productSuggestions: [
        { name: "Calming Cleanser", benefit: "Soothes while cleansing" },
        { name: "Cica Serum", benefit: "Reduces redness" },
        { name: "Barrier Repair Cream", benefit: "Strengthens skin barrier" }
      ],
      routineAdvice: { step1: "Gentle cleanser", step2: "Soothing essence", step3: "Calming serum", step4: "Barrier cream", step5: "Mineral SPF" },
      treatmentSuggestions: ["LED red light", "Calming facial", "Gentle enzyme treatment"]
    },
    {
      skinType: "normal",
      concerns: ["maintenance", "early aging prevention"],
      age: 28,
      lifestyle: "Active, outdoor activities",
      currentRoutine: { morning: ["cleanser", "moisturizer", "SPF"], evening: ["cleanser", "moisturizer"] },
      skinCondition: { hydration: 70, oiliness: 40, sensitivity: 20 },
      recommendations: ["Antioxidants", "Retinol introduction", "Consistent SPF"],
      productSuggestions: [
        { name: "Vitamin C Serum", benefit: "Brightening and protection" },
        { name: "Retinol 0.25%", benefit: "Early anti-aging" },
        { name: "SPF 50", benefit: "Sun protection" }
      ],
      routineAdvice: { step1: "Gentle cleanser", step2: "Vitamin C (AM)", step3: "Moisturizer", step4: "SPF 50", step5: "Retinol (PM)" },
      treatmentSuggestions: ["Maintenance facial", "Microneedling", "Vitamin infusion"]
    },
    {
      skinType: "oily",
      concerns: ["blackheads", "enlarged pores", "texture"],
      age: 21,
      lifestyle: "College student, irregular sleep",
      currentRoutine: { morning: ["face wash"], evening: ["face wash"] },
      skinCondition: { hydration: 35, oiliness: 90, sensitivity: 20 },
      recommendations: ["Clay masks", "Chemical exfoliation", "Oil-free hydration"],
      productSuggestions: [
        { name: "Salicylic Cleanser", benefit: "Deep pore cleansing" },
        { name: "AHA/BHA Toner", benefit: "Exfoliates and clears" },
        { name: "Gel Moisturizer", benefit: "Lightweight hydration" }
      ],
      routineAdvice: { step1: "BHA cleanser", step2: "Exfoliating toner 3x week", step3: "Gel moisturizer", step4: "Clay mask weekly" },
      treatmentSuggestions: ["Extraction facial", "Chemical peel", "Pore treatment"]
    },
    {
      skinType: "dry",
      concerns: ["eczema-prone", "irritation", "barrier damage"],
      age: 35,
      lifestyle: "Uses heating a lot, desk job",
      currentRoutine: { morning: ["cream"], evening: ["cream"] },
      skinCondition: { hydration: 15, oiliness: 5, sensitivity: 75 },
      recommendations: ["Ceramides", "Squalane", "Occlusive at night"],
      productSuggestions: [
        { name: "Ceramide Cleanser", benefit: "Maintains barrier" },
        { name: "Squalane Oil", benefit: "Deep nourishment" },
        { name: "Sleeping Pack", benefit: "Overnight intensive" }
      ],
      routineAdvice: { step1: "Oil cleanser", step2: "Cream cleanser", step3: "Toner", step4: "Serum", step5: "Heavy cream", step6: "Occlusive" },
      treatmentSuggestions: ["Intensive hydration", "Barrier repair facial", "Gentle LED"]
    },
    {
      skinType: "combination",
      concerns: ["hyperpigmentation", "melasma", "sun damage"],
      age: 45,
      lifestyle: "Outdoor hobbies, history of sun exposure",
      currentRoutine: { morning: ["cleanser", "vitamin C", "SPF"], evening: ["cleanser", "retinol"] },
      skinCondition: { hydration: 55, oiliness: 45, sensitivity: 40 },
      recommendations: ["Tyrosinase inhibitors", "High SPF", "Gentle brightening"],
      productSuggestions: [
        { name: "Brightening Serum", benefit: "Fades dark spots" },
        { name: "Tranexamic Acid", benefit: "Targets melasma" },
        { name: "SPF 50+ PA++++", benefit: "Maximum protection" }
      ],
      routineAdvice: { step1: "Gentle cleanser", step2: "Brightening toner", step3: "Vitamin C + Niacinamide", step4: "SPF (reapply)", step5: "Retinoid (PM)" },
      treatmentSuggestions: ["Laser treatment", "Chemical peel", "IPL"]
    },
    {
      skinType: "normal",
      concerns: ["dullness", "uneven texture", "stress effects"],
      age: 31,
      lifestyle: "High stress executive, limited sleep",
      currentRoutine: { morning: ["cleanser", "moisturizer"], evening: ["cleanser", "moisturizer"] },
      skinCondition: { hydration: 60, oiliness: 35, sensitivity: 25 },
      recommendations: ["Glycolic acid", "Vitamin C", "Face massage"],
      productSuggestions: [
        { name: "Glycolic Toner", benefit: "Resurfaces skin" },
        { name: "Glow Serum", benefit: "Instant radiance" },
        { name: "Face Massage Tool", benefit: "Lymphatic drainage" }
      ],
      routineAdvice: { step1: "Double cleanse", step2: "Glycolic toner 3x week", step3: "Vitamin C serum", step4: "Moisturizer", step5: "Weekly face massage" },
      treatmentSuggestions: ["Glow facial", "Microdermabrasion", "Oxygen facial"]
    },
    {
      skinType: "sensitive",
      concerns: ["perioral dermatitis", "product sensitivity", "flushing"],
      age: 29,
      lifestyle: "Vegan, uses natural products only",
      currentRoutine: { morning: ["water only"], evening: ["oil cleanser"] },
      skinCondition: { hydration: 50, oiliness: 30, sensitivity: 90 },
      recommendations: ["Minimal routine", "Zinc-based products", "Avoid triggers"],
      productSuggestions: [
        { name: "Oil Cleanser", benefit: "Gentle removal" },
        { name: "Zinc Cream", benefit: "Calms and protects" },
        { name: "Mineral Sunscreen", benefit: "Non-irritating" }
      ],
      routineAdvice: { step1: "Oil cleanse only", step2: "Minimal toner", step3: "Zinc cream", step4: "Mineral SPF" },
      treatmentSuggestions: ["Calming facial", "Cool therapy", "Probiotic treatment"]
    },
    {
      skinType: "oily",
      concerns: ["cystic acne", "scarring", "inflammation"],
      age: 23,
      lifestyle: "Athlete, sweats a lot",
      currentRoutine: { morning: ["cleanser", "benzoyl peroxide"], evening: ["cleanser", "retinol"] },
      skinCondition: { hydration: 30, oiliness: 85, sensitivity: 45 },
      recommendations: ["Anti-inflammatory care", "Post-workout cleansing", "Scar treatment"],
      productSuggestions: [
        { name: "Gentle Cleanser", benefit: "Non-irritating" },
        { name: "Niacinamide Serum", benefit: "Reduces inflammation" },
        { name: "Azelaic Acid", benefit: "Fades marks" }
      ],
      routineAdvice: { step1: "Gentle cleanser", step2: "Post-workout wipe", step3: "Niacinamide", step4: "Azelaic acid (PM)", step5: "Hydrating gel" },
      treatmentSuggestions: ["Acne facial", "Blue LED", "Microneedling for scars"]
    },
    {
      skinType: "dry",
      concerns: ["mature skin", "deep wrinkles", "volume loss"],
      age: 58,
      lifestyle: "Retired, enjoys gardening",
      currentRoutine: { morning: ["cream cleanser", "serum", "cream", "SPF"], evening: ["oil cleanser", "serum", "night cream"] },
      skinCondition: { hydration: 25, oiliness: 15, sensitivity: 35 },
      recommendations: ["Peptides", "Retinoids", "Facial exercises"],
      productSuggestions: [
        { name: "Peptide Complex", benefit: "Firms and lifts" },
        { name: "Bakuchiol", benefit: "Gentle retinol alternative" },
        { name: "Rich Cream", benefit: "Deep nourishment" }
      ],
      routineAdvice: { step1: "Cream cleanser", step2: "Peptide serum", step3: "Eye cream", step4: "Rich moisturizer", step5: "Facial massage daily" },
      treatmentSuggestions: ["Anti-aging facial", "Radiofrequency", "Microcurrent lift"]
    },
    {
      skinType: "combination",
      concerns: ["hormonal changes", "perimenopause effects", "texture changes"],
      age: 48,
      lifestyle: "Busy professional, health-focused",
      currentRoutine: { morning: ["cleanser", "serum", "cream", "SPF"], evening: ["double cleanse", "retinol", "cream"] },
      skinCondition: { hydration: 40, oiliness: 50, sensitivity: 45 },
      recommendations: ["Phytoestrogens", "Adaptogenic ingredients", "Consistent routine"],
      productSuggestions: [
        { name: "Hormone-Support Serum", benefit: "Addresses hormonal changes" },
        { name: "Retinol 0.5%", benefit: "Cell turnover" },
        { name: "Barrier Cream", benefit: "Protects changing skin" }
      ],
      routineAdvice: { step1: "Double cleanse", step2: "Hydrating toner", step3: "Antioxidant serum", step4: "Hormone support", step5: "Rich cream" },
      treatmentSuggestions: ["Balancing facial", "LED combination", "HRT skincare consultation"]
    },
    {
      skinType: "normal",
      concerns: ["maintaining results", "special event prep"],
      age: 32,
      lifestyle: "Getting married in 3 months",
      currentRoutine: { morning: ["full routine"], evening: ["full routine"] },
      skinCondition: { hydration: 65, oiliness: 35, sensitivity: 20 },
      recommendations: ["Bridal skincare plan", "No new products close to event", "Consistent treatments"],
      productSuggestions: [
        { name: "Current favorites", benefit: "Stick with what works" },
        { name: "Glow primer", benefit: "Event day radiance" },
        { name: "Sheet masks", benefit: "Weekly boost" }
      ],
      routineAdvice: { step1: "Maintain current routine", step2: "Weekly sheet mask", step3: "Monthly professional facial", step4: "Glow treatment 1 week before" },
      treatmentSuggestions: ["Bridal facial series", "Light peel 2 weeks before", "Hydrafacial week of"]
    },
    {
      skinType: "oily",
      concerns: ["maskne", "congestion", "mask-related issues"],
      age: 27,
      lifestyle: "Healthcare worker, wears mask 12 hours",
      currentRoutine: { morning: ["cleanser", "moisturizer"], evening: ["cleanser", "treatment"] },
      skinCondition: { hydration: 45, oiliness: 75, sensitivity: 50 },
      recommendations: ["Mask-friendly routine", "Breathable SPF", "Regular cleansing"],
      productSuggestions: [
        { name: "Micellar Water", benefit: "Quick refresh" },
        { name: "Lightweight SPF", benefit: "Non-comedogenic under mask" },
        { name: "Centella Treatment", benefit: "Calms mask irritation" }
      ],
      routineAdvice: { step1: "Pre-mask barrier spray", step2: "Midday cleanse if possible", step3: "Post-mask double cleanse", step4: "Calming serum", step5: "Light moisturizer" },
      treatmentSuggestions: ["Deep cleansing facial", "LED therapy", "Gentle extraction"]
    },
    {
      skinType: "sensitive",
      concerns: ["post-procedure care", "recent laser treatment"],
      age: 40,
      lifestyle: "Just had laser resurfacing",
      currentRoutine: { morning: ["gentle products only"], evening: ["gentle products only"] },
      skinCondition: { hydration: 30, oiliness: 20, sensitivity: 95 },
      recommendations: ["Healing-focused care", "No actives", "Sun avoidance"],
      productSuggestions: [
        { name: "Healing Balm", benefit: "Protects healing skin" },
        { name: "Gentle Cleanser", benefit: "Non-irritating" },
        { name: "Physical SPF 50", benefit: "Maximum protection" }
      ],
      routineAdvice: { step1: "Gentle cleanse only", step2: "Healing serum", step3: "Healing balm", step4: "SPF 50 indoors too", step5: "Follow MD instructions" },
      treatmentSuggestions: ["Follow-up with provider", "No other treatments until healed", "LED after clearance"]
    }
  ];

  for (const analysis of skinAnalyses) {
    await prisma.skinAnalysis.create({ data: analysis });
  }
  console.log(`Created ${skinAnalyses.length} skin analyses`);

  // Seed Sleep Records (15+ items)
  const sleepRecords = [
    {
      date: new Date("2024-01-15"),
      bedtime: "23:30",
      wakeTime: "07:00",
      sleepDuration: 7.5,
      sleepQuality: 7,
      caffeineIntake: true,
      screenTime: 60,
      exercise: false,
      stress: 6,
      roomTemp: "cool",
      noiseLevel: "quiet",
      lightLevel: "dark",
      insights: { pattern: "Late caffeine affecting sleep", quality: "Good despite caffeine" },
      recommendations: ["Cut caffeine after 2pm", "Maintain consistent bedtime"],
      sleepScore: 72
    },
    {
      date: new Date("2024-01-16"),
      bedtime: "22:00",
      wakeTime: "06:30",
      sleepDuration: 8.5,
      sleepQuality: 9,
      caffeineIntake: false,
      screenTime: 30,
      exercise: true,
      stress: 3,
      roomTemp: "cool",
      noiseLevel: "quiet",
      lightLevel: "dark",
      insights: { pattern: "Optimal conditions achieved", quality: "Excellent sleep" },
      recommendations: ["Maintain this routine", "Morning exercise is working"],
      sleepScore: 92
    },
    {
      date: new Date("2024-01-17"),
      bedtime: "01:00",
      wakeTime: "08:00",
      sleepDuration: 7.0,
      sleepQuality: 5,
      caffeineIntake: true,
      screenTime: 120,
      exercise: false,
      stress: 8,
      roomTemp: "warm",
      noiseLevel: "moderate",
      lightLevel: "some light",
      insights: { pattern: "Late night affecting quality", quality: "Poor despite duration" },
      recommendations: ["Earlier bedtime", "Reduce evening screen time", "Cool down room"],
      sleepScore: 55
    },
    {
      date: new Date("2024-01-18"),
      bedtime: "23:00",
      wakeTime: "06:00",
      sleepDuration: 7.0,
      sleepQuality: 6,
      caffeineIntake: false,
      screenTime: 45,
      exercise: true,
      stress: 5,
      roomTemp: "cool",
      noiseLevel: "quiet",
      lightLevel: "dark",
      insights: { pattern: "Short duration compensated by quality conditions" },
      recommendations: ["Try for 30 more minutes of sleep"],
      sleepScore: 68
    },
    {
      date: new Date("2024-01-19"),
      bedtime: "22:30",
      wakeTime: "07:30",
      sleepDuration: 9.0,
      sleepQuality: 8,
      caffeineIntake: false,
      screenTime: 20,
      exercise: true,
      stress: 3,
      roomTemp: "cool",
      noiseLevel: "white noise",
      lightLevel: "dark",
      insights: { pattern: "Extended sleep showing recovery", quality: "Restorative" },
      recommendations: ["This is your optimal sleep pattern", "Maintain weekend consistency"],
      sleepScore: 88
    },
    {
      date: new Date("2024-01-20"),
      bedtime: "00:30",
      wakeTime: "09:00",
      sleepDuration: 8.5,
      sleepQuality: 6,
      caffeineIntake: true,
      screenTime: 90,
      exercise: false,
      stress: 6,
      roomTemp: "warm",
      noiseLevel: "moderate",
      lightLevel: "some light",
      insights: { pattern: "Weekend schedule shift", quality: "Inconsistent" },
      recommendations: ["Keep weekend bedtime within 1 hour of weekday"],
      sleepScore: 62
    },
    {
      date: new Date("2024-01-21"),
      bedtime: "21:30",
      wakeTime: "05:30",
      sleepDuration: 8.0,
      sleepQuality: 8,
      caffeineIntake: false,
      screenTime: 15,
      exercise: true,
      stress: 2,
      roomTemp: "cool",
      noiseLevel: "quiet",
      lightLevel: "dark",
      insights: { pattern: "Early to bed working well", quality: "Excellent" },
      recommendations: ["Natural wake time is ideal", "Continue morning routine"],
      sleepScore: 85
    },
    {
      date: new Date("2024-01-22"),
      bedtime: "23:45",
      wakeTime: "06:45",
      sleepDuration: 7.0,
      sleepQuality: 7,
      caffeineIntake: true,
      screenTime: 60,
      exercise: false,
      stress: 5,
      roomTemp: "cool",
      noiseLevel: "quiet",
      lightLevel: "dark",
      insights: { pattern: "Average night with room for improvement" },
      recommendations: ["Add 30 minutes to sleep", "Reduce screen time before bed"],
      sleepScore: 70
    },
    {
      date: new Date("2024-01-23"),
      bedtime: "22:15",
      wakeTime: "06:15",
      sleepDuration: 8.0,
      sleepQuality: 8,
      caffeineIntake: false,
      screenTime: 30,
      exercise: true,
      stress: 4,
      roomTemp: "cool",
      noiseLevel: "quiet",
      lightLevel: "dark",
      insights: { pattern: "Consistent and restorative", quality: "Very good" },
      recommendations: ["Maintain this pattern", "Consider relaxation before bed"],
      sleepScore: 82
    },
    {
      date: new Date("2024-01-24"),
      bedtime: "02:00",
      wakeTime: "07:00",
      sleepDuration: 5.0,
      sleepQuality: 3,
      caffeineIntake: true,
      screenTime: 180,
      exercise: false,
      stress: 9,
      roomTemp: "warm",
      noiseLevel: "loud",
      lightLevel: "bright",
      insights: { pattern: "Severe sleep deprivation", quality: "Poor" },
      recommendations: ["Priority: Catch up on sleep tonight", "Address stress sources", "Create sleep sanctuary"],
      sleepScore: 35
    },
    {
      date: new Date("2024-01-25"),
      bedtime: "21:00",
      wakeTime: "06:00",
      sleepDuration: 9.0,
      sleepQuality: 9,
      caffeineIntake: false,
      screenTime: 0,
      exercise: true,
      stress: 2,
      roomTemp: "cool",
      noiseLevel: "quiet",
      lightLevel: "dark",
      insights: { pattern: "Recovery sleep successful", quality: "Excellent" },
      recommendations: ["Recovery achieved", "Prevent future sleep debt"],
      sleepScore: 95
    },
    {
      date: new Date("2024-01-26"),
      bedtime: "23:00",
      wakeTime: "07:00",
      sleepDuration: 8.0,
      sleepQuality: 7,
      caffeineIntake: false,
      screenTime: 45,
      exercise: false,
      stress: 5,
      roomTemp: "cool",
      noiseLevel: "quiet",
      lightLevel: "dark",
      insights: { pattern: "Stable pattern", quality: "Good" },
      recommendations: ["Add exercise for better quality", "Maintain consistency"],
      sleepScore: 75
    },
    {
      date: new Date("2024-01-27"),
      bedtime: "22:45",
      wakeTime: "06:45",
      sleepDuration: 8.0,
      sleepQuality: 8,
      caffeineIntake: false,
      screenTime: 30,
      exercise: true,
      stress: 3,
      roomTemp: "cool",
      noiseLevel: "white noise",
      lightLevel: "dark",
      insights: { pattern: "Excellent conditions", quality: "Very good" },
      recommendations: ["Keep this routine", "Consider sleep-supporting supplements"],
      sleepScore: 84
    },
    {
      date: new Date("2024-01-28"),
      bedtime: "00:00",
      wakeTime: "08:30",
      sleepDuration: 8.5,
      sleepQuality: 6,
      caffeineIntake: true,
      screenTime: 75,
      exercise: false,
      stress: 6,
      roomTemp: "cool",
      noiseLevel: "moderate",
      lightLevel: "some light",
      insights: { pattern: "Later timing affecting quality", quality: "Moderate" },
      recommendations: ["Move bedtime 30 minutes earlier", "Reduce evening stimulation"],
      sleepScore: 65
    },
    {
      date: new Date("2024-01-29"),
      bedtime: "22:30",
      wakeTime: "06:30",
      sleepDuration: 8.0,
      sleepQuality: 8,
      caffeineIntake: false,
      screenTime: 20,
      exercise: true,
      stress: 3,
      roomTemp: "cool",
      noiseLevel: "quiet",
      lightLevel: "dark",
      insights: { pattern: "Back to optimal pattern", quality: "Excellent" },
      recommendations: ["This is your ideal routine", "Consider spa relaxation treatments"],
      sleepScore: 86
    },
    {
      date: new Date("2024-01-30"),
      bedtime: "23:15",
      wakeTime: "07:15",
      sleepDuration: 8.0,
      sleepQuality: 7,
      caffeineIntake: false,
      screenTime: 40,
      exercise: true,
      stress: 4,
      roomTemp: "cool",
      noiseLevel: "quiet",
      lightLevel: "dark",
      insights: { pattern: "Consistently good", quality: "Good" },
      recommendations: ["Maintain current habits", "Try evening relaxation routine"],
      sleepScore: 78
    }
  ];

  for (const record of sleepRecords) {
    await prisma.sleepRecord.create({ data: record });
  }
  console.log(`Created ${sleepRecords.length} sleep records`);

  // Seed Posture Assessments (15+ items)
  const postureAssessments = [
    {
      occupation: "Software Developer",
      hoursSeated: 10,
      painAreas: ["lower back", "neck", "shoulders"],
      currentIssues: ["forward head posture", "rounded shoulders"],
      activityLevel: "sedentary",
      postureScore: 45,
      issues: [
        { area: "Neck", severity: "moderate", description: "Forward head posture causing strain" },
        { area: "Shoulders", severity: "moderate", description: "Rounded shoulders from screen work" }
      ],
      exercises: [
        { name: "Chin Tucks", reps: "10", frequency: "Every hour" },
        { name: "Chest Doorway Stretch", duration: "30 seconds", frequency: "3x daily" }
      ],
      ergonomicTips: ["Raise monitor to eye level", "Use standing desk intervals", "Keyboard at elbow height"],
      improvementPlan: { week1: "Awareness", week2: "Stretches", week3: "Strengthening", week4: "Habit formation" }
    },
    {
      occupation: "Nurse",
      hoursSeated: 3,
      painAreas: ["lower back", "feet"],
      currentIssues: ["lower back strain from lifting", "leg fatigue"],
      activityLevel: "very active",
      postureScore: 60,
      issues: [
        { area: "Lower Back", severity: "moderate", description: "Strain from patient lifting" },
        { area: "Feet", severity: "mild", description: "Fatigue from standing" }
      ],
      exercises: [
        { name: "Bird Dog", reps: "10 each side", frequency: "Daily" },
        { name: "Glute Bridges", reps: "15", frequency: "Daily" }
      ],
      ergonomicTips: ["Use proper lifting technique", "Supportive footwear", "Take sitting breaks"],
      improvementPlan: { week1: "Core activation", week2: "Lifting technique", week3: "Recovery routine", week4: "Prevention" }
    },
    {
      occupation: "Teacher",
      hoursSeated: 4,
      painAreas: ["upper back", "voice strain"],
      currentIssues: ["standing fatigue", "shoulder tension"],
      activityLevel: "moderately active",
      postureScore: 65,
      issues: [
        { area: "Upper Back", severity: "mild", description: "Tension from standing and writing" },
        { area: "Shoulders", severity: "mild", description: "Raised shoulders when writing on board" }
      ],
      exercises: [
        { name: "Shoulder Rolls", reps: "10 each direction", frequency: "Hourly" },
        { name: "Thoracic Extension", reps: "10", frequency: "After each class" }
      ],
      ergonomicTips: ["Alternate standing/sitting", "Use wireless mic", "Position board at proper height"],
      improvementPlan: { week1: "Shoulder awareness", week2: "Posture breaks", week3: "Strengthening", week4: "Maintenance" }
    },
    {
      occupation: "Hairstylist",
      hoursSeated: 1,
      painAreas: ["shoulders", "wrists", "feet"],
      currentIssues: ["elevated shoulders", "repetitive strain"],
      activityLevel: "active",
      postureScore: 55,
      issues: [
        { area: "Shoulders", severity: "moderate", description: "Elevated from styling" },
        { area: "Wrists", severity: "moderate", description: "Repetitive motion strain" }
      ],
      exercises: [
        { name: "Wrist Circles", reps: "10 each direction", frequency: "Between clients" },
        { name: "Shoulder Drops", reps: "Hold 5 seconds", frequency: "Every 30 minutes" }
      ],
      ergonomicTips: ["Adjust client chair height", "Use ergonomic tools", "Compression socks"],
      improvementPlan: { week1: "Tool assessment", week2: "Stretching routine", week3: "Strengthening", week4: "Workstation setup" }
    },
    {
      occupation: "Driver",
      hoursSeated: 8,
      painAreas: ["lower back", "hips", "neck"],
      currentIssues: ["lumbar strain", "hip tightness"],
      activityLevel: "sedentary",
      postureScore: 40,
      issues: [
        { area: "Lower Back", severity: "high", description: "Prolonged sitting causing compression" },
        { area: "Hips", severity: "moderate", description: "Tight hip flexors from seated position" }
      ],
      exercises: [
        { name: "Hip Flexor Stretch", duration: "30 seconds each side", frequency: "Every stop" },
        { name: "Seated Cat-Cow", reps: "10", frequency: "Hourly" }
      ],
      ergonomicTips: ["Lumbar support cushion", "Adjust seat position", "Take walking breaks"],
      improvementPlan: { week1: "Support setup", week2: "Break schedule", week3: "Hip mobility", week4: "Core strength" }
    },
    {
      occupation: "Dentist",
      hoursSeated: 6,
      painAreas: ["neck", "upper back", "shoulders"],
      currentIssues: ["forward lean", "asymmetric posture"],
      activityLevel: "light",
      postureScore: 50,
      issues: [
        { area: "Neck", severity: "high", description: "Chronic forward flexion" },
        { area: "Upper Back", severity: "moderate", description: "Kyphosis from leaning" }
      ],
      exercises: [
        { name: "Neck Retractions", reps: "10", frequency: "Between patients" },
        { name: "Prone Y Raises", reps: "12", frequency: "Daily" }
      ],
      ergonomicTips: ["Loupes with proper angle", "Saddle stool", "Patient positioning"],
      improvementPlan: { week1: "Equipment assessment", week2: "Positioning practice", week3: "Stretching routine", week4: "Strengthening" }
    },
    {
      occupation: "Student",
      hoursSeated: 8,
      painAreas: ["neck", "lower back"],
      currentIssues: ["text neck", "slouching"],
      activityLevel: "light",
      postureScore: 48,
      issues: [
        { area: "Neck", severity: "moderate", description: "Text neck from phone use" },
        { area: "Lower Back", severity: "moderate", description: "Slouching during lectures" }
      ],
      exercises: [
        { name: "Wall Angels", reps: "10", frequency: "Twice daily" },
        { name: "Desk Stretches", duration: "5 minutes", frequency: "Every class break" }
      ],
      ergonomicTips: ["Hold phone at eye level", "Use laptop stand", "Sit at front of chair"],
      improvementPlan: { week1: "Phone habits", week2: "Study posture", week3: "Movement breaks", week4: "Habit building" }
    },
    {
      occupation: "Chef",
      hoursSeated: 0,
      painAreas: ["lower back", "feet", "shoulders"],
      currentIssues: ["standing fatigue", "repetitive motions"],
      activityLevel: "very active",
      postureScore: 58,
      issues: [
        { area: "Lower Back", severity: "moderate", description: "Strain from bending over counter" },
        { area: "Feet", severity: "high", description: "Long standing hours" }
      ],
      exercises: [
        { name: "Calf Raises", reps: "15", frequency: "During prep" },
        { name: "Counter Stretch", duration: "30 seconds", frequency: "Hourly" }
      ],
      ergonomicTips: ["Anti-fatigue mats", "Counter height check", "Supportive kitchen shoes"],
      improvementPlan: { week1: "Footwear upgrade", week2: "Counter ergonomics", week3: "Stretching routine", week4: "Recovery routine" }
    },
    {
      occupation: "Accountant",
      hoursSeated: 9,
      painAreas: ["eyes", "neck", "wrists"],
      currentIssues: ["monitor glare strain", "keyboard posture"],
      activityLevel: "sedentary",
      postureScore: 52,
      issues: [
        { area: "Eyes", severity: "moderate", description: "Digital eye strain" },
        { area: "Wrists", severity: "moderate", description: "Poor keyboard position" }
      ],
      exercises: [
        { name: "20-20-20 Rule", frequency: "Every 20 minutes" },
        { name: "Wrist Stretches", duration: "30 seconds", frequency: "Hourly" }
      ],
      ergonomicTips: ["Anti-glare screen", "Ergonomic keyboard", "Document holder"],
      improvementPlan: { week1: "Screen setup", week2: "Keyboard position", week3: "Break schedule", week4: "Full ergonomic audit" }
    },
    {
      occupation: "Retail Worker",
      hoursSeated: 2,
      painAreas: ["feet", "lower back", "knees"],
      currentIssues: ["standing on hard floors", "reaching high shelves"],
      activityLevel: "active",
      postureScore: 62,
      issues: [
        { area: "Feet", severity: "moderate", description: "Hard floor standing" },
        { area: "Lower Back", severity: "mild", description: "Reaching and bending" }
      ],
      exercises: [
        { name: "Toe Raises", reps: "15", frequency: "Twice daily" },
        { name: "Back Extensions", reps: "10", frequency: "Before shift" }
      ],
      ergonomicTips: ["Step stool for reaching", "Cushioned insoles", "Proper lifting technique"],
      improvementPlan: { week1: "Footwear assessment", week2: "Lifting technique", week3: "Stretching routine", week4: "Strengthening" }
    },
    {
      occupation: "Graphic Designer",
      hoursSeated: 9,
      painAreas: ["wrists", "neck", "eyes"],
      currentIssues: ["mouse arm", "dual monitor strain"],
      activityLevel: "sedentary",
      postureScore: 47,
      issues: [
        { area: "Wrist", severity: "high", description: "Mouse overuse" },
        { area: "Neck", severity: "moderate", description: "Turning between monitors" }
      ],
      exercises: [
        { name: "Wrist Extensions", reps: "10", frequency: "Every 30 minutes" },
        { name: "Neck Rotations", reps: "5 each direction", frequency: "Hourly" }
      ],
      ergonomicTips: ["Vertical mouse", "Centered primary monitor", "Drawing tablet position"],
      improvementPlan: { week1: "Mouse alternatives", week2: "Monitor arrangement", week3: "Break software", week4: "Workstation redesign" }
    },
    {
      occupation: "Yoga Instructor",
      hoursSeated: 2,
      painAreas: ["shoulders", "hips"],
      currentIssues: ["hypermobility", "demonstration fatigue"],
      activityLevel: "very active",
      postureScore: 75,
      issues: [
        { area: "Shoulders", severity: "mild", description: "Overstretching" },
        { area: "Hips", severity: "mild", description: "Hypermobility concerns" }
      ],
      exercises: [
        { name: "Shoulder Stabilization", reps: "12", frequency: "Daily" },
        { name: "Hip Strengthening", reps: "15", frequency: "Daily" }
      ],
      ergonomicTips: ["Focus on stability over flexibility", "Verbal cues over demos", "Self-practice modifications"],
      improvementPlan: { week1: "Assessment", week2: "Stability work", week3: "Demo alternatives", week4: "Balance maintenance" }
    },
    {
      occupation: "Call Center Agent",
      hoursSeated: 8,
      painAreas: ["neck", "back", "shoulders"],
      currentIssues: ["phone cradling", "fixed posture"],
      activityLevel: "sedentary",
      postureScore: 44,
      issues: [
        { area: "Neck", severity: "high", description: "Phone cradling strain" },
        { area: "Shoulders", severity: "moderate", description: "Elevated from typing while talking" }
      ],
      exercises: [
        { name: "Neck Side Stretches", duration: "20 seconds each", frequency: "After each call" },
        { name: "Shoulder Shrugs", reps: "10", frequency: "Hourly" }
      ],
      ergonomicTips: ["Headset mandatory", "Monitor at eye level", "Standing desk option"],
      improvementPlan: { week1: "Headset transition", week2: "Desk setup", week3: "Movement breaks", week4: "Habit formation" }
    },
    {
      occupation: "Massage Therapist",
      hoursSeated: 1,
      painAreas: ["thumbs", "wrists", "shoulders"],
      currentIssues: ["repetitive strain", "body mechanics"],
      activityLevel: "active",
      postureScore: 58,
      issues: [
        { area: "Hands", severity: "moderate", description: "Overuse injury risk" },
        { area: "Shoulders", severity: "mild", description: "Improper body mechanics" }
      ],
      exercises: [
        { name: "Thumb Stretches", duration: "30 seconds", frequency: "Between clients" },
        { name: "Forearm Rolling", duration: "1 minute", frequency: "After each client" }
      ],
      ergonomicTips: ["Use body weight not hands", "Adjustable table height", "Tool-assisted techniques"],
      improvementPlan: { week1: "Body mechanics training", week2: "Tool integration", week3: "Self-care routine", week4: "Prevention protocol" }
    },
    {
      occupation: "Construction Worker",
      hoursSeated: 0,
      painAreas: ["back", "knees", "shoulders"],
      currentIssues: ["heavy lifting", "awkward positions"],
      activityLevel: "very active",
      postureScore: 55,
      issues: [
        { area: "Lower Back", severity: "high", description: "Lifting mechanics" },
        { area: "Knees", severity: "moderate", description: "Kneeling and squatting" }
      ],
      exercises: [
        { name: "Dead Bug", reps: "10 each side", frequency: "Before work" },
        { name: "Hip Hinges", reps: "15", frequency: "After work" }
      ],
      ergonomicTips: ["Knee pads", "Lifting belt for heavy loads", "Team lifts when possible"],
      improvementPlan: { week1: "Lifting technique", week2: "Pre-work warm-up", week3: "Recovery routine", week4: "Injury prevention" }
    }
  ];

  for (const assessment of postureAssessments) {
    await prisma.postureAssessment.create({ data: assessment });
  }
  console.log(`Created ${postureAssessments.length} posture assessments`);

  // Seed AI Product Recommendations (15+ items)
  const productRecommendations = [
    {
      skinType: "oily",
      hairType: "straight",
      concerns: ["acne", "oily scalp"],
      allergies: ["fragrance"],
      budget: "mid-range",
      preferences: { vegan: true, crueltyFree: true },
      products: [
        { name: "Oil-Free Cleanser", category: "Skincare", price: 28, reason: "Controls excess oil without stripping" },
        { name: "Clarifying Shampoo", category: "Haircare", price: 24, reason: "Removes scalp buildup" },
        { name: "Lightweight Moisturizer", category: "Skincare", price: 32, reason: "Hydrates without clogging pores" }
      ],
      routines: { morning: ["Cleanse", "Tone", "Moisturize", "SPF"], evening: ["Double cleanse", "Treatment", "Moisturize"] },
      alternatives: [{ original: "Premium Cleanser", alternative: "Budget Cleanser", savings: 15 }]
    },
    {
      skinType: "dry",
      hairType: "curly",
      concerns: ["dehydration", "frizz"],
      allergies: [],
      budget: "luxury",
      preferences: { organic: true },
      products: [
        { name: "Cream Cleanser", category: "Skincare", price: 45, reason: "Hydrating formula for dry skin" },
        { name: "Curl Defining Cream", category: "Haircare", price: 38, reason: "Defines curls, reduces frizz" },
        { name: "Hyaluronic Serum", category: "Skincare", price: 85, reason: "Deep hydration boost" }
      ],
      routines: { morning: ["Gentle cleanse", "Serum", "Rich cream", "SPF"], evening: ["Oil cleanse", "Cream cleanse", "Night mask"] },
      alternatives: [{ original: "Luxury Serum", alternative: "Drugstore HA", savings: 60 }]
    },
    {
      skinType: "combination",
      hairType: "wavy",
      concerns: ["uneven tone", "damage"],
      allergies: ["sulfates"],
      budget: "budget",
      preferences: { sulfateFree: true },
      products: [
        { name: "Gel Cleanser", category: "Skincare", price: 15, reason: "Balances combination skin" },
        { name: "Sulfate-Free Shampoo", category: "Haircare", price: 12, reason: "Gentle cleansing" },
        { name: "Vitamin C Serum", category: "Skincare", price: 20, reason: "Brightens without irritation" }
      ],
      routines: { morning: ["Cleanse", "Vitamin C", "Moisturize", "SPF"], evening: ["Cleanse", "Exfoliate 2x week", "Moisturize"] },
      alternatives: []
    },
    {
      skinType: "sensitive",
      hairType: "fine",
      concerns: ["redness", "thin hair"],
      allergies: ["alcohol", "fragrance"],
      budget: "mid-range",
      preferences: { hypoallergenic: true },
      products: [
        { name: "Micellar Water", category: "Skincare", price: 18, reason: "Gentle cleansing for sensitive skin" },
        { name: "Volumizing Mousse", category: "Haircare", price: 22, reason: "Adds body without weight" },
        { name: "Calming Cream", category: "Skincare", price: 35, reason: "Reduces redness" }
      ],
      routines: { morning: ["Micellar water", "Calming serum", "Barrier cream", "Mineral SPF"], evening: ["Gentle cleanse", "Soothing mask 2x week", "Night cream"] },
      alternatives: [{ original: "Branded Mousse", alternative: "Generic version", savings: 10 }]
    },
    {
      skinType: "normal",
      hairType: "thick",
      concerns: ["maintenance", "dryness"],
      allergies: [],
      budget: "luxury",
      preferences: { antiAging: true },
      products: [
        { name: "Enzyme Cleanser", category: "Skincare", price: 55, reason: "Gentle exfoliation" },
        { name: "Argan Oil", category: "Haircare", price: 42, reason: "Nourishes thick hair" },
        { name: "Retinol Serum", category: "Skincare", price: 95, reason: "Anti-aging powerhouse" }
      ],
      routines: { morning: ["Cleanse", "Vitamin C", "Peptide cream", "SPF 50"], evening: ["Double cleanse", "Retinol 3x week", "Rich night cream"] },
      alternatives: []
    },
    {
      skinType: "oily",
      hairType: "colored",
      concerns: ["large pores", "color fade"],
      allergies: [],
      budget: "mid-range",
      preferences: { colorSafe: true },
      products: [
        { name: "Charcoal Cleanser", category: "Skincare", price: 25, reason: "Deep cleans pores" },
        { name: "Color Protect Shampoo", category: "Haircare", price: 28, reason: "Extends color vibrancy" },
        { name: "Pore Minimizer Serum", category: "Skincare", price: 38, reason: "Refines pore appearance" }
      ],
      routines: { morning: ["Cleanse", "Toner", "Light moisturizer", "SPF"], evening: ["Oil cleanse", "Charcoal cleanse", "Pore serum", "Gel cream"] },
      alternatives: [{ original: "Salon Color Shampoo", alternative: "Drugstore option", savings: 18 }]
    },
    {
      skinType: "dry",
      hairType: "natural/coily",
      concerns: ["eczema-prone", "shrinkage"],
      allergies: ["lanolin"],
      budget: "mid-range",
      preferences: { blackOwned: true },
      products: [
        { name: "Cream Cleanser", category: "Skincare", price: 28, reason: "Non-stripping for eczema" },
        { name: "Twist Butter", category: "Haircare", price: 18, reason: "Defines coils, adds moisture" },
        { name: "Eczema Balm", category: "Skincare", price: 32, reason: "Soothes and protects" }
      ],
      routines: { morning: ["Splash water", "Eczema cream", "SPF"], evening: ["Cream cleanse", "Treatment", "Occlusive balm"] },
      alternatives: []
    },
    {
      skinType: "combination",
      hairType: "straight",
      concerns: ["acne scars", "oily roots"],
      allergies: [],
      budget: "budget",
      preferences: {},
      products: [
        { name: "Salicylic Cleanser", category: "Skincare", price: 12, reason: "Clears breakouts" },
        { name: "Dry Shampoo", category: "Haircare", price: 8, reason: "Extends wash days" },
        { name: "Niacinamide Serum", category: "Skincare", price: 15, reason: "Fades scars" }
      ],
      routines: { morning: ["Cleanse", "Niacinamide", "Moisturize", "SPF"], evening: ["Cleanse", "AHA 2x week", "Moisturize"] },
      alternatives: []
    },
    {
      skinType: "sensitive",
      hairType: "curly",
      concerns: ["rosacea", "frizz"],
      allergies: ["essential oils", "fragrance"],
      budget: "luxury",
      preferences: { dermatologistRecommended: true },
      products: [
        { name: "Thermal Water Cleanser", category: "Skincare", price: 38, reason: "Soothes rosacea" },
        { name: "Fragrance-Free Curl Cream", category: "Haircare", price: 32, reason: "Defines without irritation" },
        { name: "Azelaic Acid", category: "Skincare", price: 45, reason: "Treats rosacea gently" }
      ],
      routines: { morning: ["Thermal water", "Azelaic acid", "Barrier cream", "Mineral SPF"], evening: ["Gentle cleanse", "Calming serum", "Night cream"] },
      alternatives: []
    },
    {
      skinType: "normal",
      hairType: "wavy",
      concerns: ["dullness", "heat damage"],
      allergies: [],
      budget: "mid-range",
      preferences: { clean: true },
      products: [
        { name: "Gel-to-Foam Cleanser", category: "Skincare", price: 26, reason: "Refreshing cleanse" },
        { name: "Heat Protectant Spray", category: "Haircare", price: 22, reason: "Shields from damage" },
        { name: "Glow Serum", category: "Skincare", price: 42, reason: "Instant radiance" }
      ],
      routines: { morning: ["Cleanse", "Glow serum", "Moisturize", "SPF"], evening: ["Double cleanse", "Treatment alternate", "Night cream"] },
      alternatives: [{ original: "Luxury Glow Serum", alternative: "Budget dupe", savings: 25 }]
    },
    {
      skinType: "oily",
      hairType: "thick",
      concerns: ["blackheads", "oily scalp"],
      allergies: [],
      budget: "budget",
      preferences: {},
      products: [
        { name: "Clay Cleanser", category: "Skincare", price: 14, reason: "Draws out impurities" },
        { name: "Tea Tree Shampoo", category: "Haircare", price: 10, reason: "Controls scalp oil" },
        { name: "BHA Liquid", category: "Skincare", price: 18, reason: "Exfoliates pores" }
      ],
      routines: { morning: ["Cleanse", "BHA", "Light moisturize", "SPF"], evening: ["Cleanse", "Clay mask 2x week", "Oil-free moisturizer"] },
      alternatives: []
    },
    {
      skinType: "dry",
      hairType: "fine",
      concerns: ["aging", "flat hair"],
      allergies: ["silicones"],
      budget: "luxury",
      preferences: { antiAging: true, silicone-free: true },
      products: [
        { name: "Oil Cleanser", category: "Skincare", price: 52, reason: "Deeply nourishes" },
        { name: "Root Lift Spray", category: "Haircare", price: 28, reason: "Volume without silicone" },
        { name: "Peptide Complex", category: "Skincare", price: 120, reason: "Firms and plumps" }
      ],
      routines: { morning: ["Oil cleanse", "Vitamin C", "Peptide serum", "Rich SPF"], evening: ["Double cleanse", "Retinol alternate", "Facial oil", "Night cream"] },
      alternatives: []
    },
    {
      skinType: "combination",
      hairType: "colored",
      concerns: ["hormonal acne", "brassiness"],
      allergies: [],
      budget: "mid-range",
      preferences: { hormoneBalancing: true },
      products: [
        { name: "Gentle Foaming Cleanser", category: "Skincare", price: 22, reason: "Non-irritating cleanse" },
        { name: "Purple Shampoo", category: "Haircare", price: 24, reason: "Neutralizes brassiness" },
        { name: "Spearmint Complex", category: "Supplements", price: 28, reason: "Hormonal balance support" }
      ],
      routines: { morning: ["Cleanse", "Zinc serum", "Moisturize", "SPF"], evening: ["Cleanse", "Azelaic acid", "Spot treatment", "Moisturize"] },
      alternatives: []
    },
    {
      skinType: "sensitive",
      hairType: "straight",
      concerns: ["perioral dermatitis", "scalp sensitivity"],
      allergies: ["fluoride", "SLS"],
      budget: "mid-range",
      preferences: { minimal: true },
      products: [
        { name: "Zero Cleanser", category: "Skincare", price: 20, reason: "Minimal ingredients" },
        { name: "Baby Shampoo", category: "Haircare", price: 8, reason: "Ultra gentle" },
        { name: "Zinc Cream", category: "Skincare", price: 15, reason: "Calms dermatitis" }
      ],
      routines: { morning: ["Water splash", "Zinc cream if needed", "Mineral SPF"], evening: ["Gentle cleanse", "Nothing else"] },
      alternatives: []
    },
    {
      skinType: "normal",
      hairType: "curly",
      concerns: ["prevention", "definition"],
      allergies: [],
      budget: "luxury",
      preferences: { sustainableBrands: true },
      products: [
        { name: "Prebiotic Cleanser", category: "Skincare", price: 48, reason: "Supports skin microbiome" },
        { name: "Curl Defining Gel", category: "Haircare", price: 35, reason: "Strong hold, no crunch" },
        { name: "Antioxidant Serum", category: "Skincare", price: 78, reason: "Environmental protection" }
      ],
      routines: { morning: ["Cleanse", "Antioxidant serum", "Moisturize", "SPF"], evening: ["Double cleanse", "Retinol 2x week", "Night serum", "Cream"] },
      alternatives: []
    },
    {
      skinType: "oily",
      hairType: "wavy",
      concerns: ["fungal acne", "dandruff"],
      allergies: ["fatty alcohols", "fermented ingredients"],
      budget: "budget",
      preferences: { fungalAcneSafe: true },
      products: [
        { name: "Zinc Pyrithione Bar", category: "Skincare", price: 8, reason: "Anti-fungal cleansing" },
        { name: "Ketoconazole Shampoo", category: "Haircare", price: 15, reason: "Treats dandruff and FA" },
        { name: "Squalane Oil", category: "Skincare", price: 12, reason: "FA-safe moisture" }
      ],
      routines: { morning: ["Zinc bar cleanse", "Squalane", "SPF"], evening: ["Cleanse", "Squalane only"] },
      alternatives: []
    }
  ];

  for (const rec of productRecommendations) {
    await prisma.aIProductRecommendation.create({ data: rec });
  }
  console.log(`Created ${productRecommendations.length} AI product recommendations`);

  // Seed AI Loyalty Optimizations (15+ items)
  const loyaltyOptimizations = [
    {
      businessId: "biz-001",
      programData: { currentPoints: 1, rewards: 5, members: 500 },
      memberData: { avgVisits: 4.2, avgSpend: 85, retentionRate: 65 },
      transactionData: { totalRedemptions: 150, avgRedemptionValue: 25 },
      programSuggestions: [
        { suggestion: "Increase points per dollar from 1 to 1.5", impact: "15% engagement boost" },
        { suggestion: "Add birthday bonus points", impact: "8% retention improvement" }
      ],
      rewardOptimizations: [
        { reward: "$10 off service", suggestion: "Change to $15 for 150 points", reason: "Better perceived value" },
        { reward: "Free add-on", suggestion: "Popular choice - keep", reason: "High redemption rate" }
      ],
      engagementStrategies: ["Monthly double points events", "Referral bonus", "Early access to new services"],
      retentionTactics: ["Re-engagement email at 45 days", "Points expiration reminder", "VIP tier benefits"],
      projectedROI: 2500.00,
      projectedRetention: 78.5
    },
    {
      businessId: "biz-002",
      programData: { currentPoints: 2, rewards: 8, members: 1200 },
      memberData: { avgVisits: 6.1, avgSpend: 120, retentionRate: 72 },
      transactionData: { totalRedemptions: 450, avgRedemptionValue: 35 },
      programSuggestions: [
        { suggestion: "Introduce tiered membership", impact: "20% high-value retention" },
        { suggestion: "Add product purchase points", impact: "12% product sales increase" }
      ],
      rewardOptimizations: [
        { reward: "Free blowout", suggestion: "Add as mid-tier reward", reason: "Drives visits" },
        { reward: "VIP treatment upgrade", suggestion: "Reserve for top tier", reason: "Exclusivity value" }
      ],
      engagementStrategies: ["Gamification challenges", "Social sharing bonus", "Anniversary rewards"],
      retentionTactics: ["Personal stylist matching", "Preference-based offers", "Surprise and delight moments"],
      projectedROI: 8500.00,
      projectedRetention: 82.0
    },
    {
      businessId: "biz-003",
      programData: { currentPoints: 1, rewards: 3, members: 200 },
      memberData: { avgVisits: 2.5, avgSpend: 55, retentionRate: 45 },
      transactionData: { totalRedemptions: 30, avgRedemptionValue: 15 },
      programSuggestions: [
        { suggestion: "Simplify point structure", impact: "25% enrollment increase" },
        { suggestion: "Lower first reward threshold", impact: "40% faster first redemption" }
      ],
      rewardOptimizations: [
        { reward: "10% off", suggestion: "Change to dollar amount", reason: "Clearer value perception" },
        { reward: "Free product sample", suggestion: "Add as low-tier option", reason: "Quick win for new members" }
      ],
      engagementStrategies: ["New member welcome bonus", "First visit points boost", "Simple mobile check-in"],
      retentionTactics: ["Text reminders for points balance", "Easy redemption process", "Staff prompts at checkout"],
      projectedROI: 800.00,
      projectedRetention: 58.0
    },
    {
      businessId: "biz-004",
      programData: { currentPoints: 1.5, rewards: 6, members: 800 },
      memberData: { avgVisits: 5.0, avgSpend: 95, retentionRate: 68 },
      transactionData: { totalRedemptions: 280, avgRedemptionValue: 30 },
      programSuggestions: [
        { suggestion: "Add partner rewards (coffee shop next door)", impact: "Community building" },
        { suggestion: "Seasonal bonus categories", impact: "10% seasonal revenue boost" }
      ],
      rewardOptimizations: [
        { reward: "Free service", suggestion: "Require minimum spend", reason: "Prevents loss on low-value services" },
        { reward: "Retail discount", suggestion: "Increase to drive product sales", reason: "Higher margin items" }
      ],
      engagementStrategies: ["Local business partnerships", "Community events", "Client appreciation days"],
      retentionTactics: ["Family member enrollment", "Service bundling incentives", "Loyalty member exclusives"],
      projectedROI: 4200.00,
      projectedRetention: 75.0
    },
    {
      businessId: "biz-005",
      programData: { currentPoints: 2, rewards: 10, members: 2500 },
      memberData: { avgVisits: 7.5, avgSpend: 150, retentionRate: 80 },
      transactionData: { totalRedemptions: 800, avgRedemptionValue: 45 },
      programSuggestions: [
        { suggestion: "Introduce platinum tier", impact: "Top 10% spend increase 25%" },
        { suggestion: "Add experiential rewards", impact: "Brand differentiation" }
      ],
      rewardOptimizations: [
        { reward: "Spa day package", suggestion: "Create limited availability", reason: "Increases urgency" },
        { reward: "Product bundles", suggestion: "Curate by skin/hair type", reason: "Personalization value" }
      ],
      engagementStrategies: ["VIP early access events", "Brand ambassador program", "Exclusive masterclasses"],
      retentionTactics: ["Dedicated loyalty concierge", "Predictive booking offers", "Life event recognition"],
      projectedROI: 25000.00,
      projectedRetention: 88.0
    },
    {
      businessId: "biz-006",
      programData: { currentPoints: 1, rewards: 4, members: 350 },
      memberData: { avgVisits: 3.2, avgSpend: 70, retentionRate: 52 },
      transactionData: { totalRedemptions: 65, avgRedemptionValue: 20 },
      programSuggestions: [
        { suggestion: "Create punch card for frequent services", impact: "Service-specific loyalty" },
        { suggestion: "Add referral rewards", impact: "15% new client acquisition" }
      ],
      rewardOptimizations: [
        { reward: "Percentage discounts", suggestion: "Convert to fixed amounts", reason: "Easier to understand" },
        { reward: "Upgrade rewards", suggestion: "Add service upgrades", reason: "Introduces premium services" }
      ],
      engagementStrategies: ["Monthly challenges", "Social check-in rewards", "Review incentives"],
      retentionTactics: ["Win-back campaigns", "Lapsed client offers", "Personalized reminders"],
      projectedROI: 1500.00,
      projectedRetention: 62.0
    },
    {
      businessId: "biz-007",
      programData: { currentPoints: 1.5, rewards: 7, members: 600 },
      memberData: { avgVisits: 4.8, avgSpend: 88, retentionRate: 64 },
      transactionData: { totalRedemptions: 180, avgRedemptionValue: 28 },
      programSuggestions: [
        { suggestion: "Add wellness service points bonus", impact: "Cross-sell wellness" },
        { suggestion: "Create family rewards program", impact: "Multi-member households" }
      ],
      rewardOptimizations: [
        { reward: "Free treatment", suggestion: "Limit to select treatments", reason: "Margin protection" },
        { reward: "Product rewards", suggestion: "Partner with vendors for samples", reason: "Low cost, high value" }
      ],
      engagementStrategies: ["Wellness Wednesday bonuses", "Self-care challenges", "Mindfulness rewards"],
      retentionTactics: ["Holistic client profiles", "Multi-service bundles", "Wellness check-ins"],
      projectedROI: 3200.00,
      projectedRetention: 72.0
    },
    {
      businessId: "biz-008",
      programData: { currentPoints: 2, rewards: 5, members: 450 },
      memberData: { avgVisits: 3.8, avgSpend: 110, retentionRate: 58 },
      transactionData: { totalRedemptions: 120, avgRedemptionValue: 32 },
      programSuggestions: [
        { suggestion: "Launch mobile app for loyalty", impact: "40% digital engagement" },
        { suggestion: "Add instant rewards option", impact: "Quick gratification appeal" }
      ],
      rewardOptimizations: [
        { reward: "Big rewards only", suggestion: "Add small instant rewards", reason: "More frequent engagement" },
        { reward: "Service-only rewards", suggestion: "Add retail options", reason: "Diverse redemption" }
      ],
      engagementStrategies: ["App-exclusive offers", "Push notification rewards", "Digital punch cards"],
      retentionTactics: ["Personalized app experience", "Saved preferences", "One-tap booking"],
      projectedROI: 5500.00,
      projectedRetention: 70.0
    },
    {
      businessId: "biz-009",
      programData: { currentPoints: 1, rewards: 6, members: 900 },
      memberData: { avgVisits: 5.5, avgSpend: 75, retentionRate: 71 },
      transactionData: { totalRedemptions: 320, avgRedemptionValue: 22 },
      programSuggestions: [
        { suggestion: "Add service frequency bonuses", impact: "Regular booking incentive" },
        { suggestion: "Create subscription model option", impact: "Predictable revenue" }
      ],
      rewardOptimizations: [
        { reward: "Low-value rewards", suggestion: "Consolidate into better options", reason: "Simplify choices" },
        { reward: "Time-limited rewards", suggestion: "Add seasonal specials", reason: "Creates urgency" }
      ],
      engagementStrategies: ["Membership perks", "Subscriber exclusives", "Priority booking"],
      retentionTactics: ["Auto-rebooking incentives", "Subscription discounts", "Commitment rewards"],
      projectedROI: 6800.00,
      projectedRetention: 79.0
    },
    {
      businessId: "biz-010",
      programData: { currentPoints: 1.5, rewards: 8, members: 1500 },
      memberData: { avgVisits: 6.2, avgSpend: 130, retentionRate: 75 },
      transactionData: { totalRedemptions: 550, avgRedemptionValue: 40 },
      programSuggestions: [
        { suggestion: "Add charitable giving option", impact: "Values-aligned engagement" },
        { suggestion: "Create exclusive member events", impact: "Community building" }
      ],
      rewardOptimizations: [
        { reward: "Donate points option", suggestion: "Partner with local charity", reason: "Social impact appeal" },
        { reward: "Experience rewards", suggestion: "Add event tickets", reason: "Memorable experiences" }
      ],
      engagementStrategies: ["Cause marketing", "Sustainability rewards", "Community involvement"],
      retentionTactics: ["Shared values connection", "Member community", "Impact reporting"],
      projectedROI: 12000.00,
      projectedRetention: 83.0
    },
    {
      businessId: "biz-011",
      programData: { currentPoints: 2, rewards: 4, members: 280 },
      memberData: { avgVisits: 2.8, avgSpend: 200, retentionRate: 55 },
      transactionData: { totalRedemptions: 45, avgRedemptionValue: 60 },
      programSuggestions: [
        { suggestion: "Focus on high-value client retention", impact: "Premium segment growth" },
        { suggestion: "Add concierge-level rewards", impact: "Luxury experience" }
      ],
      rewardOptimizations: [
        { reward: "Standard discounts", suggestion: "Replace with exclusive experiences", reason: "Matches clientele" },
        { reward: "Product rewards", suggestion: "Curate luxury selections", reason: "Brand alignment" }
      ],
      engagementStrategies: ["White glove service", "Exclusive previews", "Personalized curation"],
      retentionTactics: ["Dedicated account manager", "Custom packages", "Lifestyle integration"],
      projectedROI: 8000.00,
      projectedRetention: 68.0
    },
    {
      businessId: "biz-012",
      programData: { currentPoints: 1, rewards: 5, members: 700 },
      memberData: { avgVisits: 4.0, avgSpend: 65, retentionRate: 60 },
      transactionData: { totalRedemptions: 200, avgRedemptionValue: 18 },
      programSuggestions: [
        { suggestion: "Add walk-in bonus points", impact: "Fill empty slots" },
        { suggestion: "Create off-peak rewards", impact: "Smooth demand curve" }
      ],
      rewardOptimizations: [
        { reward: "All equal value", suggestion: "Add tier structure", reason: "Aspiration motivation" },
        { reward: "Basic rewards", suggestion: "Add premium tier options", reason: "Upgrade incentive" }
      ],
      engagementStrategies: ["Last-minute booking deals", "Weekday specials", "Morning appointment bonuses"],
      retentionTactics: ["Flexible scheduling rewards", "No-show prevention points", "Consistent client bonuses"],
      projectedROI: 2800.00,
      projectedRetention: 67.0
    },
    {
      businessId: "biz-013",
      programData: { currentPoints: 1.5, rewards: 6, members: 400 },
      memberData: { avgVisits: 3.5, avgSpend: 95, retentionRate: 62 },
      transactionData: { totalRedemptions: 100, avgRedemptionValue: 25 },
      programSuggestions: [
        { suggestion: "Add skincare consultation rewards", impact: "Professional service value" },
        { suggestion: "Create results-based rewards", impact: "Outcome motivation" }
      ],
      rewardOptimizations: [
        { reward: "Generic discounts", suggestion: "Personalize by service history", reason: "Relevance increases redemption" },
        { reward: "One-size rewards", suggestion: "Add customization", reason: "Client preference alignment" }
      ],
      engagementStrategies: ["Before/after tracking", "Progress milestones", "Treatment package incentives"],
      retentionTactics: ["Treatment series completion bonuses", "Results guarantee", "Follow-up rewards"],
      projectedROI: 3500.00,
      projectedRetention: 70.0
    },
    {
      businessId: "biz-014",
      programData: { currentPoints: 2, rewards: 7, members: 1000 },
      memberData: { avgVisits: 5.8, avgSpend: 105, retentionRate: 73 },
      transactionData: { totalRedemptions: 380, avgRedemptionValue: 35 },
      programSuggestions: [
        { suggestion: "Add group booking rewards", impact: "Social bookings increase" },
        { suggestion: "Create bridal party program", impact: "Event-based revenue" }
      ],
      rewardOptimizations: [
        { reward: "Individual only", suggestion: "Add group reward options", reason: "Encourages referrals" },
        { reward: "Single service", suggestion: "Add package rewards", reason: "Higher value per visit" }
      ],
      engagementStrategies: ["Friend referral bonuses", "Group booking perks", "Party package rewards"],
      retentionTactics: ["Bring-a-friend days", "Duo discounts", "Celebration rewards"],
      projectedROI: 7500.00,
      projectedRetention: 80.0
    },
    {
      businessId: "biz-015",
      programData: { currentPoints: 1, rewards: 4, members: 550 },
      memberData: { avgVisits: 3.0, avgSpend: 80, retentionRate: 50 },
      transactionData: { totalRedemptions: 85, avgRedemptionValue: 20 },
      programSuggestions: [
        { suggestion: "Implement point expiration (12 months)", impact: "Creates urgency" },
        { suggestion: "Add bonus point events monthly", impact: "Regular engagement spikes" }
      ],
      rewardOptimizations: [
        { reward: "Hard to reach rewards", suggestion: "Add stepping stone rewards", reason: "Progress visibility" },
        { reward: "Complex redemption", suggestion: "Simplify process", reason: "Reduce friction" }
      ],
      engagementStrategies: ["Monthly point bonus days", "Seasonal promotions", "Staff pick rewards"],
      retentionTactics: ["Expiration reminders", "Use-it-or-lose-it campaigns", "Re-engagement offers"],
      projectedROI: 2200.00,
      projectedRetention: 60.0
    },
    {
      businessId: "biz-016",
      programData: { currentPoints: 1.5, rewards: 9, members: 1800 },
      memberData: { avgVisits: 6.8, avgSpend: 140, retentionRate: 78 },
      transactionData: { totalRedemptions: 650, avgRedemptionValue: 42 },
      programSuggestions: [
        { suggestion: "Launch elite tier with annual fee", impact: "Premium revenue stream" },
        { suggestion: "Add personalized reward recommendations", impact: "AI-driven engagement" }
      ],
      rewardOptimizations: [
        { reward: "Too many options", suggestion: "Curate personalized suggestions", reason: "Decision fatigue reduction" },
        { reward: "Static rewards", suggestion: "Add rotating limited editions", reason: "Novelty and urgency" }
      ],
      engagementStrategies: ["AI-powered suggestions", "Preference learning", "Surprise rewards"],
      retentionTactics: ["Predictive churn intervention", "Personalized win-back", "Loyalty score tracking"],
      projectedROI: 18000.00,
      projectedRetention: 85.0
    }
  ];

  for (const opt of loyaltyOptimizations) {
    await prisma.aILoyaltyOptimization.create({ data: opt });
  }
  console.log(`Created ${loyaltyOptimizations.length} AI loyalty optimizations`);

  console.log("\nHealthcare AI seeding complete!");
  console.log("Summary:");
  console.log(`  - Symptom Checks: ${symptomChecks.length}`);
  console.log(`  - Mental Health Sessions: ${mentalHealthSessions.length}`);
  console.log(`  - Skin Analyses: ${skinAnalyses.length}`);
  console.log(`  - Sleep Records: ${sleepRecords.length}`);
  console.log(`  - Posture Assessments: ${postureAssessments.length}`);
  console.log(`  - Product Recommendations: ${productRecommendations.length}`);
  console.log(`  - Loyalty Optimizations: ${loyaltyOptimizations.length}`);
}

seedHealthcareData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
