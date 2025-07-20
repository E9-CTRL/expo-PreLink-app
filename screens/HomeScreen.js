import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FusionNavBar from '../components/FusionNavBar';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useEffect } from 'react';
import JoinModal from '../components/JoinModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRsvpState } from '../hooks/useRsvpState';


const SPACING = 12;
const CIRCLE_SIZE = 80;
const RECT_HEIGHT = 72;
const FEATURE_HEIGHT = 160;
const HOT_HEIGHT = 110;
const TAB_CIRCLE = 44;

const HomeScreen = ({ route, navigation, eventData, setEventData, hostedEvent, setHostedEvent, userProfile }) => {
    const { rsvpEvent, loading } = useRsvpState();

    useEffect(() => {
        if (route.params?.hostedEvent) {
            if (typeof setHostedEvent === 'function') {
                setHostedEvent(route.params.hostedEvent);
            }
        }
    }, [route.params?.hostedEvent]);

    // ✅ Load RSVP event from storage
    const loadRsvpEvent = async () => {
        try {
            const storedRsvp = await AsyncStorage.getItem('rsvpEvent');
            if (storedRsvp) {
                const parsed = JSON.parse(storedRsvp);
                console.log('✅ RSVP restored on HomeScreen:', parsed.title);
            } else {
                console.log('ℹ️ No RSVP found in storage.');
            }
        } catch (error) {
            console.error('❌ Failed to load RSVP from storage:', error);
        }
    };

    useEffect(() => {
        if (hostedEvent) {
            console.log('📣 Hosted event loaded on app start:', hostedEvent.title);
        }
    }, [hostedEvent]);

    // ✅ NEW useEffect to trigger loadRsvpEvent on mount
    useEffect(() => {
        loadRsvpEvent(); // Restore RSVP
    }, []);

    const eventToShow =
        route?.params?.hostedEvent !== undefined
            ? route.params.hostedEvent
            : hostedEvent;

    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [selectedEvent, setselectedEvent] = useState(null);
    const [userRSVPEvent, setUserRSVPEvent] = useState(null);


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Top Icons with Glow and Notification Dot */}
                <View style={styles.headerRow}>
                    <View style={[styles.topIconGlow, { borderColor: '#00CFFF', shadowColor: '#00CFFF' }]}>
                        <Text style={[styles.topIconEmoji, { color: '#00CFFF' }]}>🔍</Text>
                    </View>
                    <View style={[styles.topIconGlow, { borderColor: '#D36CFF', shadowColor: '#D36CFF' }]}>
                        <Text style={[styles.topIconEmoji, { color: '#D36CFF' }]}>🔔</Text>
                        <View style={styles.notificationDot} />
                    </View>
                </View>

                {/* RSVP & Hosted Capsules */}
                <View style={{ marginTop: 12 }}>
                    {loading ? (
                        <Text style={{ color: '#00FFE5', marginBottom: 8 }}>Loading RSVP...</Text>
                    ) : rsvpEvent ? (
                        <View style={[styles.capsule, { borderColor: '#00FFE5', shadowColor: '#00FFE5' }]}>
                            <Text style={[styles.capsuleEmoji, { color: '#00FFE5' }]}>📍</Text>
                            <Text style={[styles.capsuleText, { color: '#00FFE5' }]}>{rsvpEvent.title}</Text>
                            <TouchableOpacity
                                style={[styles.capsuleButton, { borderColor: '#00FFE5' }]}
                                onPress={() => navigation.navigate('GuestConfirmation', { event: rsvpEvent })}
                            >
                                <Text style={[styles.capsuleButtonText, { color: '#00FFE5' }]}>See RSVP</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.capsule, { borderColor: '#00FFE5', shadowColor: '#00FFE5' }]}>
                            <Text style={[styles.capsuleEmoji, { color: '#00FFE5' }]}>📍</Text>
                            <Text style={[styles.capsuleText, { color: '#00FFE5' }]}>No RSVP yet</Text>
                            <TouchableOpacity
                                style={[styles.capsuleButton, { borderColor: '#00FFE5' }]}
                                onPress={() => navigation.navigate('NoRSVPEvent')}
                            >
                                <Text style={[styles.capsuleButtonText, { color: '#00FFE5' }]}>See RSVP</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={[styles.capsule, { borderColor: '#C770FF', shadowColor: '#C770FF', marginTop: SPACING }]}>
                    <Text style={[styles.capsuleEmoji, { color: '#C770FF' }]}>🎈</Text>
                    <Text style={[styles.capsuleText, { color: '#C770FF' }]}>
                        {eventToShow && eventToShow.title ? eventToShow.title : 'No hosted event yet'}
                    </Text>

                    <TouchableOpacity
                        style={[styles.capsuleButton, { borderColor: '#C770FF' }]}
                        onPress={() => {
                            if (eventToShow && eventToShow.title) {
                                navigation.navigate('Confirmation', {
                                    event: eventToShow,
                                });
                            } else {
                                navigation.navigate('NoHostedEvent');
                            }
                        }}
                    >
                        <Text style={[styles.capsuleButtonText, { color: '#C770FF' }]}>Manage My Event</Text>
                    </TouchableOpacity>
                </View>

                {/* Category Circles: Pres, Club, Afters */}
                <View style={styles.circleRow}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Map', { filter: 'Pres' })}
                        style={[styles.circleBase, { borderColor: '#FF4F91', shadowColor: '#FF4F91' }]}
                    >
                        <Text style={[styles.circleEmoji, { color: '#FF4F91' }]}>🍸</Text>
                        <Text style={[styles.circleLabel, { color: '#FF4F91' }]}>Pres</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Map', { filter: 'Club' })}
                        style={[styles.circleBase, { borderColor: '#A35BFF', shadowColor: '#A35BFF' }]}
                    >
                        <Text style={[styles.circleEmoji, { color: '#A35BFF' }]}>🎵</Text>
                        <Text style={[styles.circleLabel, { color: '#A35BFF' }]}>Club</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Map', { filter: 'Afters' })}
                        style={[styles.circleBase, { borderColor: '#00FFE5', shadowColor: '#00FFE5' }]}
                    >
                        <Text style={[styles.circleEmoji, { color: '#00FFE5' }]}>🌙</Text>
                        <Text style={[styles.circleLabel, { color: '#00FFE5' }]}>Afters</Text>
                    </TouchableOpacity>
                </View>

                <JoinModal
                    visible={joinModalVisible}
                    onClose={() => setJoinModalVisible(false)}
                    event={selectedEvent}
                    userProfile={userProfile}
                />

                {/* Featured Events */}
                <View style={[styles.glowBlockBlue, { height: FEATURE_HEIGHT, marginBottom: SPACING * 0.8 }]}>
                    <Text style={[styles.glowBlockText, { color: '#00CFFF' }]}>Featured Events</Text>
                </View>

                {/* What's Hot */}
                <View style={[styles.glowBlockBlue, { height: HOT_HEIGHT, marginBottom: SPACING * 0.8 }]}>
                    <Text style={[styles.glowBlockText, { color: '#00CFFF' }]}>What's Hot Right now</Text>
                </View>

                {/* AI + Friends */}
                <View style={[styles.squareRow, { marginTop: SPACING * 0.8 }]}>
                    <View style={styles.glowBlockPink}>
                        <Text style={[styles.glowBlockText, { color: '#D36CFF' }]}>🤖 Plan my night AI</Text>
                    </View>
                    <View style={styles.glowBlockPink}>
                        <Text style={[styles.glowBlockText, { color: '#D36CFF' }]}>🧍 Friends Activity</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        padding: SPACING,
        paddingBottom: 80,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING,
    },
    topIconGlow: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1.5,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
    },
    topIconEmoji: {
        fontSize: 22,
        fontWeight: '500',
    },
    notificationDot: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF4F4F',
        borderWidth: 1,
        borderColor: '#000',
    },
    capsule: {
        backgroundColor: '#000',
        borderWidth: 1.5,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 72,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 10,
    },
    capsuleEmoji: {
        fontSize: 22,
    },
    capsuleText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 10,
        marginRight: 10,
    },
    capsuleButton: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    capsuleButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    circleRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: SPACING + 6,
    },
    circleBase: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        borderWidth: 1.5,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 8,
        elevation: 6,
    },
    circleEmoji: {
        fontSize: 30,
    },
    circleLabel: {
        fontSize: 14,
        marginTop: 4,
        fontWeight: '600',
    },
    glowBlockBlue: {
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#00CFFF',
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#00CFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
        elevation: 10,
    },
    glowBlockPink: {
        width: '48%',
        height: RECT_HEIGHT,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#D36CFF',
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#D36CFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
        elevation: 10,
    },
    glowBlockText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    fullText: {
        color: '#cc66ff',
        fontWeight: '500',
        fontSize: 14,
    },
    squareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: SPACING,
        paddingBottom: SPACING + 4,
        backgroundColor: '#000',
        borderTopColor: '#222',
        borderTopWidth: 1,
    },
    navCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111',
        marginHorizontal: 4,
    },
    navIcon: {
        fontSize: 24,
        marginBottom: 2,
    },
    navLabel: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

export default HomeScreen;
