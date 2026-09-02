export type DemoAccountKey = "owner" | "manager" | "receptionist" | "staff";

export type DemoAccount = {
  key: DemoAccountKey;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "MANAGER" | "RECEPTIONIST" | "STAFF";
};

function requireEmail(name: string, value: string | undefined) {
  const email = String(value || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error(`${name} must be a valid email address.`);
  }
  return email;
}

function requirePassword(name: string, value: string | undefined) {
  const password = String(value || "");
  if (password.length < 12 || password.length > 72) {
    throw new Error(`${name} must contain 12-72 characters.`);
  }
  return password;
}

export function getDemoAccounts(): DemoAccount[] {
  const adminPassword = requirePassword("ADMIN_PASSWORD", process.env.ADMIN_PASSWORD);
  const demoPassword = requirePassword(
    "DEMO_PASSWORD",
    process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || adminPassword
  );

  const accounts: DemoAccount[] = [
    {
      key: "owner",
      email: requireEmail("ADMIN_EMAIL", process.env.ADMIN_EMAIL),
      password: adminPassword,
      firstName: "Runtime",
      lastName: "Administrator",
      role: "OWNER",
    },
    {
      key: "manager",
      email: requireEmail("DEMO_MANAGER_EMAIL", process.env.DEMO_MANAGER_EMAIL || "jennifer@luxebeauty.com"),
      password: demoPassword,
      firstName: "Jennifer",
      lastName: "Kim",
      role: "MANAGER",
    },
    {
      key: "receptionist",
      email: requireEmail("DEMO_RECEPTIONIST_EMAIL", process.env.DEMO_RECEPTIONIST_EMAIL || "lisa@luxebeauty.com"),
      password: demoPassword,
      firstName: "Lisa",
      lastName: "Nguyen",
      role: "RECEPTIONIST",
    },
    {
      key: "staff",
      email: requireEmail("DEMO_STAFF_EMAIL", process.env.DEMO_STAFF_EMAIL || "sarah@luxebeauty.com"),
      password: demoPassword,
      firstName: "Sarah",
      lastName: "Johnson",
      role: "STAFF",
    },
  ];

  if (new Set(accounts.map(({ email }) => email)).size !== accounts.length) {
    throw new Error("Demo account email addresses must be unique.");
  }

  return accounts;
}
