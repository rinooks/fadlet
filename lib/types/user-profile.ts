import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  organization: string;
  jobTitle?: string;
  marketingConsent: {
    agreed: boolean;
    agreedAt: Timestamp | null;
  };
  profileCompletedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProfileFormValues {
  email: string;
  name: string;
  organization: string;
  jobTitle: string;
  marketingAgreed: boolean;
}
