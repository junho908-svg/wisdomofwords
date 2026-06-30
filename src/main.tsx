import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { AuthProvider } from './contexts/AuthContext'
import { PAYPAL_CONFIG } from './lib/paypal'
import App from './App.tsx'
import './index.css'

const paypalOptions = {
  clientId: PAYPAL_CONFIG.clientId,
  currency: PAYPAL_CONFIG.currency,
  intent: PAYPAL_CONFIG.intent,
};

console.log("[PayPal] SDK options initialized:", {
  clientId: paypalOptions.clientId ? `${paypalOptions.clientId.slice(0, 10)}...` : 'undefined',
  currency: paypalOptions.currency,
  intent: paypalOptions.intent
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PayPalScriptProvider options={paypalOptions}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </PayPalScriptProvider>
  </StrictMode>,
)
