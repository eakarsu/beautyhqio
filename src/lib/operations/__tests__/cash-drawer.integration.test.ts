import {randomUUID} from 'node:crypto'
import {prisma as db} from '@/lib/prisma'
import {mutation,type Context} from '../core'
import {cashAction,cashActor,drawerPreview} from '../cash-drawer'
import {createSale,reviewTax,saleAction} from '../sales'
import {refundSalePayment} from '../sale-payments'
const suite=process.env.RUN_OPERATIONS_INTEGRATION==='true'?describe:describe.skip
if(process.env.RUN_OPERATIONS_INTEGRATION==='true'&&!new URL(process.env.DATABASE_URL!).searchParams.get('schema')?.startsWith('beauty_ops_test_'))throw Error('Cash drawer tests require disposable schemas')
suite('cash drawer closeout',()=>{
 const req=(key:string=randomUUID())=>new Request('http://localhost/api/operations/cash-drawer',{method:'POST',headers:{'Idempotency-Key':key}})
 const act=(ctx:Context,input:unknown,key?:string)=>mutation(ctx,req(key),'cash-drawer',input,tx=>cashAction(tx,ctx,input),tx=>cashActor(tx,ctx))
 async function fixture(){const business=await db.business.create({data:{name:'Cash fixture',type:'SPA'}}),user=await db.user.create({data:{businessId:business.id,email:randomUUID()+'@test.invalid',firstName:'Cash',lastName:'Owner',role:'OWNER'}}),location=await db.location.create({data:{businessId:business.id,name:'Cash location',address:'Fixture',city:'Fixture',state:'NY',zip:'10000'}}),staff=await db.staff.create({data:{userId:user.id,locationId:location.id,specialties:[],serviceIds:[]}}),service=await db.service.create({data:{businessId:business.id,name:'Cash service',price:50,duration:30}})
 const ctx:Context={businessId:business.id,user:{...user,businessName:business.name,staffId:staff.id,clientId:null,isPlatformAdmin:false}}
 await mutation(ctx,req(),'tax',{},tx=>reviewTax(tx,ctx,{taxRate:0,servicesTaxable:false,reviewConfirmed:true}))
 const reviewer=await db.user.create({data:{businessId:business.id,email:randomUUID()+'@test.invalid',firstName:'Cash',lastName:'Manager',role:'MANAGER'}}),reviewCtx:Context={...ctx,user:{...ctx.user,...reviewer,staffId:null}}
 async function pay(amount=50){const sale=await mutation(ctx,req(),'sale',{},tx=>createSale(tx,ctx,{locationId:location.id,staffId:staff.id,items:[{id:service.id,type:'SERVICE',quantity:1}]}));await mutation(ctx,req(),'issue',{},tx=>saleAction(tx,ctx,{action:'issue',id:sale.id,version:1,reviewConfirmed:true}));return mutation(ctx,req(),'cash',{},tx=>saleAction(tx,ctx,{action:'payment',id:sale.id,version:2,amount,method:'CASH',cashReceived:amount+10,receivedConfirmed:true})) as Promise<any>}
 return{ctx,reviewCtx,location,staff,pay}}
 afterAll(()=>db.$disconnect())
 test('verified net cash, movements, physical variance and independent manager approval carry forward exactly once',async()=>{
  const f=await fixture(),row=await act(f.ctx,{action:'OPEN',locationId:f.location.id,openingAmount:100,notes:'Counted initial drawer float',confirmed:true}) as any
  const payment=await f.pay();await refundSalePayment(f.ctx,req(),{paymentId:payment.payment.id,amount:10,reason:'Fixture cash returned',cashReturnedConfirmed:true})
  await act(f.ctx,{action:'MOVEMENT',id:row.id,version:1,direction:'OUT',amount:20,reason:'Cash deposited in safe',confirmed:true})
  const preview=await drawerPreview(db,f.ctx,row.id),snapshot=preview.snapshot as any;expect(snapshot.expectedCents).toBe(12000);expect(snapshot.receipts).toHaveLength(2)
  const input={action:'COUNT',id:row.id,version:2,countedAmount:119.90,expectedHash:preview.hash,notes:'Physical cash count recorded',confirmed:true},key=randomUUID(),counted=await act(f.ctx,input,key) as any
  expect(counted.varianceCents).toBe(-10);await act(f.ctx,input,key);expect(await db.cashDrawerAllocation.count({where:{sessionId:row.id}})).toBe(2)
  await expect(act(f.ctx,{action:'APPROVE',id:row.id,version:3,notes:'Reviewed the cash variance',confirmed:true})).rejects.toThrow(/different manager/)
  await expect(act(f.ctx,{action:'MOVEMENT',id:row.id,version:3,direction:'IN',amount:1,reason:'Invalid frozen movement',confirmed:true})).rejects.toThrow(/frozen/)
  await f.pay(5)
  await act(f.reviewCtx,{action:'APPROVE',id:row.id,version:3,notes:'Independently reviewed ten-cent shortage',confirmed:true})
  await expect(act(f.ctx,{action:'OPEN',locationId:f.location.id,openingAmount:100,notes:'Incorrect carry forward',confirmed:true})).rejects.toThrow(/carry forward/)
  const second=await act(f.ctx,{action:'OPEN',locationId:f.location.id,openingAmount:119.90,notes:'Carry forward approved physical count',confirmed:true}) as any
  const next=await drawerPreview(db,f.ctx,second.id);expect((next.snapshot as any).expectedCents).toBe(12490);expect((next.snapshot as any).receipts).toHaveLength(1)
  expect((await drawerPreview(db,f.ctx,row.id)).session.status).toBe('CLOSED')
  await expect(db.cashDrawerSession.update({where:{id:row.id},data:{countCents:0}})).rejects.toThrow(/append-only/)
  await expect(db.cashDrawerMovement.deleteMany({where:{sessionId:row.id}})).rejects.toThrow(/append-only/)
  await expect(db.cashDrawerAllocation.deleteMany({where:{sessionId:row.id}})).rejects.toThrow(/append-only/)
 })
 test('concurrent opening permits one drawer; changed receipts reject a stale count; foreign business and revoked actors cannot read or replay',async()=>{
  const f=await fixture(),input={action:'OPEN',locationId:f.location.id,openingAmount:10,notes:'Initial fixture float',confirmed:true}
  const results=await Promise.allSettled([act(f.ctx,input),act(f.ctx,input)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1)
  const row=(results.find(r=>r.status==='fulfilled') as PromiseFulfilledResult<any>).value,preview=await drawerPreview(db,f.ctx,row.id)
  await f.pay(20);await expect(act(f.ctx,{action:'COUNT',id:row.id,version:1,countedAmount:10,expectedHash:preview.hash,notes:'Stale physical count',confirmed:true})).rejects.toThrow(/receipts changed/)
  const other=await fixture();await expect(drawerPreview(db,other.ctx,row.id)).rejects.toThrow(/not found/)
  const movement={action:'MOVEMENT',id:row.id,version:1,direction:'IN',amount:2,reason:'Add physical change float',confirmed:true},key=randomUUID();await act(f.ctx,movement,key)
  await db.user.update({where:{id:f.ctx.user.id},data:{isActive:false}})
  await expect(act(f.ctx,movement,key)).rejects.toThrow(/Current business/)
  await expect(drawerPreview(db,f.ctx,row.id)).rejects.toThrow(/Current business/)
 })
 test('card and unverified historical payments do not become cash; exact count approval freezes its evidence',async()=>{
  const f=await fixture();await f.pay(10)
  const row=await act(f.ctx,{action:'OPEN',locationId:f.location.id,openingAmount:10,notes:'Opening includes earlier cash receipt',confirmed:true}) as any
  expect((await drawerPreview(db,f.ctx,row.id)).snapshot).toMatchObject({expectedCents:1000,receipts:[]})
  const payment=await f.pay(10),sale=await db.transaction.findFirstOrThrow({where:{payments:{some:{id:payment.payment.id}}}})
  await db.transactionPayment.create({data:{transactionId:sale.id,method:'CASH',amount:999}})
  await db.transactionPayment.create({data:{transactionId:sale.id,method:'CREDIT_CARD',source:'STRIPE',verifiedAt:new Date(),amount:1}})
  const preview=await drawerPreview(db,f.ctx,row.id);expect((preview.snapshot as any).expectedCents).toBe(2000);expect((preview.snapshot as any).receipts).toHaveLength(1)
  const counted=await act(f.ctx,{action:'COUNT',id:row.id,version:1,countedAmount:20,expectedHash:preview.hash,notes:'Exact physical count confirmed',confirmed:true}) as any
  await act(f.ctx,{action:'APPROVE',id:row.id,version:counted.version,notes:'Exact closeout reviewed',confirmed:true})
  expect((await drawerPreview(db,f.ctx,row.id)).session.status).toBe('CLOSED')
 })
})
