// hooks/useRsvpState.js
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useRsvpState = () => {
    if (typeof useEffect !== 'function') {
        throw new Error('🚨 useEffect is not available — React not fully loaded or circular import detected');
    }

    const [rsvpEvent, setRsvpEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRSVP = async () => {
            try {
                const storedRsvp = await AsyncStorage.getItem('rsvpEvent');
                if (storedRsvp) {
                    setRsvpEvent(JSON.parse(storedRsvp));
                    console.log('✅ Restored RSVP:', storedRsvp);
                }
            } catch (err) {
                console.warn('RSVP load error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRSVP();
    }, []);

    return { rsvpEvent, loading };
};
