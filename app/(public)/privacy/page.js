import React from "react";
import { MdOutlineShield } from "react-icons/md";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy and data practices for RoomFind.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout 
      title="Privacy Policy" 
      lastUpdated="March 2026" 
      icon={<MdOutlineShield size={32} />}
    >
      <p>
        At RoomFind, we take your privacy seriously. This policy explains how we collect, use, and protect your personal data when you use our platform.
      </p>

      <h2>1. Data We Collect</h2>
      <p>
        We collect information you provide directly to us (e.g., when creating an account, filling out your profile, listing a room, or sending messages). This includes your email, name, location preferences, and any media you upload.
      </p>

      <h2>2. How We Use Your Data</h2>
      <p>
        Your data is primarily used to provide and improve our matching algorithm, facilitate communication between users, and ensure the safety and security of our platform. We do not sell your personal data to third parties.
      </p>

      <h2>3. Data Security</h2>
      <p>
        We implement robust security measures to protect your personal information. Authentication and sensitive data are secured using industry-standard encryptions and secure providers like Supabase.
      </p>

      <h2>4. Your Rights</h2>
      <p>
        Under European data protection laws, you have the right to access, modify, or delete your personal data. You can manage your profile settings or contact us directly to exercise these rights.
      </p>

      <p>
        For privacy inquiries, please reach out to our privacy team at <a href="mailto:privacy@roomfind.ie">privacy@roomfind.ie</a>.
      </p>
    </LegalPageLayout>
  );
}
