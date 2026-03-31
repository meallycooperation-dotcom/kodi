import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Simple payment callback page: read query params and redirect to dashboard
export default function PaymentCallback(): JSX.Element {
  const navigate = useNavigate()

  useEffect(() => {
    const url = new URL(window.location.href)
    const trxref = url.searchParams.get('trxref')
    const reference = url.searchParams.get('reference')
    console.log('PaymentCallback', { trxref, reference })
    // You could verify the transaction with your backend here
    // Then navigate the user back to the dashboard
    const t = setTimeout(() => navigate('/dashboard', { replace: true }), 1000)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <section style={{ padding: '2rem' }}>
      <h1>Payment processing</h1>
      <p>Please wait while we confirm your payment. You will be redirected to the dashboard shortly.</p>
    </section>
  )
}
