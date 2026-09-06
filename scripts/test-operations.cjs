// Each suite gets its own disposable local schema so its worker cannot consume another suite's outbox.
const {spawnSync}=require('node:child_process'),{readFileSync}=require('node:fs'),{parseEnv}=require('node:util');
const base=new URL(process.env.DATABASE_URL||parseEnv(readFileSync('.env','utf8')).DATABASE_URL);
if(!['localhost','127.0.0.1','[::1]'].includes(base.hostname))throw Error('Database tests require a local PostgreSQL server');
const pgEnv={...process.env,PGHOST:base.hostname,PGPORT:base.port||'5432',PGUSER:decodeURIComponent(base.username),PGPASSWORD:decodeURIComponent(base.password),PGDATABASE:decodeURIComponent(base.pathname.slice(1))};
const files=['src/lib/operations/__tests__/cash-drawer.integration.test.ts','src/lib/operations/__tests__/sales.integration.test.ts','src/lib/operations/__tests__/persistence.integration.test.ts','src/lib/appointments/__tests__/persistence.integration.test.ts'];
const selected=process.argv.slice(2);
if(selected.some(file=>!files.includes(file)))throw Error('Unknown integration suite');
for(const [index,file] of (selected.length?selected:files).entries()){
 const schema=`beauty_ops_test_${process.pid}_${index}`,url=new URL(base);url.searchParams.set('schema',schema);
 const env={...process.env,DATABASE_URL:url.toString(),RUN_DATABASE_INTEGRATION:'true',RUN_OPERATIONS_INTEGRATION:'true'};
 function run(command,args){const r=spawnSync(command,args,{env,stdio:'inherit'});if(r.status!==0)throw Error(`${command} failed`)}
 try{run('./node_modules/.bin/prisma',['migrate','deploy']);run('./node_modules/.bin/jest',['--runInBand',file]);}
 catch(e){console.error(e.message);process.exitCode=1}
 finally{const r=spawnSync('psql',['-X','-q','-v','ON_ERROR_STOP=1'],{env:pgEnv,input:`DROP SCHEMA IF EXISTS "${schema}" CASCADE;`,encoding:'utf8'});if(r.status!==0){console.error('Disposable schema cleanup failed');process.exitCode=1}else console.log('Disposable test schema removed.')}
}
