import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { GET } from '../../src/app/api/auth/demo-credentials/route'

test('local production startup allows opted-in demo roles without returning passwords in availability checks', async () => {
 const values={NODE_ENV:'production',ENABLE_DEMO_CREDENTIAL_AUTOFILL:'true',ADMIN_EMAIL:'owner@example.test',ADMIN_PASSWORD:'fixture-owner-password',DEMO_PASSWORD:'fixture-staff-password'}
 const before=Object.fromEntries(Object.keys(values).map(key=>[key,process.env[key]]))
 Object.assign(process.env,values)
 try {
  const status=await GET(new NextRequest('http://localhost:30802/api/auth/demo-credentials?status=1'))
  const meta=await status.json()
  assert.equal(meta.enabled,true);assert.equal(meta.accounts.length,4);assert.ok(!JSON.stringify(meta).includes('password'))
  const data=await(await GET(new NextRequest('http://localhost:30802/api/auth/demo-credentials'))).json()
  assert.equal(data.password,values.ADMIN_PASSWORD)
  assert.equal(data.accounts.length,4)
  for(const request of [new NextRequest('https://public.example/api/auth/demo-credentials'),new NextRequest('http://localhost/api/auth/demo-credentials',{headers:{'x-forwarded-host':'public.example'}}),new NextRequest('http://localhost/api/auth/demo-credentials',{headers:{origin:'https://foreign.example'}})]){
   assert.deepEqual(await(await GET(request)).json(),{enabled:false,accounts:[]})
  }
  process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL='false'
  assert.deepEqual(await(await GET(new NextRequest('http://localhost/api/auth/demo-credentials'))).json(),{enabled:false,accounts:[]})
 }finally{for(const[key,value]of Object.entries(before)){if(value===undefined)delete process.env[key];else process.env[key]=value}}
})
