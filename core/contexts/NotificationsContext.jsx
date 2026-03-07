'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/core/utils/supabase/client';
import { useAuthContext } from './AuthContext';
import { toast } from 'react-hot-toast';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const NotificationsContext = createContext({});

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [toastEnabled, setToastEnabled] = useState(true);
    const supabase = createClient();
    const subscriptionRef = useRef(null);
    const PAGE_SIZE = 20;
    
    // Audio ref for notification sound
    const audioRef = useRef(null);

    useEffect(() => {
        const storedSound = localStorage.getItem('notifications:sound');
        const storedToast = localStorage.getItem('notifications:toast');
        const storedPush = localStorage.getItem('notifications:push');
        if (storedSound !== null) setSoundEnabled(storedSound === 'true');
        if (storedToast !== null) setToastEnabled(storedToast === 'true');
        if (storedPush === 'true') setPushEnabled(true);
    }, []);

    const persistNotificationPrefs = useCallback((nextSoundEnabled, nextToastEnabled, nextPushEnabled) => {
        localStorage.setItem('notifications:sound', String(nextSoundEnabled));
        localStorage.setItem('notifications:toast', String(nextToastEnabled));
        localStorage.setItem('notifications:push', String(nextPushEnabled));
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        const { count, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) throw error;
        setUnreadCount(count || 0);
    }, [user, supabase]);

    const fetchNotifications = useCallback(async ({ append = false, targetPage = 0 } = {}) => {
        if (!user) return;

        try {
            if (append) {
                setIsFetchingMore(true);
            } else {
                setLoading(true);
            }

            const from = targetPage * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const batch = data || [];
            setNotifications(prev => {
                const merged = append ? [...prev, ...batch] : batch;
                const dedupedMap = new Map();
                merged.forEach(item => dedupedMap.set(item.id, item));
                return Array.from(dedupedMap.values()).sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
            });
            setHasMore(batch.length === PAGE_SIZE);
            setPage(targetPage);
            if (!append) {
                await fetchUnreadCount();
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            if (append) {
                setIsFetchingMore(false);
            } else {
                setLoading(false);
            }
        }
    }, [user, supabase, fetchUnreadCount]);

    const requestPushPermission = async () => {
        if (!user || typeof window === 'undefined' || !('Notification' in window)) return;

        // Check for missing Firebase config
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_APP_ID) {
            console.warn('[NotificationsContext] Firebase keys missing. Push notifications disabled.');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const firebaseConfig = {
                    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
                    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
                };

                const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
                const messaging = getMessaging(app);

                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                });

                if (token) {
                    await fetch('/api/notifications/fcm-token', {
                        method: 'POST',
                        body: JSON.stringify({ token, deviceType: 'web' }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                    setPushEnabled(true);
                    localStorage.setItem('notifications:push', 'true');
                    toast.success('Push notifications enabled!');
                }
            }
        } catch (error) {
            console.error('Error enabling push notifications:', error);
            // Don't show toast error on every boot if it fails quietly
        }
    };

    // Initial fetch
    useEffect(() => {
        if (!user) return;
        fetchNotifications({ append: false, targetPage: 0 });
        
        const storedPush = localStorage.getItem('notifications:push');
        if (storedPush === 'true') {
            requestPushPermission();
        }
    }, [user, fetchNotifications]);

    // Real-time subscription
    useEffect(() => {
        if (!user) return;

        if (subscriptionRef.current) {
            supabase.removeChannel(subscriptionRef.current);
        }

        const channel = supabase
            .channel('notifications-updates')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                const newNotification = payload.new;
                setNotifications(prev => {
                    if (prev.some(n => n.id === newNotification.id)) return prev;
                    return [newNotification, ...prev];
                });
                setUnreadCount(prev => prev + (newNotification.is_read ? 0 : 1));
                
                if (soundEnabled && audioRef.current) {
                    audioRef.current.play().catch(e => console.log('Audio play failed', e));
                }
                
                if (toastEnabled) {
                    toast(newNotification.title, {
                        icon: '🔔',
                        duration: 4000
                    });
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                const updated = payload.new;
                setNotifications(prev => {
                    const existing = prev.find(n => n.id === updated.id);
                    const wasUnread = existing && !existing.is_read;
                    const isUnread = !updated.is_read;
                    if (wasUnread !== isUnread) {
                        setUnreadCount(count => Math.max(0, count + (isUnread ? 1 : -1)));
                    }
                    return prev.map(n => n.id === updated.id ? updated : n);
                });
            })
            .subscribe();

        subscriptionRef.current = channel;

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [user, supabase, soundEnabled, toastEnabled]);

    const markAsRead = async (id) => {
        let shouldDecrement = false;
        setNotifications(prev => prev.map(n => {
            if (n.id !== id) return n;
            if (!n.is_read) shouldDecrement = true;
            return n.is_read ? n : { ...n, is_read: true };
        }));
        if (shouldDecrement) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);
                
            if (error) throw error;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            await refresh();
        }
    };

    const markAllAsRead = async () => {
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
            await refresh();
        }
    };

    const loadMore = async () => {
        if (!hasMore || isFetchingMore) return;
        await fetchNotifications({ append: true, targetPage: page + 1 });
    };

    const refresh = useCallback(async () => {
        await fetchNotifications({ append: false, targetPage: 0 });
    }, [fetchNotifications]);

    const updatePreferences = ({ sound, toast: toastPref, push }) => {
        const nextSound = typeof sound === 'boolean' ? sound : soundEnabled;
        const nextToast = typeof toastPref === 'boolean' ? toastPref : toastEnabled;
        const nextPush = typeof push === 'boolean' ? push : pushEnabled;

        setSoundEnabled(nextSound);
        setToastEnabled(nextToast);
        
        if (push === true && !pushEnabled) {
            requestPushPermission();
        } else if (push === false && pushEnabled) {
            setPushEnabled(false);
            localStorage.setItem('notifications:push', 'false');
        }

        persistNotificationPrefs(nextSound, nextToast, nextPush);
    };

    return (
        <NotificationsContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            pushEnabled,
            isFetchingMore,
            hasMore,
            soundEnabled,
            toastEnabled,
            markAsRead,
            markAllAsRead,
            loadMore,
            refresh,
            updatePreferences,
            requestPushPermission
        }}>
            <audio ref={audioRef} src="/sounds/notification.mp3" className="hidden" />
            {children}
        </NotificationsContext.Provider>
    );
};
