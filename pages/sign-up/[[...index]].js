import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 100%)'
    }}>
      <SignUp 
        afterSignUpUrl="/"
        redirectUrl="/"
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-white/10 backdrop-blur-lg shadow-xl'
          }
        }}
      />
    </div>
  );
}