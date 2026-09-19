import { loadStripe } from '@stripe/stripe-js'

/**
 * One Stripe.js instance for the whole app.
 *
 * VITE_STRIPE_PUBLISHABLE_KEY is the one Stripe value that belongs in Netlify:
 * publishable keys are designed to be public and this one is compiled into the
 * bundle. The secret key and webhook secret never leave Railway.
 *
 * Resolves to null when the key is missing, so pages can show a clear message
 * instead of a blank Payment Element.
 */
const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

export const stripePromise = key ? loadStripe(key) : Promise.resolve(null)
export const stripeConfigured = Boolean(key)
