// src/lib/stripeClient.ts
// Cliente de Stripe para el frontend

export const initStripe = async () => {
  const scriptId = 'stripe-js';
  
  if (document.getElementById(scriptId)) {
    return;
  }
  
  const script = document.createElement('script');
  script.id = scriptId;
  script.src = 'https://js.stripe.com/v3/';
  script.async = true;
  document.head.appendChild(script);
};

export const getPublishableKey = (): string => {
  return import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
};
