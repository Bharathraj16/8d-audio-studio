import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

export default function Pricing() {
  const { isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      priceId: null,
      features: [
        '✓ 2 minutes max audio',
        '✓ Basic 8D effect',
        '✓ Watermark on output',
        '✗ No download',
        '✗ No batch processing'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      priceId: 'price_pro_123',
      features: [
        '✓ Unlimited audio length',
        '✓ All 8D effects',
        '✓ No watermark',
        '✓ Download MP3/WAV',
        '✓ Priority processing'
      ],
      popular: true
    },
    {
      id: 'studio',
      name: 'Studio',
      price: 29.99,
      priceId: 'price_studio_123',
      features: [
        '✓ Everything in Pro',
        '✓ Batch processing (10 files)',
        '✓ API access',
        '✓ Priority support 24/7',
        '✓ Team collaboration'
      ]
    }
  ];

  const handleSubscribe = async (plan) => {
    if (!isSignedIn) {
      alert('Please sign in first!');
      window.location.href = '/sign-in';
      return;
    }

    if (plan.id === 'free') {
      window.location.href = '/';
      return;
    }

    setLoading(true);
    
    // For demo - show upgrade message
    alert(`Pro plan coming soon! Price: $${plan.price}/month\n\nIn production, this would redirect to Stripe checkout.`);
    
    // Store in localStorage for demo
    if (user?.id) {
      localStorage.setItem(`user_tier_${user.id}`, 'pro');
    }
    
    setLoading(false);
    
    // Redirect to home after 1 second
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header with Back Button */}
        <div style={{ marginBottom: '2rem' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
            ← Back to Studio
          </a>
        </div>

        <h1 style={{ textAlign: 'center', color: 'white', marginBottom: '0.5rem' }}>
          💰 Choose Your Plan
        </h1>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginBottom: '3rem' }}>
          Start free, upgrade anytime!
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {plans.map(plan => (
            <div
              key={plan.id}
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '2rem',
                border: plan.popular ? '2px solid #c084fc' : '1px solid rgba(255,255,255,0.2)',
                position: 'relative',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#c084fc',
                  padding: '4px 16px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  MOST POPULAR
                </div>
              )}

              <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'white' }}>{plan.name}</h2>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#c084fc' }}>${plan.price}</span>
                {plan.price > 0 && <span style={{ color: 'rgba(255,255,255,0.6)' }}>/month</span>}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{ 
                    marginBottom: '0.5rem', 
                    opacity: 0.9,
                    color: feature.startsWith('✗') ? 'rgba(255,255,255,0.4)' : 'white'
                  }}>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loading}
                style={{
                  width: '100%',
                  background: plan.popular 
                    ? 'linear-gradient(90deg, #c084fc, #a855f7)' 
                    : plan.id === 'free' 
                      ? 'rgba(255,255,255,0.2)' 
                      : 'linear-gradient(90deg, #8a2be2, #00bfff)',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '40px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Processing...' : plan.price === 0 ? 'Start Free' : 'Subscribe Now'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}