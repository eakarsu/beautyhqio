const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const { createHash, randomBytes } = require('node:crypto');
const assert = require('node:assert/strict');
const project = path.resolve(__dirname, '..');
const env = parseEnv(fs.readFileSync(path.join(project, '.env'), 'utf8'));
for (const [key, value] of Object.entries(env)) if (process.env[key] === undefined) process.env[key] = value;
const url = new URL(process.env.DATABASE_URL || '');
if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Demo loading requires a local, non-production database');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();
const demoNote = 'DEMO — fictional evaluation data. No real service, approval, payment, delivery or external submission occurred.';
const names = ['Avery','Jordan','Taylor','Casey','Riley','Morgan','Alex','Jamie','Cameron','Drew','Reese','Quinn','Skyler','Rowan','Emerson'];
const stamp = (days = 0, hour = 10) => { const d = new Date(); d.setDate(d.getDate()+days); d.setHours(hour,0,0,0); return d; };
const key = (kind, i) => `demo-${kind}-${String(i+1).padStart(3,'0')}`;
const touched = new Set();
async function insert(tx, model, id, data) {
  touched.add(model);
  return tx[model].upsert({ where: { id }, update: {}, create: { id, ...data } });
}
async function snapshot() {
  const result = {};
  for (const model of [...touched].sort()) {
    const rows = await db[model].findMany({orderBy:{id:'asc'}});
    result[model] = { count: rows.length, hash: createHash('sha256').update(JSON.stringify(rows)).digest('hex') };
  }
  for (const table of ['inventory','suppliers','facility_maintenance','corporate_wellness_programs','corporate_wellness_enrollments']) {
    const rows=await db.$queryRawUnsafe(`SELECT * FROM ${table} ORDER BY id`);
    result[table]={count:rows.length,hash:createHash('sha256').update(JSON.stringify(rows)).digest('hex')};
  }
  return result;
}
async function main() {
  const email = process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const admin = email ? await db.user.findUnique({where:{email}}) : await db.user.findFirst({where:{role:'ADMIN'}});
  if (!admin) throw new Error('Create the configured administrator first');
  const accountPassword = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
  const run = () => db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('local-demo-data-loader'))`;
    await seed(tx, admin, accountPassword);
  }, { timeout: 120000, maxWait: 10000 });
  const adminBefore = JSON.stringify(admin);
  await run();
  const first = await snapshot();
  if (process.argv.includes('--verify')) { await run(); assert.deepEqual(await snapshot(), first, 'Reload must preserve every existing record and avoid duplicates'); }
  assert.equal(JSON.stringify(await db.user.findUnique({where:{id:admin.id}})), adminBefore, 'Administrator must remain unchanged');
  console.log(JSON.stringify({ counts: Object.fromEntries(Object.entries(first).map(([model,value])=>[model,value.count])), verifiedRepeat:process.argv.includes('--verify'), administratorPreserved:true },null,2));
}
async function seed(tx, admin, accountPassword) {
  if(!admin.businessId) throw new Error('Administrator must belong to a business');
  const businessId=admin.businessId;
  const locations=await tx.location.findMany({where:{businessId},orderBy:{id:'asc'}});
  const clients=await tx.client.findMany({where:{businessId},orderBy:{id:'asc'},take:15});
  const services=await tx.service.findMany({where:{businessId},orderBy:{id:'asc'},take:15});
  const products=await tx.product.findMany({where:{businessId},orderBy:{id:'asc'},take:15});
  const packages=await tx.package.findMany({where:{businessId},orderBy:{id:'asc'},take:15});
  if(!locations.length||clients.length<15||services.length<15||products.length<15) throw new Error('Expected existing salon catalog and 15 clients before loading supplemental samples');
  const tag=createHash('sha256').update(businessId).digest('hex').slice(0,8);
  const k=(kind,i)=>key(`beauty-${tag}-${kind}`,i);
  // These operational tables are distinct from the retail Product/Vendor catalog.
  const ddl=fs.readFileSync(path.join(project,'src/lib/db-pass7.ts'),'utf8');
  const tables=['inventory','suppliers','facility_maintenance','corporate_wellness_programs','corporate_wellness_enrollments','pass7_purchase_orders'];
  for(const sql of ddl.matchAll(/`(CREATE TABLE IF NOT EXISTS[\s\S]*?)`/g)) {
    if(tables.some(table=>sql[1].startsWith(`CREATE TABLE IF NOT EXISTS ${table} (`))) await tx.$executeRawUnsafe(sql[1]);
  }
  for(let i=0;i<15;i++) {
    const locationId=k('location',i),uid=k('staff-user',i),staffId=k('staff',i),vendorId=k('vendor',i),membershipId=k('membership',i);
    await insert(tx,'location',locationId,{businessId,name:`Demo salon room ${i+1}`,address:`${100+i} Example Lane`,city:'Demo City',state:'GA',zip:'30301',allowOnlineBooking:false});
    await insert(tx,'user',uid,{businessId,email:`demo.salon.${tag}.${i+1}@example.invalid`,password:accountPassword,firstName:names[i],lastName:'Demo',role:'STAFF',isActive:true});
    await insert(tx,'staff',staffId,{userId:uid,locationId:locations[0].id,displayName:`${names[i]} Demo`,title:'Demo stylist',specialties:['Demo service'],serviceIds:[services[i].id],isBookableOnline:false,hourlyRate:25,payType:'HOURLY'});
    for(let day=0;day<7;day++) await insert(tx,'staffSchedule',`${staffId}-${day}`,{staffId,dayOfWeek:day,startTime:'09:00',endTime:'17:00',isWorking:day>0&&day<6});
    const appointmentId=k('appointment',i), scheduledStart=stamp(0,10);
    const duration=services[i].duration;
    await insert(tx,'appointment',appointmentId,{businessId,clientId:clients[i].id,staffId,locationId:locations[0].id,scheduledStart,scheduledEnd:new Date(scheduledStart.getTime()+duration*60000),status:'BOOKED',source:'PHONE',notes:demoNote,internalNotes:demoNote});
    await insert(tx,'appointmentService',k('appointment-service',i),{appointmentId,serviceId:services[i].id,price:services[i].price,duration,notes:demoNote});
    await insert(tx,'timeOff',k('time-off',i),{staffId,type:'Demo leave request',startDate:stamp(30+i),endDate:stamp(31+i),status:'pending',notes:demoNote});
    await insert(tx,'vendor',vendorId,{businessId,name:`Demo salon supplier ${i+1}`,email:`demo.salon.supplier.${i+1}@example.invalid`,notes:demoNote});
    const poId=k('po',i);
    await insert(tx,'purchaseOrder',poId,{poNumber:`DEMO-${tag}-PO-${i+1}`,vendorId,createdById:admin.id,subtotal:50,totalAmount:50,status:'draft',notes:demoNote});
    await insert(tx,'purchaseOrderItem',k('po-line',i),{purchaseOrderId:poId,productId:products[i].id,productName:products[i].name,quantityOrdered:5,unitCost:10,totalCost:50});
    await insert(tx,'membership',membershipId,{businessId,name:`Demo membership ${i+1}`,description:demoNote,price:25+i,isActive:false});
    await insert(tx,'membershipSubscription',k('membership-request',i),{membershipId,clientId:clients[i].id,status:'pending',nextBillingDate:stamp(365),paymentMethod:'demo-no-charge'});
    await insert(tx,'serviceAddOn',k('addon',i),{serviceId:services[i].id,name:`Demo add-on ${i+1}`,duration:10,price:10});
    await insert(tx,'serviceFormula',k('formula',i),{clientId:clients[i].id,serviceType:'Demo consultation',formula:'Demo placeholder: record the stylist-reviewed formula here. No treatment formula supplied.'});
    if(packages[i]) await insert(tx,'packageService',k('package-service',i),{packageId:packages[i].id,serviceId:services[i].id});
    const supplierName=`Demo salon supplier ${i+1} (${tag})`;
    await tx.$executeRaw`INSERT INTO suppliers (business_id,name,contact_name,email,category,notes) SELECT ${businessId},${supplierName},${names[i]},${`demo.supplier.${i+1}@example.invalid`},'Demo supplies',${demoNote} WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE business_id=${businessId} AND name=${supplierName})`;
    const [supplier]=await tx.$queryRaw`SELECT id FROM suppliers WHERE business_id=${businessId} AND name=${supplierName}`;
    const sku=`DEMO-${tag}-${i+1}`;
    await tx.$executeRaw`INSERT INTO inventory (business_id,sku,name,description,category,unit,quantity_on_hand,reorder_level,reorder_quantity,unit_cost,supplier_id,notes) SELECT ${businessId},${sku},${`Demo salon supply ${i+1}`},${demoNote},'Consumables','unit',30,10,20,5,${supplier.id},${demoNote} WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE business_id=${businessId} AND sku=${sku})`;
    const title=`Demo maintenance ${i+1} (${tag})`;
    await tx.$executeRaw`INSERT INTO facility_maintenance (business_id,location_id,title,description,scheduled_date,status,notes) SELECT ${businessId},${locations[0].id},${title},${demoNote},${stamp(i+1)},'scheduled',${demoNote} WHERE NOT EXISTS (SELECT 1 FROM facility_maintenance WHERE business_id=${businessId} AND title=${title})`;
    const programName=`Demo workplace program ${i+1} (${tag})`,orgId=k('organization',i);
    await tx.$executeRaw`INSERT INTO corporate_wellness_programs (business_id,client_org_id,name,description,starts_at,ends_at,budget,seat_count,status) SELECT ${businessId},${orgId},${programName},${demoNote},${stamp(30)},${stamp(90)},500,10,'draft' WHERE NOT EXISTS (SELECT 1 FROM corporate_wellness_programs WHERE business_id=${businessId} AND name=${programName})`;
    const [program]=await tx.$queryRaw`SELECT id FROM corporate_wellness_programs WHERE business_id=${businessId} AND name=${programName}`;
    await tx.$executeRaw`INSERT INTO corporate_wellness_enrollments (program_id,client_org_id,client_id,member_name,status,notes) SELECT ${program.id},${orgId},${clients[i].id},${`Demo participant ${i+1}`},'pending',${demoNote} WHERE NOT EXISTS (SELECT 1 FROM corporate_wellness_enrollments WHERE program_id=${program.id} AND client_id=${clients[i].id})`;
  }
}

main().catch(error=>{console.error(error.message);process.exitCode=1}).finally(()=>db.$disconnect());
