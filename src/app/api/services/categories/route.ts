import { categories } from '@/lib/operations/categories';
const handlers = categories('service');
export const GET = handlers.GET;
export const POST = handlers.POST;
