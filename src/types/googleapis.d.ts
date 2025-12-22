// Override googleapis types to avoid build errors
declare module 'googleapis' {
  export * from 'googleapis/build/src/index';
}
