import {prisma} from '@/lib/prisma'
import {boundedBody,context,csv,endpoint,fail,mutation} from '@/lib/operations/core'
import {cashAction,cashActor,cashInput,drawerPreview} from '@/lib/operations/cash-drawer'
export const dynamic='force-dynamic'
export async function GET(req:Request){return endpoint(async()=>{
 const ctx=await context(['OWNER','MANAGER','RECEPTIONIST']);await cashActor(prisma,ctx);const url=new URL(req.url),id=url.searchParams.get('id')
 if(id){const preview=await drawerPreview(prisma,ctx,id)
  if(url.searchParams.get('format')==='csv'){
   if(preview.session.status!=='CLOSED')fail(409,'Approve the drawer before exporting the closeout')
   const s=preview.snapshot as unknown as {openingCents:number;expectedCents:number;receipts:{key:string;amountCents:number;reference:string;at:string;kind:string}[];movements:{id:string;amountCents:number;reason:string;at:string}[]}
   const rows=[['Entry','Reference','Amount USD','Timestamp UTC'],['Opening balance',id,(s.openingCents/100).toFixed(2),''],...s.receipts.map(r=>[r.kind,r.reference,(r.amountCents/100).toFixed(2),r.at]),...s.movements.map(m=>['Cash movement',m.reason,(m.amountCents/100).toFixed(2),m.at]),['Expected',id,(s.expectedCents/100).toFixed(2),''],['Physical count',id,((preview.session.countCents||0)/100).toFixed(2),preview.session.countedAt?.toISOString()||''],['Variance',id,((preview.session.varianceCents||0)/100).toFixed(2),''],['Approval',preview.session.reviewNotes||'',preview.session.approvedById||'',preview.session.approvedAt?.toISOString()||'']]
   return new Response(csv(rows),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="cash-closeout.csv"','Cache-Control':'private, no-store'}})
  }
  return Response.json(preview,{headers:{'Cache-Control':'private, no-store'}})
 }
 const [locations,sessions]=await Promise.all([prisma.location.findMany({where:{businessId:ctx.businessId,isActive:true},select:{id:true,name:true},orderBy:{name:'asc'}}),prisma.cashDrawerSession.findMany({where:{businessId:ctx.businessId},orderBy:{createdAt:'desc'},take:100,select:{id:true,locationId:true,status:true,version:true,openingCents:true,countCents:true,expectedCents:true,varianceCents:true,countedAt:true,approvedAt:true,createdAt:true,notes:true,reviewNotes:true}})])
 return Response.json({locations,sessions,canApprove:['OWNER','MANAGER'].includes(ctx.user.role)},{headers:{'Cache-Control':'private, no-store'}})
})}
export async function POST(req:Request){return endpoint(async()=>{const ctx=await context(['OWNER','MANAGER','RECEPTIONIST']),input=cashInput.parse(await boundedBody(req));return mutation(ctx,req,'cash-drawer',input,tx=>cashAction(tx,ctx,input),tx=>cashActor(tx,ctx))})}
