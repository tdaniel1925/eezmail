import { Client, Environment } from 'square';

if (!process.env.SQUARE_ACCESS_TOKEN) {
  throw new Error('SQUARE_ACCESS_TOKEN is not set');
}

const environment =
  process.env.SQUARE_ENVIRONMENT === 'production'
    ? Environment.Production
    : Environment.Sandbox;

export const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment,
});

export async function createSubscription({
  customerId,
  planId,
  locationId,
}: {
  customerId: string;
  planId: string;
  locationId: string;
}) {
  const response = await squareClient.subscriptionsApi.createSubscription({
    locationId,
    customerId,
    planVariationId: planId,
  });

  return response.result.subscription;
}

export async function getSubscription(subscriptionId: string) {
  const response =
    await squareClient.subscriptionsApi.retrieveSubscription(subscriptionId);

  return response.result.subscription;
}

export async function cancelSubscription(subscriptionId: string) {
  const response =
    await squareClient.subscriptionsApi.cancelSubscription(subscriptionId);

  return response.result.subscription;
}

export async function createCustomer({
  email,
  givenName,
  familyName,
}: {
  email: string;
  givenName?: string;
  familyName?: string;
}) {
  const response = await squareClient.customersApi.createCustomer({
    emailAddress: email,
    givenName,
    familyName,
  });

  return response.result.customer;
}
