import Stripe from 'stripe';
import { encryptCredentials } from '../connections';
import { POST as webhook } from '@/app/api/operations/stripe-hook/[businessId]/route';
import { prisma as db } from '@/lib/prisma';
import { mutation, type Context } from '../core';
import { createSale, reviewTax, saleAction, saleFor, saleBalance } from '../sales';
import { startSaleCheckout, applySaleCheckout, refundSalePayment, applySaleRefund } from '../sale-payments';
const suite=process.env.RUN_OPERATIONS_INTEGRATION==='true'?describe:describe.skip;
suite('reviewed POS financial integrity',()=>{
 let ctx:Context,locationId:string,staffId:string,productId:string,serviceId:string;
 let sequence=0;
 const request=(key=`sale-test-${++sequence}`)=>new Request('http://localhost/api/operations/sales',{method:'POST',headers:{'Idempotency-Key':key}});
 const change=(input:unknown,key?:string)=>mutation(ctx,request(key),'sale.change',input,tx=>saleAction(tx,ctx,input));
 const draft=(input:Record<string,unknown>={},key?:string)=>{const body={locationId,staffId,items:[{id:serviceId,type:'SERVICE',quantity:1}],...input};return mutation(ctx,request(key),'sale.create',body,tx=>createSale(tx,ctx,body))};
 const review=async(id:string)=>change({action:'issue',id,version:1,reviewConfirmed:true});
 beforeAll(async()=>{
  const business=await db.business.create({data:{name:'POS isolated fixture',type:'SPA'}});
  const user=await db.user.create({data:{email:`sales-${business.id}@test.invalid`,firstName:'POS',lastName:'Owner',businessId:business.id,role:'OWNER'}});
  ctx={businessId:business.id,user:{...user,businessName:business.name,staffId:null,clientId:null,isPlatformAdmin:false}};
  const location=await db.location.create({data:{businessId:business.id,name:'POS',address:'Test',city:'Test',state:'NY',zip:'10000'}});locationId=location.id;
  staffId=(await db.staff.create({data:{userId:user.id,locationId,specialties:[],serviceIds:[]}})).id;
  productId=(await db.product.create({data:{businessId:business.id,name:'Limited stock',price:19.99,quantityOnHand:2,isTaxable:true}})).id;
  serviceId=(await db.service.create({data:{businessId:business.id,name:'Service',price:100,duration:30}})).id;
 });
 afterAll(()=>db.$disconnect());
 test('reviewed tax, current catalog prices, exact discounted tax and reservation rollback',async()=>{
  await expect(draft()).rejects.toThrow(/tax/);
  await mutation(ctx,request(),'tax',{},tx=>reviewTax(tx,ctx,{taxRate:0.0888,servicesTaxable:false,reviewConfirmed:true}));
  const sale=await draft({items:[{id:serviceId,type:'SERVICE',quantity:1},{id:productId,type:'PRODUCT',quantity:1}],discount:10,discountReason:'Manager promotion',tip:3},'priced-sale-key');
  expect(Number(sale.subtotal)).toBe(119.99);expect(Number(sale.taxAmount)).toBe(1.63);expect(Number(sale.totalAmount)).toBe(114.62);
  const replay=await draft({items:[{id:serviceId,type:'SERVICE',quantity:1},{id:productId,type:'PRODUCT',quantity:1}],discount:10,discountReason:'Manager promotion',tip:3},'priced-sale-key');expect(replay.id).toBe(sale.id);
  expect((await db.product.findUniqueOrThrow({where:{id:productId}})).quantityOnHand).toBe(1);
  await expect(draft({items:[{id:productId,type:'PRODUCT',quantity:2}]})).rejects.toThrow(/stock/);
  await expect(draft({},'priced-sale-key')).rejects.toThrow(/another operation/);
  await change({action:'void',id:sale.id,version:1,reason:'Customer cancelled'},'void-sale-key');
  await change({action:'void',id:sale.id,version:1,reason:'Customer cancelled'},'void-sale-key');
  expect((await db.product.findUniqueOrThrow({where:{id:productId}})).quantityOnHand).toBe(2);
 });
 test('tenant and staff boundaries, stale review and concurrent stock reservation',async()=>{
  const sale=await draft();
  await expect(saleFor(db,{...ctx,businessId:'foreign'},sale.id)).rejects.toThrow(/not found/);
  await expect(saleFor(db,{...ctx,user:{...ctx.user,role:'STAFF',staffId:'foreign'}},sale.id)).rejects.toThrow(/own sales/);
  await review(sale.id);await expect(change({action:'payment',id:sale.id,version:1,amount:10,method:'CASH',cashReceived:10,receivedConfirmed:true})).rejects.toThrow(/changed/);
  const results=await Promise.allSettled([draft({items:[{id:productId,type:'PRODUCT',quantity:2}]}),draft({items:[{id:productId,type:'PRODUCT',quantity:2}]})]);
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  const winner=results.find(r=>r.status==='fulfilled') as PromiseFulfilledResult<Awaited<ReturnType<typeof draft>>>;
  await change({action:'void',id:winner.value.id,version:1,reason:'Release fixture stock'});
 });
 test('partial cash and gift payment, refund caps, immutable receipts and no double gift refund',async()=>{
  const sale=await draft();await review(sale.id);
  await expect(change({action:'payment',id:sale.id,version:2,amount:101,method:'CASH',cashReceived:101,receivedConfirmed:true})).rejects.toThrow(/balance/);
  const cash=await change({action:'payment',id:sale.id,version:2,amount:40,method:'CASH',cashReceived:50,receivedConfirmed:true}) as {payment:{id:string},changeCents:number};expect(cash.changeCents).toBe(1000);
  const card=await db.giftCard.create({data:{businessId:ctx.businessId,code:'pos-gift',initialBalance:60,currentBalance:60}});
  const gift=await change({action:'payment',id:sale.id,version:3,amount:60,method:'GIFT_CARD',giftCardCode:card.code,receivedConfirmed:true}) as {payment:{id:string}};
  expect((await db.transaction.findUniqueOrThrow({where:{id:sale.id}})).status).toBe('COMPLETED');
  await expect(db.transactionPayment.update({where:{id:cash.payment.id},data:{amount:1}})).rejects.toThrow(/append-only/);
  await expect(refundSalePayment(ctx,request(),{paymentId:cash.payment.id,amount:41,reason:'Excess cash refund',cashReturnedConfirmed:true})).rejects.toThrow(/remaining/);
  await refundSalePayment(ctx,request(),{paymentId:cash.payment.id,amount:40,reason:'Customer return',cashReturnedConfirmed:true});
  const input={paymentId:gift.payment.id,amount:60,reason:'Customer gift return'};
  await refundSalePayment(ctx,request('gift-refund-key'),input);await refundSalePayment(ctx,request('gift-refund-key'),input);
  expect(Number((await db.giftCard.findUniqueOrThrow({where:{id:card.id}})).currentBalance)).toBe(60);
  expect((await db.transaction.findUniqueOrThrow({where:{id:sale.id}})).status).toBe('REFUNDED');
 });
 test('unknown Stripe checkout safely reuses request and duplicate receipt never pays twice',async()=>{
  const sale=await draft();await review(sale.id);let session:Stripe.Checkout.Session;let calls=0;const keys:string[]=[];
  const stripe={checkout:{sessions:{create:async(input:any,options:any)=>{keys.push(options.idempotencyKey);calls++;session={id:'cs_pos_retry',status:'open',payment_status:'unpaid',mode:'payment',url:'https://checkout.stripe.com/test',currency:'usd',amount_total:10000,payment_intent:'pi_pos_retry',metadata:input.metadata,client_reference_id:input.client_reference_id} as Stripe.Checkout.Session;if(calls===1)throw Error('Timeout after provider accepted');return session},retrieve:async()=>session}}} as unknown as Stripe;
  const factory=async()=>stripe;
  await expect(startSaleCheckout(ctx,request('stripe-retry-key'),sale.id,factory)).rejects.toThrow(/Timeout/);
  expect((await db.salonCheckout.findFirstOrThrow({where:{transactionId:sale.id}})).status).toBe('UNKNOWN');
  await expect(change({action:'payment',id:sale.id,version:2,amount:100,method:'CASH',cashReceived:100,receivedConfirmed:true})).rejects.toThrow(/checkout/);
  await startSaleCheckout(ctx,request('stripe-retry-key'),sale.id,factory);expect(new Set(keys).size).toBe(1);
  session = {...session!,status:'complete',payment_status:'paid'};
  await expect(applySaleCheckout(ctx,{...session!,amount_total:9999})).rejects.toThrow(/amount/);
  await applySaleCheckout(ctx,session!);await applySaleCheckout(ctx,session!);
  expect(await db.transactionPayment.count({where:{transactionId:sale.id}})).toBe(1);
  expect(await startSaleCheckout(ctx,request('stripe-retry-key'),sale.id,factory)).toEqual({status:'PAID'});expect(calls).toBe(2);
  const payment=await db.transactionPayment.findFirstOrThrow({where:{transactionId:sale.id}});
  let refund:Stripe.Refund;
  const refundStripe={refunds:{create:async(input:any)=>{refund={id:'re_pos',status:'pending',currency:'usd',amount:input.amount,payment_intent:input.payment_intent,metadata:input.metadata} as Stripe.Refund;return refund},retrieve:async()=>refund}} as unknown as Stripe;
  const reserved=await refundSalePayment(ctx,request('stripe-refund-key'),{paymentId:payment.id,amount:100,reason:'Customer refund'},async()=>refundStripe);expect(reserved.status).toBe('PROCESSING');
  await expect(refundSalePayment(ctx,request(),{paymentId:payment.id,amount:1,reason:'Duplicate refund'},async()=>refundStripe)).rejects.toThrow(/pending refund/);
  await expect(applySaleRefund(ctx,{...refund!,amount:1,status:'succeeded'})).rejects.toThrow(/mismatch/);
  await applySaleRefund(ctx,{...refund!,status:'succeeded'});await applySaleRefund(ctx,{...refund!,status:'succeeded'});
  expect((await saleBalance(db,sale.id)).paidCents).toBe(0);
  expect((await db.transaction.findUniqueOrThrow({where:{id:sale.id}})).status).toBe('REFUNDED');
 });
 test('failed asynchronous checkout releases hold; a refunded partial sale can be voided once',async()=>{
  const sale=await draft();await review(sale.id);
  const checkout=await db.salonCheckout.create({data:{businessId:ctx.businessId,transactionId:sale.id,amountCents:10000,requestKey:'async-failed-key',createdById:ctx.user.id}});
  await applySaleCheckout(ctx,{id:'cs_async_fail',mode:'payment',status:'complete',payment_status:'unpaid',client_reference_id:checkout.id,metadata:{businessId:ctx.businessId,transactionId:sale.id,salonCheckoutId:checkout.id}} as unknown as Stripe.Checkout.Session,true);
  expect((await db.salonCheckout.findUniqueOrThrow({where:{id:checkout.id}})).status).toBe('FAILED');
  const paid=await change({action:'payment',id:sale.id,version:2,amount:20,method:'CASH',cashReceived:20,receivedConfirmed:true}) as {payment:{id:string}};
  await refundSalePayment(ctx,request(),{paymentId:paid.payment.id,amount:20,reason:'Cancelled partial sale',cashReturnedConfirmed:true});
  await change({action:'void',id:sale.id,version:3,reason:'Cancel refunded partial sale'});
  expect((await db.transaction.findUniqueOrThrow({where:{id:sale.id}})).status).toBe('VOIDED');
 });
 test('Stripe SDK signature verification rejects forged events and deduplicates paid callbacks',async()=>{
  const sale=await draft();await review(sale.id);
  const checkout=await db.salonCheckout.create({data:{businessId:ctx.businessId,transactionId:sale.id,amountCents:10000,requestKey:'signed-callback-key',createdById:ctx.user.id}});
  const previous=process.env.INTEGRATION_ENCRYPTION_KEY;process.env.INTEGRATION_ENCRYPTION_KEY='ab'.repeat(32);
  try {
   const secret='whsec_isolated_pos_fixture';
   await db.integrationConnection.create({data:{businessId:ctx.businessId,provider:'stripe',status:'CONFIGURED',configuration:{},encryptedCredentials:encryptCredentials(ctx.businessId,'stripe',{secretKey:'sk_test_fixture',webhookSecret:secret})}});
   const payload=JSON.stringify({id:'evt_pos_signed',object:'event',type:'checkout.session.completed',data:{object:{id:'cs_pos_signed',object:'checkout.session',status:'complete',payment_status:'paid',mode:'payment',currency:'usd',amount_total:10000,payment_intent:'pi_pos_signed',client_reference_id:checkout.id,metadata:{businessId:ctx.businessId,transactionId:sale.id,salonCheckoutId:checkout.id}}}});
   const send=(signature:string)=>webhook(new Request('http://localhost/api/hook',{method:'POST',headers:{'stripe-signature':signature},body:payload}),{params:Promise.resolve({businessId:ctx.businessId})});
   expect((await send('forged')).status).toBe(400);
   expect(await db.transactionPayment.count({where:{transactionId:sale.id}})).toBe(0);
   const signature=new Stripe('sk_test_fixture').webhooks.generateTestHeaderString({payload,secret});
   expect((await send(signature)).status).toBe(200);expect((await send(signature)).status).toBe(200);
   expect(await db.transactionPayment.count({where:{transactionId:sale.id}})).toBe(1);
  } finally {if(previous===undefined)delete process.env.INTEGRATION_ENCRYPTION_KEY;else process.env.INTEGRATION_ENCRYPTION_KEY=previous;}
 });

});
