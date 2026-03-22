import React from "react";
import { MdOutlineLock } from "react-icons/md";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "GDPR Compliance",
  description: "RoomFind's commitment to the General Data Protection Regulation.",
};

export default function GDPRPage() {
  return (
    <LegalPageLayout 
      title="GDPR Compliance" 
      lastUpdated="March 2026" 
      icon={<MdOutlineLock size={32} />}
    >
      <p>
        The General Data Protection Regulation (GDPR) sets the standard for data protection across the European Union. Operating in Ireland, RoomFind is fully committed to upholding these standards and ensuring your personal data is secure, transparently handled, and protected.
      </p>

      <h2>Your Rights Under GDPR</h2>
      <p>As a user of RoomFind, you have the following rights regarding your personal data:</p>
      <ul>
        <li><strong>The right to be informed:</strong> You have the right to know what data we collect and how it is used.</li>
        <li><strong>The right of access:</strong> You can request a copy of the personal data we hold about you.</li>
        <li><strong>The right to rectification:</strong> You can ask us to update or correct inaccurate data.</li>
        <li><strong>The right to erasure ("Right to be Forgotten"):</strong> You can request that we delete your personal data. You can delete your account directly from your dashboard.</li>
        <li><strong>The right to restrict processing:</strong> You can ask us to pause the processing of your data under certain circumstances.</li>
        <li><strong>The right to data portability:</strong> You can obtain and reuse your personal data across different services.</li>
      </ul>

      <h2>Data Processors and Storage</h2>
      <p>
        We process your data using secure, GDPR-compliant infrastructure. Authentication and critical user data are stored with Supabase, leveraging robust cloud environments with built-in encryption. We do not transfer your data outside the European Economic Area (EEA) without adequate protections.
      </p>

      <h2>Data Breach Notification</h2>
      <p>
        In the highly unlikely event of a data breach that poses a risk to your rights, we will notify you and the Data Protection Commission (DPC) within the mandated 72-hour window.
      </p>

      <p>
        To make a GDPR request (Subject Access Request, Deletion Request, etc.), please email our Data Protection Officer at <a href="mailto:gdpr@roomfind.ie">gdpr@roomfind.ie</a>.
      </p>
    </LegalPageLayout>
  );
}
