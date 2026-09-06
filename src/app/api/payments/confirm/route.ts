import {context,endpoint,fail} from '@/lib/operations/core'
export const POST=()=>endpoint(async()=>{await context(['OWNER','MANAGER','RECEPTIONIST','STAFF']);return fail(409,'Use a reviewed sale and its Stripe checkout/reconciliation action in Point of Sale. A provider receipt must be linked to the sale reservation.')})
