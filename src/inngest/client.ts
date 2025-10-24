import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'imbox-email-client',
  env: process.env.NODE_ENV,
});
