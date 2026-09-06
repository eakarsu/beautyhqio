import { catalog } from '@/lib/operations/catalog';
const handlers = catalog('service');
export const GET = handlers.GET;
export const POST = handlers.POST;
