// QuickBooks OAuth uses the standard token endpoint directly so URL parsing does
// not depend on the deprecated query-string/decode-uri-component dependency chain.
import { z } from "zod";

export function getAuthUrl(): string {
  const url = new URL("https://appcenter.intuit.com/connect/oauth2");
  url.search = new URLSearchParams({ client_id: process.env.QUICKBOOKS_CLIENT_ID || "",
    redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI || "", response_type: "code",
    scope: "com.intuit.quickbooks.accounting com.intuit.quickbooks.payment",
    state: "beauty-wellness-state" }).toString();
  return url.toString();
}

const tokenSchema = z.object({ access_token: z.string().min(1), refresh_token: z.string().min(1), expires_in: z.number().positive() });
async function exchangeToken(parameters: Record<string, string>) {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("QuickBooks OAuth is not configured");
  const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(parameters).toString(), signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`QuickBooks token exchange failed (${response.status})`);
  const token = tokenSchema.parse(await response.json());
  return { accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: new Date(Date.now() + token.expires_in * 1000) };
}
export async function getTokensFromCode(code: string, realmId: string) {
  const tokens = await exchangeToken({ grant_type: "authorization_code", code, redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI || "" });
  return { ...tokens, realmId };
}
export async function refreshToken(refresh: string) {
  return exchangeToken({ grant_type: "refresh_token", refresh_token: refresh });
}

// Make authenticated API call
async function makeQBRequest(
  accessToken: string,
  realmId: string,
  method: string,
  endpoint: string,
  body?: unknown
) {
  const baseUrl =
    process.env.QUICKBOOKS_ENVIRONMENT === "production"
      ? "https://quickbooks.api.intuit.com"
      : "https://sandbox-quickbooks.api.intuit.com";

  const url = `${baseUrl}/v3/company/${realmId}/${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QuickBooks API error: ${error}`);
  }

  return response.json();
}

// Customer operations
export async function createCustomer(
  accessToken: string,
  realmId: string,
  customer: {
    displayName: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }
) {
  return makeQBRequest(accessToken, realmId, "POST", "customer", {
    DisplayName: customer.displayName,
    PrimaryEmailAddr: customer.email ? { Address: customer.email } : undefined,
    PrimaryPhone: customer.phone ? { FreeFormNumber: customer.phone } : undefined,
    GivenName: customer.firstName,
    FamilyName: customer.lastName,
  });
}

export async function getCustomer(
  accessToken: string,
  realmId: string,
  customerId: string
) {
  return makeQBRequest(accessToken, realmId, "GET", `customer/${customerId}`);
}

export async function findCustomerByEmail(
  accessToken: string,
  realmId: string,
  email: string
) {
  const query = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email}'`;
  return makeQBRequest(
    accessToken,
    realmId,
    "GET",
    `query?query=${encodeURIComponent(query)}`
  );
}

// Invoice operations
export async function createInvoice(
  accessToken: string,
  realmId: string,
  invoice: {
    customerId: string;
    lineItems: {
      description: string;
      amount: number;
      quantity: number;
      itemId?: string;
    }[];
    dueDate?: Date;
    memo?: string;
  }
) {
  const lines = invoice.lineItems.map((item, index) => ({
    Id: String(index + 1),
    LineNum: index + 1,
    Description: item.description,
    Amount: item.amount * item.quantity,
    DetailType: "SalesItemLineDetail",
    SalesItemLineDetail: {
      ItemRef: item.itemId ? { value: item.itemId } : undefined,
      Qty: item.quantity,
      UnitPrice: item.amount,
    },
  }));

  return makeQBRequest(accessToken, realmId, "POST", "invoice", {
    CustomerRef: { value: invoice.customerId },
    Line: lines,
    DueDate: invoice.dueDate?.toISOString().split("T")[0],
    PrivateNote: invoice.memo,
  });
}

export async function getInvoice(
  accessToken: string,
  realmId: string,
  invoiceId: string
) {
  return makeQBRequest(accessToken, realmId, "GET", `invoice/${invoiceId}`);
}

// Payment operations
export async function createPayment(
  accessToken: string,
  realmId: string,
  payment: {
    customerId: string;
    amount: number;
    invoiceId?: string;
    paymentMethodRef?: string;
    memo?: string;
  }
) {
  const paymentData: Record<string, unknown> = {
    CustomerRef: { value: payment.customerId },
    TotalAmt: payment.amount,
    PrivateNote: payment.memo,
  };

  if (payment.invoiceId) {
    paymentData.Line = [
      {
        Amount: payment.amount,
        LinkedTxn: [
          {
            TxnId: payment.invoiceId,
            TxnType: "Invoice",
          },
        ],
      },
    ];
  }

  if (payment.paymentMethodRef) {
    paymentData.PaymentMethodRef = { value: payment.paymentMethodRef };
  }

  return makeQBRequest(accessToken, realmId, "POST", "payment", paymentData);
}

// Item/Service operations
export async function createItem(
  accessToken: string,
  realmId: string,
  item: {
    name: string;
    type: "Service" | "Inventory" | "NonInventory";
    description?: string;
    unitPrice: number;
    incomeAccountRef: string;
    expenseAccountRef?: string;
  }
) {
  return makeQBRequest(accessToken, realmId, "POST", "item", {
    Name: item.name,
    Type: item.type,
    Description: item.description,
    UnitPrice: item.unitPrice,
    IncomeAccountRef: { value: item.incomeAccountRef },
    ExpenseAccountRef: item.expenseAccountRef
      ? { value: item.expenseAccountRef }
      : undefined,
  });
}

export async function getItems(accessToken: string, realmId: string) {
  const query = "SELECT * FROM Item MAXRESULTS 1000";
  return makeQBRequest(
    accessToken,
    realmId,
    "GET",
    `query?query=${encodeURIComponent(query)}`
  );
}

// Account operations
export async function getAccounts(accessToken: string, realmId: string) {
  const query = "SELECT * FROM Account WHERE AccountType = 'Income' MAXRESULTS 100";
  return makeQBRequest(
    accessToken,
    realmId,
    "GET",
    `query?query=${encodeURIComponent(query)}`
  );
}

// Reports
export async function getProfitAndLossReport(
  accessToken: string,
  realmId: string,
  startDate: Date,
  endDate: Date
) {
  const start = startDate.toISOString().split("T")[0];
  const end = endDate.toISOString().split("T")[0];

  return makeQBRequest(
    accessToken,
    realmId,
    "GET",
    `reports/ProfitAndLoss?start_date=${start}&end_date=${end}`
  );
}

export async function getBalanceSheetReport(
  accessToken: string,
  realmId: string,
  asOfDate: Date
) {
  const date = asOfDate.toISOString().split("T")[0];

  return makeQBRequest(
    accessToken,
    realmId,
    "GET",
    `reports/BalanceSheet?date_macro=Today&as_of=${date}`
  );
}

// Sync transaction to QuickBooks
export async function syncTransaction(
  accessToken: string,
  realmId: string,
  transaction: {
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    items: { name: string; price: number; quantity: number }[];
    total: number;
    date: Date;
  }
) {
  // Find or create customer
  let customer;

  if (transaction.clientEmail) {
    const searchResult = await findCustomerByEmail(
      accessToken,
      realmId,
      transaction.clientEmail
    );

    if (searchResult.QueryResponse?.Customer?.length > 0) {
      customer = searchResult.QueryResponse.Customer[0];
    }
  }

  if (!customer) {
    const newCustomer = await createCustomer(accessToken, realmId, {
      displayName: transaction.clientName,
      email: transaction.clientEmail,
      phone: transaction.clientPhone,
    });
    customer = newCustomer.Customer;
  }

  // Create invoice
  const invoice = await createInvoice(accessToken, realmId, {
    customerId: customer.Id,
    lineItems: transaction.items.map((item) => ({
      description: item.name,
      amount: item.price,
      quantity: item.quantity,
    })),
  });

  // Create payment
  const payment = await createPayment(accessToken, realmId, {
    customerId: customer.Id,
    amount: transaction.total,
    invoiceId: invoice.Invoice.Id,
  });

  return {
    customerId: customer.Id,
    invoiceId: invoice.Invoice.Id,
    paymentId: payment.Payment.Id,
  };
}
