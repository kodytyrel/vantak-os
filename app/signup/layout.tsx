import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set Up Your VantakOS | Vantak',
  description: 'We handle the business, so you can focus on the craft. Create your VantakOS instance in minutes.',
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

