'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from './AuthContext';
import { toast } from 'react-hot-toast';

const NotificationsContext = createContext({});

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    
    // Audio ref for notification sound
    const audioRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);
                
            if (error) throw error;
            
            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.is_read).length || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Real-time subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('notifications-updates')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                const newNotification = payload.new;
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                // Play sound
                if (audioRef.current) {
                    audioRef.current.play().catch(e => console.log('Audio play failed', e));
                }
                
                // Show toast
                toast(newNotification.title, {
                    icon: '🔔',
                    duration: 4000
                });
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                const updated = payload.new;
                setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
                // Re-calc unread count from current state + update
                setUnreadCount(prev => {
                   // Crude recalculation or just fetch? 
                   // Let's rely on the updated list
                   const newList = notifications.map(n => n.id === updated.id ? updated : n);
                   return newList.filter(n => !n.is_read).length;
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase, notifications]); // Dependencies might need tuning to avoid stale closure on notifications

    const markAsRead = async (id) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);
                
            if (error) throw error;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Revert if needed, but low risk
        }
    };

    const markAllAsRead = async () => {
        // Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
                
            if (error) throw error;
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <NotificationsContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            refresh: fetchNotifications
        }}>
            <audio ref={audioRef} src="/sounds/notification.mp3" className="hidden" />
            {children}
        </NotificationsContext.Provider>
    );
};
