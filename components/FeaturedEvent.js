import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import getFeaturedEventForToday from '../utils/getFeaturedEventForToday';
import { logEvent } from '../utils/analytics';
import { UserContext } from '../contexts/UserContext'; // Optional: if user profile is available

export default function FeaturedEvent() {
    const { name, image, link } = getFeaturedEventForToday();
    const [loading, setLoading] = useState(false);
    const { userProfile } = useContext(UserContext); // Optional: assumes context is set up

    const handlePress = async () => {
        if (loading || !link) return; // ✅ prevent double-tap

        try {
            setLoading(true);

            // ✅ log analytics before opening
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const userId = userProfile?.id || 'guest'; // or any fallback
            await logEvent('featured_event_tap', {
                eventName: name,
                date: today,
                userId: userId,
            });

            // ✅ open in-app browser
            await WebBrowser.openBrowserAsync(link);
        } catch (err) {
            console.error('Error opening link or logging event:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableOpacity onPress={handlePress} disabled={loading}>
            <View style={styles.container}>
                <Text style={styles.title}>🔥 Tonight's Featured Event</Text>
                <Image source={image} style={styles.image} />
                <Text style={styles.eventName}>{name}</Text>
                {loading && <ActivityIndicator size="small" color="#00CFFF" style={{ marginTop: 10 }} />}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 20, alignItems: 'center' },
    title: { fontSize: 20, color: '#fff', marginBottom: 10 },
    image: { width: '100%', height: 200, borderRadius: 12 },
    eventName: { fontSize: 18, color: '#aaa', marginTop: 8 },
});
