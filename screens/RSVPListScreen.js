import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getVerifiedProfile } from '../functions/utils/firebaseHelpers';
import { auth } from '../firebase';

const RSVPListScreen = ({ route }) => {
    const { event } = route.params;
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifiedProfile, setVerifiedProfile] = useState(null);

    useEffect(() => {
        const loadVerified = async () => {
            try {
                const stored = await AsyncStorage.getItem('verifiedProfile');
                if (stored) {
                    setVerifiedProfile(JSON.parse(stored));
                }
            } catch (err) {
                console.error('RSVPList: failed to load verifiedProfile:', err);
            }
        };

        loadVerified();
    }, []);

    // ✅ Verified profile fallback logging
    useEffect(() => {
        if (verifiedProfile) {
            const { fullName, dob } = verifiedProfile;
            const age = Math.floor(
                (Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25)
            );
            console.log(`Verified age: ${age}, name: ${fullName}`);
        }
    }, [verifiedProfile]);

    useEffect(() => {
        const fetchRSVPs = async () => {
            try {
                const rsvpQuery = query(
                    collection(db, 'rsvps'),
                    where('eventId', '==', event.id)
                );
                const snapshot = await getDocs(rsvpQuery);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAttendees(data);
            } catch (e) {
                console.error('Error fetching RSVPs:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchRSVPs();
    }, [event.id]);

    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <Text style={styles.name}>👤 {item.name || 'Anonymous'}</Text>
            <Text style={styles.details}>🎓 Year: {item.year} | 🧑 {item.gender} | 🎂 {item.age}</Text>
            <Text style={styles.status}>{item.checkedIn ? '✅ Checked In' : '⏳ Not Yet Checked In'}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#fff" />
                {!attendees && (
                    <Text style={styles.emptyText}>Could not load RSVP data. Please try again.</Text>
                )}
            </View>
        );
    }

    if (!attendees.length) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>No RSVPs yet.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={attendees}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 32 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    backArrow: {
        position: 'absolute',
        top: 20,
        left: 16,
        padding: 8,
        zIndex: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#00CFFF',
        textAlign: 'center',
        marginBottom: 20,
    },
    list: {
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#000',
        borderWidth: 1.5,
        borderColor: '#00CFFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#00CFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
        elevation: 10,
    },
    name: {
        fontSize: 18,
        color: '#00CFFF',
        fontWeight: '600',
        marginBottom: 6,
    },
    detail: {
        fontSize: 14,
        color: '#00CFFF',
    },
    emptyText: {
        color: '#888',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
    name: {
        fontSize: 18,
        color: 'white',
        marginBottom: 4,
    },
    detail: {
        color: '#ccc',
    },
    checkedIn: {
        marginTop: 8,
        color: '#00FF88',
        fontWeight: 'bold',
    },
    notCheckedIn: {
        marginTop: 8,
        color: '#FFAA00',
        fontWeight: 'bold',
    },
    summaryBar: {
        marginBottom: 10,
        alignItems: 'center',
    },
    summaryText: {
        color: '#00CFFF',
        fontSize: 16,
        fontWeight: '600',
    },


});
