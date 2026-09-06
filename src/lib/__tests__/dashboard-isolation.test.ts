import { GET } from '@/app/api/dashboard/route';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
jest.mock('@/lib/api-auth',()=>({getAuthenticatedUser:jest.fn()}));
jest.mock('@/lib/prisma',()=>({prisma:{location:{findMany:jest.fn()},appointment:{findMany:jest.fn(),count:jest.fn()},transaction:{findMany:jest.fn()},waitlistEntry:{findMany:jest.fn()},staff:{findMany:jest.fn()},product:{findMany:jest.fn()},client:{findMany:jest.fn(),count:jest.fn()},review:{findMany:jest.fn()}}}));
const auth=jest.mocked(getAuthenticatedUser);
beforeEach(()=>{
 jest.clearAllMocks();
 for(const model of Object.values(prisma) as unknown as Record<string,jest.Mock>[]) for(const [name,fn] of Object.entries(model)) if(jest.isMockFunction(fn)) fn.mockResolvedValue(name==='count'?0:[]);
});
test('a business without locations cannot query appointments, revenue or staff across tenants',async()=>{
 auth.mockResolvedValue({id:'owner',role:'OWNER',businessId:'empty-business',isPlatformAdmin:false} as never);
 expect((await GET()).status).toBe(200);
 for(const model of [prisma.appointment,prisma.transaction,prisma.waitlistEntry,prisma.staff])expect(model.findMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({locationId:{in:[]}})}));
 expect(prisma.client.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{businessId:'empty-business'}}));
});
test.each([{role:'OWNER',businessId:null},{role:'STAFF',businessId:'business'}])('rejects an unscoped or unauthorized dashboard user: %j',async actor=>{
 auth.mockResolvedValue({id:'user',isPlatformAdmin:false,...actor} as never);
 expect((await GET()).status).toBe(403);
 expect(prisma.location.findMany).not.toHaveBeenCalled();
});
test('unauthenticated requests cannot read dashboard data',async()=>{auth.mockResolvedValue(null);expect((await GET()).status).toBe(401);expect(prisma.location.findMany).not.toHaveBeenCalled();});
