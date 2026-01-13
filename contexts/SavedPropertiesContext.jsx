'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from './AuthContext';
import { toast } from 'sonner';

const SavedPropertiesContext = createContext(null);

export const useSavedProperties = () => {
  const context = useContext(SavedPropertiesContext);
  if (!context) {
    throw new Error('useSavedProperties must be used within SavedPropertiesProvider');
  }
  return context;
};

export function SavedPropertiesProvider({ children }) {
  const { user } = useAuthContext();
  const [savedPropertyIds, setSavedPropertyIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setSavedPropertyIds(new Set());
      setLoading(false);
      return;
    }

    const fetchSavedProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_properties')
          .select('property_id')
          .eq('user_id', user.id);

        if (error) throw error;

        const ids = new Set(data.map(item => item.property_id));
        setSavedPropertyIds(ids);
      } catch (error) {
        console.error('Error fetching saved properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedProperties();
  }, [user]);

  const toggleSave = async (propertyId) => {
    if (!user) {
      toast.error('Please sign in to save properties');
      return;
    }

    const isSaved = savedPropertyIds.has(propertyId);
    
    // Optimistic Update
    const newSet = new Set(savedPropertyIds);
    if (isSaved) {
      newSet.delete(propertyId);
    } else {
      newSet.add(propertyId);
    }
    setSavedPropertyIds(newSet);

    try {
      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);
          
        if (error) throw error;
        toast.success('Property removed from saved');
      } else {
        // Save
        const { error } = await supabase
          .from('saved_properties')
          .insert({
            user_id: user.id,
            property_id: propertyId
          });
          
        if (error) throw error;
        toast.success('Property saved');
      }
    } catch (error) {
      // Revert on error
      console.error('Error toggling save:', error);
      setSavedPropertyIds(savedPropertyIds); // Revert to old set
      toast.error('Failed to update saved status');
    }
  };

  const isPropertySaved = (id) => savedPropertyIds.has(id);

  const value = {
    savedPropertyIds,
    toggleSave,
    isPropertySaved,
    loading
  };

  return (
    <SavedPropertiesContext.Provider value={value}>
      {children}
    </SavedPropertiesContext.Provider>
  );
}
