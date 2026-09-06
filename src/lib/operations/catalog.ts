import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, context, endpoint, fail, idSchema } from './core';
const optionalText = z.string().trim().max(1000).optional().nullable();
const price = z.coerce.number().finite().nonnegative().max(1000000);
const quantity = z.coerce.number().int().nonnegative().max(1000000);
const productSchema = z.object({ name: z.string().trim().min(1).max(150), description: optionalText, brand: optionalText, sku: optionalText, barcode: optionalText, size: optionalText, cost: price.optional().nullable(), price, categoryId: idSchema.optional().nullable(), quantityOnHand: quantity.default(0), reorderLevel: quantity.default(0), reorderQuantity: quantity.default(0), trackInventory: z.boolean().default(true), isTaxable: z.boolean().default(true), isActive: z.boolean().default(true) });
const serviceSchema = z.object({ name: z.string().trim().min(1).max(150), description: optionalText, duration: z.coerce.number().int().min(5).max(720), price, categoryId: idSchema.optional().nullable(), priceType: z.enum(['FIXED', 'STARTING_AT', 'VARIABLE', 'CONSULTATION']).default('FIXED'), color: z.string().max(40).optional().nullable(), allowOnline: z.boolean().default(true), isActive: z.boolean().default(true), bufferTime: z.coerce.number().int().min(0).max(1440).default(15), requireDeposit: z.boolean().default(false), depositAmount: price.optional().nullable(), depositPercent: z.coerce.number().min(0).max(100).optional().nullable() });
const vendorSchema = z.object({ name: z.string().trim().min(1).max(150), contactName: optionalText, email: z.union([z.string().email(), z.literal('')]).optional().nullable(), phone: optionalText, website: optionalText, address: optionalText, city: optionalText, state: optionalText, zip: optionalText, country: optionalText, paymentTerms: optionalText, accountNumber: optionalText, notes: optionalText, isActive: z.boolean().default(true) });
type Kind = 'product' | 'service' | 'vendor';
type Params = { params: Promise<{ id: string }> };
export function catalog(kind: Kind) {
  async function list(req: Request) {
    return endpoint(async () => {
      const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'STAFF', ...(kind === 'service' ? ['CLIENT' as const] : [])]);
      const p = new URL(req.url).searchParams;
      const where = { businessId: ctx.businessId, ...(p.get('active') !== 'false' && p.get('isActive') !== 'false' ? { isActive: true } : {}), ...(p.get('search') ? { name: { contains: p.get('search')!.slice(0, 100), mode: 'insensitive' as const } } : {}) };
      const take = z.coerce.number().int().min(1).max(500).parse(p.get('limit') || 200);
      const skip = z.coerce.number().int().min(0).max(1000000).parse(p.get('offset') || 0);
      if (kind === 'vendor') return prisma.vendor.findMany({ where, take, skip, orderBy: { name: 'asc' }, include: { _count: { select: { purchaseOrders: true } } } });
      if (kind === 'product') return prisma.product.findMany({ where: { ...where, ...(p.get('categoryId') ? { categoryId: p.get('categoryId') } : {}), ...(p.get('lowStock') === 'true' ? { quantityOnHand: { lte: prisma.product.fields.reorderLevel } } : {}) }, include: { category: true }, take, skip, orderBy: { name: 'asc' } });
      return prisma.service.findMany({ where: { ...where, ...(p.get('categoryId') ? { categoryId: p.get('categoryId') } : {}), ...(ctx.user.role === 'CLIENT' ? { allowOnline: true } : {}) }, include: { category: true, addOns: { where: { isActive: true } } }, take, skip, orderBy: { name: 'asc' } });
    });
  }
  async function read(req: Request, { params }: Params) {
    return endpoint(async () => {
      const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'STAFF', ...(kind === 'service' ? ['CLIENT' as const] : [])]); const { id } = await params;
      const where = { id, businessId: ctx.businessId };
      const row = kind === 'product' ? await prisma.product.findFirst({ where, include: { category: true } }) : kind === 'service' ? await prisma.service.findFirst({ where: { ...where, ...(ctx.user.role === 'CLIENT' ? { isActive: true, allowOnline: true } : {}) }, include: { category: true, addOns: { where: { isActive: true } } } }) : await prisma.vendor.findFirst({ where, include: { purchaseOrders: { take: 20, orderBy: { orderDate: 'desc' } }, _count: { select: { purchaseOrders: true } } } });
      return row || fail(404, 'Record not found');
    });
  }
  async function write(req: Request, id?: string, archive = false) {
    return endpoint(async () => {
      const ctx = await context(['OWNER', 'MANAGER']);
      const raw = archive ? { isActive: false } : await req.json();
      return prisma.$transaction(async tx => {
        const where = { id, businessId: ctx.businessId };
        const existing = !id ? null : kind === 'product' ? await tx.product.findFirst({ where }) : kind === 'service' ? await tx.service.findFirst({ where }) : await tx.vendor.findFirst({ where });
        if (id && !existing) return fail(404, 'Record not found');
        let row;
        if (kind === 'product') {
          if (id && raw.quantityOnHand !== undefined) return fail(422, 'Use stock adjustment to change quantity with an audit reason');
          const input = id ? productSchema.partial().parse(raw) : productSchema.parse(raw);
          if (input.categoryId && !await tx.productCategory.findFirst({ where: { id: input.categoryId, businessId: ctx.businessId } })) return fail(422, 'Category not found');
          row = id ? await tx.product.update({ where: { id }, data: input }) : await tx.product.create({ data: { ...productSchema.parse(raw), businessId: ctx.businessId } });
        } else if (kind === 'service') {
          const input = id ? serviceSchema.partial().parse(raw) : serviceSchema.parse(raw);
          if (input.categoryId && !await tx.serviceCategory.findFirst({ where: { id: input.categoryId, businessId: ctx.businessId } })) return fail(422, 'Category not found');
          row = id ? await tx.service.update({ where: { id }, data: input }) : await tx.service.create({ data: { ...serviceSchema.parse(raw), businessId: ctx.businessId } });
        } else row = id ? await tx.vendor.update({ where: { id }, data: vendorSchema.partial().parse(raw) }) : await tx.vendor.create({ data: { ...vendorSchema.parse(raw), businessId: ctx.businessId } });
        await audit(tx, ctx, archive ? 'CATALOG_ARCHIVED' : id ? 'CATALOG_UPDATED' : 'CATALOG_CREATED', kind, row.id, { fields: Object.keys(raw) });
        return row;
      });
    });
  }
  return { GET: list, POST: (req: Request) => write(req), read, PUT: async (req: Request, p: Params) => write(req, (await p.params).id), DELETE: async (req: Request, p: Params) => write(req, (await p.params).id, true) };
}
