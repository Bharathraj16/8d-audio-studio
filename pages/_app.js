import { ClerkProvider } from '@clerk/nextjs';

function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#8a2be2',
          colorBackground: '#1a0b2e',
          colorText: '#ffffff',
        },
        elements: {
          card: 'bg-white/10 backdrop-blur-lg',
          formButtonPrimary: 'bg-purple-600 hover:bg-purple-700',
        }
      }}
    >
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;