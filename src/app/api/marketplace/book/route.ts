import { channelBooking } from '@/lib/appointments/channel-booking';
export async function POST(req: Request) { return channelBooking(req, 'MARKETPLACE'); }
