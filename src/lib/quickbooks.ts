// QuickBooks Integration Library
import OAuthClient from "intuit-oauth";

// Initialize OAuth client
const oauthClient = new OAuthClient({
  clientId: process.env.QUICKBOOKS_CLIENT_ID || "",
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || "",
  environment: process.env.QUICKBOOKS_ENVIRONMENT === "production" ? "production" : "sandbox",
  redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || "",
});

// Get authorization URL
export function getAuthUrl(): string {
  return oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.Payment],
    state: "beauty-wellness-state",
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string, realmId: string) {
  const authResponse = await oauthClient.createToken(
    `${process.env.QUICKBOOKS_REDIRECT_URI}?code=${code}&realmId=${realmId}`
  );

  return {
    accessToken: authResponse.token.access_token,
    refreshToken: authResponse.token.refresh_token,
    realmId,
    expiresAt: new Date(Date.now() + authResponse.token.expires_in * 1000),
  };
}

// Refresh access token
export async function refreshToken(refreshToken: string) {
  oauthClient.setToken({
    refresh_token: refreshToken,
  });

  const authResponse = await oauthClient.refresh();

  return {
    accessToken: authResponse.token.access_token,
    refreshToken: authResponse.token.refresh_token,
    expiresAt: new Date(Date.now() + authResponse.token.expires_in * 1000),
  };
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
