'use client';

import CreateListingForm from '@/components/CreateListingForm';
import { useRouter } from 'next/navigation';

export default function NewListingPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/dashboard');
  };

  return <CreateListingForm onClose={handleClose} />;
}
