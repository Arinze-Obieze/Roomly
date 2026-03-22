import React from "react";
import { MdCookie } from "react-icons/md";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Cookie Policy",
  description: "Learn about how RoomFind uses cookies.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout 
      title="Cookie Policy" 
      lastUpdated="March 2026" 
      icon={<MdCookie size={32} />}
    >
      <p>
        RoomFind uses cookies and similar tracking technologies to improve your browsing experience, provide secure authentication, and analyze our website traffic. This policy outlines what cookies are and how we use them.
      </p>

      <h2>1. What are Cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help the site remember your actions and preferences over time, so you don't have to keep re-entering them whenever you come back to the site.
      </p>

      <h2>2. How We Use Cookies</h2>
      <p><strong>Essential Cookies:</strong> These are required for the operation of RoomFind. They include cookies that enable you to log into secure dashboard areas and use active messaging features.</p>
      <p><strong>Performance & Analytics Cookies:</strong> If you consent, we use these to recognize and count the number of visitors and see how they move around the website. This helps us improve the way RoomFind works.</p>

      <h2>3. Managing Cookie Preferences</h2>
      <p>
        You can manage your cookie preferences through our Cookie Consent banner or adjust your browser settings to refuse cookies. Note that rejecting essential cookies will prevent you from logging into your account.
      </p>

      <p>
        If you have questions about our use of cookies, email <a href="mailto:hello@roomfind.ie">hello@roomfind.ie</a>.
      </p>
    </LegalPageLayout>
  );
}
