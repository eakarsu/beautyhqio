import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { endpoint, fail } from '@/lib/operations/core';

/** Public, field-limited booking catalog for one active location. */
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const locationId = new URL(request.url).searchParams.get('locationId');
    if (!locationId || locationId.length > 191) return fail(422, 'Location is required');
    const location = await prisma.location.findFirst({ where: { id: locationId, isActive: true, allowOnlineBooking: true, business: { subscription: { is: { status: { in: ['ACTIVE', 'TRIAL'] } } } } }, select: { id: true, name: true, address: true, city: true, state: true, phone: true, businessId: true } });
    if (!location) return fail(404, 'Online booking is unavailable at this location');
    const [services, staff] = await Promise.all([
      prisma.service.findMany({ where: { businessId: location.businessId, isActive: true, allowOnline: true }, select: { id: true, name: true, description: true, duration: true, price: true, requireDeposit: true, depositAmount: true, depositPercent: true, category: { select: { id: true, name: true } } }, orderBy: { name: 'asc' }, take: 300 }),
      prisma.staff.findMany({ where: { locationId, isActive: true, isBookableOnline: true, user: { businessId: location.businessId } }, select: { id: true, displayName: true, serviceIds: true, user: { select: { firstName: true, lastName: true } } }, take: 200 }),
    ]);
    return Response.json({ location: { id: location.id, name: location.name, address: location.address, city: location.city, state: location.state, phone: location.phone }, services: services.filter(service => staff.some(person => !person.serviceIds.length || person.serviceIds.includes(service.id))).map(service => ({ ...service, price: Number(service.price), depositAmount: service.depositAmount === null ? null : Number(service.depositAmount), depositPercent: service.depositPercent === null ? null : Number(service.depositPercent) })), staff }, { headers: { 'Cache-Control': 'no-store' } });
  });
}
