import React from "react";
import { MdOutlineGavel } from "react-icons/md";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for using RoomFind.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout 
      title="Terms of Service" 
      lastUpdated="March 2026" 
      icon={<MdOutlineGavel size={32} />}
    >
      <p>
        Welcome to RoomFind. By accessing or using our website and services, you agree to comply with and be bound by the following Terms of Service. Please review them carefully.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By creating an account or using RoomFind, you explicitly agree to these terms. If you do not agree to all of the terms and conditions, you may not access or use our services.
      </p>

      <h2>2. User Accounts</h2>
      <p>
        You must be at least 18 years old to use RoomFind. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
      </p>

      <h2>3. User Conduct and Content</h2>
      <p>
        RoomFind is a community platform. You agree not to post any hateful, discriminatory, or illegal content. All listings must be accurate and truthful. We reserve the right to remove any content or terminate accounts that violate these guidelines.
      </p>

      <h2>4. Platform Limitation of Liability</h2>
      <p>
        RoomFind is a marketplace connecting potential flatmates and landlords. We do not own, manage, or inspect the properties listed. You agree that RoomFind is not responsible for any disputes, damages, or issues that arise between users.
      </p>

      <p>
        For questions regarding these Terms, please contact us at <a href="mailto:hello@roomfind.ie">hello@roomfind.ie</a>.
      </p>
    </LegalPageLayout>
  );
}
