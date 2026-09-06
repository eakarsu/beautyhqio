import {prisma} from '@/lib/prisma'
import {context,endpoint,fail} from '@/lib/operations/core'
import {saleFor} from '@/lib/operations/sales'
export const GET=(req:Request,{params}:{params:Promise<{id:string}>})=>endpoint(async()=>saleFor(prisma,await context(['OWNER','MANAGER','RECEPTIONIST','STAFF']),(await params).id))
export const POST=()=>endpoint(async()=>{await context(['OWNER','MANAGER']);return fail(405,'Refund a verified payment from Point of Sale. Financial history is retained.')})
export const DELETE=POST
