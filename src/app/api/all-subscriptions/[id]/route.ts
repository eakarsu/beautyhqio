import {NextResponse} from 'next/server'
import {getAuthenticatedUser} from '@/lib/api-auth'
export async function DELETE(){const user=await getAuthenticatedUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});if(!user.isPlatformAdmin)return NextResponse.json({error:'Platform administrator required'},{status:403});return NextResponse.json({error:'Billing history is retained. The owner can cancel through verified provider billing.'},{status:405})}
