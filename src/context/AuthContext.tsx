'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    profile: any;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            setProfile((current: any) => {
                if (JSON.stringify(current) === JSON.stringify(data)) return current;
                return data;
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted) {
                    const currentUser = session?.user ?? null;
                    setUser(currentUser);
                    if (currentUser) {
                        await fetchProfile(currentUser.id);
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔔 AuthContext Event:', event);
            if (!isMounted) return;

            const currentUser = session?.user ?? null;

            setUser(prev => {
                if (prev?.id === currentUser?.id) return prev;
                return currentUser;
            });

            if (currentUser) {
                await fetchProfile(currentUser.id);
            } else {
                setProfile(null);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);
