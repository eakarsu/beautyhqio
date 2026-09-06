import {createHash} from 'node:crypto'
import {Prisma} from '@prisma/client'
import {z} from 'zod'
import {audit,fail,idSchema,json,type Context} from './core'
const dollars=z.number().finite().nonnegative().max(1000000).refine(n=>Math.abs(n*100-Math.round(n*100))<0.000001,'Use at most two decimal places')
const note=z.string().trim().min(5).max(2000)
export const cashInput=z.discriminatedUnion('action',[
 z.object({action:z.literal('OPEN'),locationId:idSchema,openingAmount:dollars,notes:note,confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('MOVEMENT'),id:idSchema,version:z.number().int().positive(),direction:z.enum(['IN','OUT']),amount:dollars.refine(n=>n>0),reason:note,confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('COUNT'),id:idSchema,version:z.number().int().positive(),countedAmount:dollars,expectedHash:z.string().length(64),notes:note,confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('APPROVE'),id:idSchema,version:z.number().int().positive(),notes:note,confirmed:z.literal(true)}).strict()
])
const cents=(n:unknown)=>Math.round(Number(n)*100)
export async function cashActor(tx:Prisma.TransactionClient,ctx:Context){const user=await tx.user.findFirst({where:{id:ctx.user.id,businessId:ctx.businessId,isActive:true},select:{role:true}});if(!user||user.role!==ctx.user.role||!['OWNER','MANAGER','RECEPTIONIST'].includes(user.role))fail(403,'Current business office access is required');return user}
async function sessionFor(tx:Prisma.TransactionClient,ctx:Context,id:string){await cashActor(tx,ctx);const session=await tx.cashDrawerSession.findFirst({where:{id,businessId:ctx.businessId}});if(!session)fail(404,'Drawer session not found');return session}
type Receipt={key:string;amountCents:number;reference:string;at:string;kind:string}
export async function drawerPreview(tx:Prisma.TransactionClient,ctx:Context,id:string){
 const session=await sessionFor(tx,ctx,id)
 if(session.status!=='OPEN')return{session,snapshot:session.snapshot,hash:null}
 const payments=await tx.$queryRaw<{id:string;amount:Prisma.Decimal;verifiedAt:Date;transactionNumber:string}[]>`
 SELECT p."id",p."amount",p."verifiedAt",t."transactionNumber" FROM "TransactionPayment" p JOIN "Transaction" t ON t.id=p."transactionId"
 WHERE t."locationId"=${session.locationId} AND t.currency='USD' AND p.method='CASH' AND p.source='CASH' AND p."verifiedAt" IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM "CashDrawerAllocation" a WHERE a."receiptKey"='payment:'||p.id) ORDER BY p.id LIMIT 10001`
 const refunds=await tx.$queryRaw<{id:string;amount:Prisma.Decimal;createdAt:Date;transactionNumber:string}[]>`
 SELECT r.id,r.amount,r."createdAt",t."transactionNumber" FROM "PaymentRefund" r JOIN "TransactionPayment" p ON p.id=r."paymentId" JOIN "Transaction" t ON t.id=p."transactionId"
 WHERE r."businessId"=${ctx.businessId} AND t."locationId"=${session.locationId} AND t.currency='USD' AND p.method='CASH' AND p.source='CASH' AND p."verifiedAt" IS NOT NULL AND r.status='SUCCEEDED'
 AND NOT EXISTS(SELECT 1 FROM "CashDrawerAllocation" a WHERE a."receiptKey"='refund:'||r.id) ORDER BY r.id LIMIT 10001`
 if(payments.length>10000||refunds.length>10000)fail(409,'Too many unallocated cash receipts; reconcile the historical ledger before closeout')
 const movements=await tx.cashDrawerMovement.findMany({where:{sessionId:id},orderBy:{id:'asc'}})
 const receipts:Receipt[]=[...payments.map(p=>({key:'payment:'+p.id,amountCents:cents(p.amount),reference:p.transactionNumber,at:p.verifiedAt.toISOString(),kind:'CASH_RECEIPT'})),...refunds.map(r=>({key:'refund:'+r.id,amountCents:-cents(r.amount),reference:r.transactionNumber,at:r.createdAt.toISOString(),kind:'CASH_REFUND'}))]
 const expectedCents=session.openingCents+receipts.reduce((n,r)=>n+r.amountCents,0)+movements.reduce((n,m)=>n+m.amountCents,0)
 if(!Number.isSafeInteger(expectedCents)||Math.abs(expectedCents)>1000000000)fail(409,'Drawer amount exceeds supported limits')
 const snapshot={openingCents:session.openingCents,expectedCents,receipts,movements:movements.map(m=>({id:m.id,amountCents:m.amountCents,reason:m.reason,actorId:m.actorId,at:m.createdAt.toISOString()}))}
 const hash=createHash('sha256').update(JSON.stringify([id,session.version,session.openingCents,receipts.map(r=>[r.key,r.amountCents]),movements.map(m=>[m.id,m.amountCents])])).digest('hex')
 return{session,snapshot,hash}
}
export async function cashAction(tx:Prisma.TransactionClient,ctx:Context,raw:unknown){
 const input=cashInput.parse(raw),actor=await cashActor(tx,ctx)
 if(input.action==='OPEN'){
  const location=await tx.location.findFirst({where:{id:input.locationId,businessId:ctx.businessId,isActive:true}});if(!location)fail(404,'Active location not found')
  if(await tx.cashDrawerSession.findFirst({where:{locationId:location.id,status:{not:'CLOSED'}}}))fail(409,'This location already has an open or unreviewed drawer')
  const previous=await tx.cashDrawerSession.findFirst({where:{locationId:location.id,status:'CLOSED'},orderBy:{createdAt:'desc'}})
  if(previous&&cents(input.openingAmount)!==previous.countCents)fail(409,'Opening balance must carry forward the last physical count; record cash additions or withdrawals separately')
  const row=await tx.cashDrawerSession.create({data:{businessId:ctx.businessId,locationId:location.id,openedById:ctx.user.id,openingCents:cents(input.openingAmount),baselineAt:previous?.baselineAt??new Date(),notes:input.notes,createdAt:new Date()}})
  if(!previous){
   // A serialized initial baseline uses receipt identities, avoiding timestamp
   // precision and legacy database-timezone differences in financial allocation.
   const prior=await drawerPreview(tx,ctx,row.id),snapshot=prior.snapshot as unknown as {receipts:Receipt[]}
   await tx.cashDrawerAllocation.createMany({data:snapshot.receipts.map(r=>({receiptKey:r.key,sessionId:row.id,amountCents:0,createdAt:new Date()}))})
  }
  await audit(tx,ctx,'CASH_DRAWER_OPEN','CashDrawerSession',row.id,{openingCents:row.openingCents,baselineAt:row.baselineAt,previousSessionId:previous?.id,notes:input.notes,confirmed:true});return row
 }
 const row=await sessionFor(tx,ctx,input.id);if(row.version!==input.version)fail(409,'Drawer changed; refresh before continuing')
 if(input.action==='APPROVE'){
  if(!['OWNER','MANAGER'].includes(actor.role))fail(403,'A manager must approve drawer closeout')
  if(row.status!=='COUNTED')fail(409,'Submit the physical count before approval')
  if(row.varianceCents!==0&&row.countedById===ctx.user.id)fail(403,'A different manager must review a cash variance')
  const updated=await tx.cashDrawerSession.update({where:{id:row.id},data:{status:'CLOSED',version:{increment:1},approvedById:ctx.user.id,approvedAt:new Date(),reviewNotes:input.notes}})
  await audit(tx,ctx,'CASH_DRAWER_APPROVED','CashDrawerSession',row.id,{varianceCents:row.varianceCents,notes:input.notes,confirmed:true});return updated
 }
 if(row.status!=='OPEN')fail(409,'This drawer is frozen for review or already closed')
 if(input.action==='MOVEMENT'){
  if(await tx.cashDrawerMovement.count({where:{sessionId:row.id}})>=1000)fail(409,'Close this drawer before adding more cash movements')
  const amountCents=cents(input.amount)*(input.direction==='IN'?1:-1)
  const movement=await tx.cashDrawerMovement.create({data:{sessionId:row.id,actorId:ctx.user.id,amountCents,reason:input.reason,createdAt:new Date()}})
  await tx.cashDrawerSession.update({where:{id:row.id},data:{version:{increment:1}}});await audit(tx,ctx,'CASH_DRAWER_MOVEMENT','CashDrawerSession',row.id,{movement,confirmed:true});return movement
 }
 const preview=await drawerPreview(tx,ctx,row.id)
 if(preview.hash!==input.expectedHash)fail(409,'Cash receipts changed; refresh and confirm the current count before submitting')
 const snapshot=preview.snapshot as unknown as {expectedCents:number;receipts:Receipt[]}
 await tx.cashDrawerAllocation.createMany({data:snapshot.receipts.map(r=>({receiptKey:r.key,sessionId:row.id,amountCents:r.amountCents,createdAt:new Date()}))})
 const countCents=cents(input.countedAmount),varianceCents=countCents-snapshot.expectedCents
 const updated=await tx.cashDrawerSession.update({where:{id:row.id},data:{status:'COUNTED',version:{increment:1},countCents,expectedCents:snapshot.expectedCents,varianceCents,countedById:ctx.user.id,countedAt:new Date(),notes:input.notes,snapshot:json(preview.snapshot)}})
 await audit(tx,ctx,'CASH_DRAWER_COUNTED','CashDrawerSession',row.id,{countCents,expectedCents:snapshot.expectedCents,varianceCents,evidenceHash:preview.hash,notes:input.notes,confirmed:true});return updated
}
