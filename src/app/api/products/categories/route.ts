import { categories } from '@/lib/operations/categories';
const handlers = categories('product');
export const GET = handlers.GET;
export const POST = handlers.POST;
