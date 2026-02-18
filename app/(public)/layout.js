'use client';

import { FilterProvider } from "@/core/contexts/FilterContext";
import { PropertiesProvider } from "@/core/contexts/PropertiesContext";
import { SavedPropertiesProvider } from "@/core/contexts/SavedPropertiesContext";
import { ChatProvider } from "@/core/contexts/ChatContext";

export default function PublicLayout({ children }) {
  return (
    <FilterProvider>
      <PropertiesProvider>
        <SavedPropertiesProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </SavedPropertiesProvider>
      </PropertiesProvider>
    </FilterProvider>
  );
}
