import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { GET as listUsers, POST as createUser } from "@/app/api/users/route";
import { PUT as updateUser, DELETE as deleteUser } from "@/app/api/users/[id]/route";
import { POST as refund } from "@/app/api/payments/refund/route";
import { POST as checkout, GET as listCheckout } from "@/app/api/checkout/route";
import { createRefund } from "@/lib/stripe";
import { authOptions } from "@/lib/auth";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next/headers", () => ({ headers: jest.fn().mockResolvedValue(new Headers()) }));
jest.mock("@/lib/prisma", () => { const prisma = { user: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), create: jest.fn() }, transactionPayment: { findFirst: jest.fn() }, transaction: { findMany: jest.fn() }, $transaction: jest.fn() }; return { __esModule: true, prisma, default: prisma }; });
jest.mock("@/lib/stripe", () => ({ createRefund: jest.fn() }));
const session = jest.mocked(getServerSession);
const db = prisma as unknown as { user: Record<string, jest.Mock>; transactionPayment: Record<string, jest.Mock>; transaction: Record<string, jest.Mock>; $transaction: jest.Mock };
const owner = { id: "owner", email: "owner@test.invalid", firstName: "Owner", lastName: "One", role: "OWNER", isActive: true, businessId: "tenant-one", business: null, staff: null, client: null };
function request(path: string, method = "POST", body?: unknown) {
  return new NextRequest(`http://localhost${path}`, { method, ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
}
beforeEach(() => { jest.clearAllMocks(); session.mockResolvedValue(null); db.user.findUnique.mockResolvedValue(owner); });
function login(user = owner) { session.mockResolvedValue({ user: { id: user.id, role: "PLATFORM_ADMIN", isPlatformAdmin: true } }); db.user.findUnique.mockResolvedValue(user); }

test("anonymous user management, checkout and refunds never reach persistence or providers", async () => {
  const context = { params: Promise.resolve({ id: "target" }) };
  const responses = await Promise.all([listUsers(request("/api/users", "GET")), createUser(request("/api/users", "POST", {})), updateUser(request("/api/users/target", "PUT", { role: "PLATFORM_ADMIN" }), context), deleteUser(request("/api/users/target", "DELETE"), context), refund(request("/api/payments/refund", "POST", { paymentIntentId: "pi_test" })), checkout(request("/api/checkout", "POST", {})), listCheckout(request("/api/checkout", "GET"))]);
  expect(responses.map(r => r.status)).toEqual(Array(7).fill(401));
  expect(db.user.update).not.toHaveBeenCalled(); expect(db.user.create).not.toHaveBeenCalled(); expect(db.$transaction).not.toHaveBeenCalled(); expect(createRefund).not.toHaveBeenCalled();
});
test("owners cannot grant platform administrator rights or access another tenant", async () => {
  login();
  expect((await updateUser(request("/api/users/target", "PUT", { role: "PLATFORM_ADMIN" }), { params: Promise.resolve({ id: "target" }) })).status).toBe(403);
  expect((await listUsers(request("/api/users?businessId=tenant-two", "GET"))).status).toBe(403);
  expect(db.user.update).not.toHaveBeenCalled(); expect(db.user.findMany).not.toHaveBeenCalled();
});
test("allowed user updates and checkout reads are constrained to the current tenant", async () => {
  login(); db.user.update.mockResolvedValue({ id: "target" }); db.transaction.findMany.mockResolvedValue([]);
  expect((await updateUser(request("/api/users/target", "PUT", { role: "MANAGER" }), { params: Promise.resolve({ id: "target" }) })).status).toBe(200);
  expect(db.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "target", businessId: "tenant-one", role: { not: "PLATFORM_ADMIN" } } }));
  await listCheckout(request("/api/checkout", "GET"));
  expect(db.transaction.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { location: { businessId: "tenant-one" } } }));
});
test("new passwords are bcrypt hashes and weak supplied passwords fail validation", async () => {
  login(); db.user.create.mockResolvedValue({ id: "new" });
  const input = { email: "new@test.invalid", firstName: "New", lastName: "User", password: "ValidPassword123!" };
  expect((await createUser(request("/api/users", "POST", input))).status).toBe(201);
  const hash = db.user.create.mock.calls[0][0].data.password;
  expect(hash).not.toBe(input.password); expect(await bcrypt.compare(input.password, hash)).toBe(true);
  expect((await createUser(request("/api/users", "POST", { ...input, password: "weak" }))).status).toBe(422);
});
test("inactive users are rejected and stale elevated session roles are ignored", async () => {
  login({ ...owner, isActive: false }); expect(await getAuthenticatedUser()).toBeNull();
  login({ ...owner, role: "CLIENT" }); expect(await getAuthenticatedUser()).toMatchObject({ role: "CLIENT", isPlatformAdmin: false });
  expect((await createUser(request("/api/users", "POST", {}))).status).toBe(403);
  expect((await refund(request("/api/payments/refund", "POST", { paymentIntentId: "pi_test" }))).status).toBe(403);
});
test("refunds require a payment record belonging to the caller's business", async () => {
  login(); db.transactionPayment.findFirst.mockResolvedValue(null);
  expect((await refund(request("/api/payments/refund", "POST", { paymentIntentId: "pi_foreign" }))).status).toBe(404);
  expect(db.transactionPayment.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ transaction: { location: { businessId: "tenant-one" } } }) }));
  expect(createRefund).not.toHaveBeenCalled();
});
test("NextAuth refreshes claims and invalidates inactive sessions", async () => {
  const jwtCallback = authOptions.callbacks!.jwt!;
  db.user.findUnique.mockResolvedValue({ ...owner, role: "STAFF" });
  const token = await jwtCallback({ token: { id: owner.id, role: "PLATFORM_ADMIN" } } as never);
  expect(token).toMatchObject({ role: "STAFF", isPlatformAdmin: false });
  db.user.findUnique.mockResolvedValue({ ...owner, isActive: false });
  await expect(jwtCallback({ token: { id: owner.id } } as never)).rejects.toThrow("Identity inactive");
});
