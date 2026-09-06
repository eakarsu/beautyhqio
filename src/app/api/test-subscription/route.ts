import {NextResponse} from 'next/server'
export const GET=()=>NextResponse.json({error:'Use the authenticated subscription endpoint.'},{status:404})
