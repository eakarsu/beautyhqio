import { catalog } from '@/lib/operations/catalog';
const handlers = catalog('vendor');
export const GET = handlers.GET;
export const POST = handlers.POST;
