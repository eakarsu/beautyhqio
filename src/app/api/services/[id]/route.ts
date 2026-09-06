import { catalog } from '@/lib/operations/catalog';
const handlers = catalog('service');
export const GET = handlers.read;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
