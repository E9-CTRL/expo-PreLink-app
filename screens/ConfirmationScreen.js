import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, Share, ImageBackground
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRsvpState } from '../hooks/useRsvpState';
import { getVerifiedProfile } from '../functions/utils/firebaseHelpers';
import { auth } from '../firebase';


export default function ConfirmationScreen({ route, navigation, setHostedEvent, hostedEvent }) {
    const { event, resetForm } = route.params;
    const { rsvpEvent, loading } = useRsvpState();

    const [verifiedProfile, setVerifiedProfile] = useState(null);

    useEffect(() => {
        const loadVerified = async () => {
            const userId = auth.currentUser.uid;
            const data = await getVerifiedProfile(userId);
            setVerifiedProfile(data);
        };

        loadVerified();
    }, []);

    useEffect(() => {
        if (setHostedEvent && rsvpEvent) {
            setHostedEvent(rsvpEvent);
        } else if (event && setHostedEvent) {
            setHostedEvent(event); // fallback if someone passed event
        }
    }, [rsvpEvent]);

    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const activeEvent = rsvpEvent || event;
        if (!activeEvent) return;

        const target = new Date(activeEvent.startTimestamp);
        const interval = setInterval(() => {
            const now = new Date();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft('🎉 Event Started');
                clearInterval(interval);
                return;
            }

            const hours = String(Math.floor(diff / 1000 / 60 / 60)).padStart(2, '0');
            const mins = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
            const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

            setTimeLeft(`${hours} : ${mins} : ${secs}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [rsvpEvent]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `🎉 I'm hosting a ${rsvpEvent?.type || event?.type}!
${rsvpEvent?.title || event?.title} at ${rsvpEvent?.time || event?.time}.
Join me on Pre-Link!`,
            });
        } catch (error) {
            alert('Could not share event');
        }
    };

    const handleCopy = async () => {
        try {
            const message = `🎉 I'm hosting a ${rsvpEvent?.type || event?.type}!
${rsvpEvent?.title || event?.title} at ${rsvpEvent?.time || event?.time}.
Join me on Pre-Link!`;
            await Clipboard.setStringAsync(message);
            Alert.alert('Copied to Clipboard', 'Event link has been copied!');
        } catch (error) {
            alert('Could not copy event');
        }
    };

    const handleCancel = async () => {
        Alert.alert(
            'Cancel Event',
            'Are you sure you want to cancel this event?',
            [
                {
                    text: 'Yes',
                    onPress: async () => {
                        try {
                            const idToDelete = rsvpEvent?.id || event?.id;

                            await deleteDoc(doc(db, 'events', idToDelete));
                            await AsyncStorage.removeItem('hostedEventId');

                            if (setHostedEvent) setHostedEvent(null);

                            navigation.navigate('MainTabs', {
                                screen: 'Home',
                                params: { hostedEvent: null },
                            });
                        } catch (error) {
                            console.error('❌ Cancel failed:', error);
                            Alert.alert('Error', 'Failed to cancel event');
                        }
                    },
                },
                { text: 'No' },
            ],
            { cancelable: true }
        );
    };

    const activeEvent = rsvpEvent || event;

    if (loading || !activeEvent) {
        return <Text style={{ color: '#fff', padding: 20 }}>Loading RSVP...</Text>;
    }

    if (verifiedProfile) {
        const { fullName, dob } = verifiedProfile;
        const age = Math.floor(
            (Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25)
        );
        console.log(`Verified age: ${age}, name: ${fullName}`);
    }

    return (
        <ImageBackground
            source={require('../assets/starfield.png')}
            resizeMode="cover"
            style={styles.background}
        >
            <TouchableOpacity
                onPress={() =>
                    navigation.navigate('MainTabs', {
                        screen: 'Home',
                        params: { hostedEvent: activeEvent },
                    })
                }
                style={styles.backArrow}
            >
                <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>

            <View style={styles.container}>
                <View style={styles.card}>
                    <View style={styles.cardContent}>
                        <Text style={styles.title}>{activeEvent.title}</Text>

                        <View style={styles.infoRow}>
                            <Text style={styles.icon}>⏰</Text>
                            <Text style={styles.infoText}>{activeEvent.date} • {activeEvent.time}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.icon}>📍</Text>
                            <Text style={styles.infoText}>{typeof activeEvent.location === 'string' ? activeEvent.location : 'No location provided'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.icon}>🙋</Text>
                            <Text style={styles.infoText}>Hosted by {activeEvent.hostName}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.icon}>👥</Text>
                            <Text style={styles.infoText}>{activeEvent.rsvpCount} / {activeEvent.capacity}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.icon}>👗</Text>
                            <Text style={styles.infoText}>{activeEvent.dressCode}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.icon}>🎵</Text>
                            <Text style={styles.infoText}>{activeEvent.vibe}</Text>
                        </View>

                        <View style={styles.bottomRightBadge}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{activeEvent.type.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.countdownBox}>
                {timeLeft === '🎉 Event Started' ? (
                    <Text style={styles.eventStartedText}>{timeLeft}</Text>
                ) : (
                    <Text style={styles.countdownText}>{timeLeft}</Text>
                )}
            </View>

            <View style={styles.qrContainer}>
                <View style={styles.qrRow}>
                    <View style={styles.qrBox}>
                        <TouchableOpacity onPress={() => navigation.navigate('QRScanner')}>
                            <Text style={styles.qrScanText}>📷 Click here to scan guest QR code upon arrival</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.linkButtons}>
                    <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                        <Text style={styles.shareText}>🔗 Share Link</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                        <Text style={styles.shareText}>📋 Copy Link</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                <TouchableOpacity
                    style={styles.transparentButton}
                    onPress={handleCancel}
                >
                    <Text style={styles.transparentButtonText}>Cancel Event</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.transparentButton}
                    onPress={() => navigation.navigate('RSVPList', { event: activeEvent })}
                >
                    <Text style={styles.transparentButtonText}>See RSVPs</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.buttonPurple}
                onPress={() => {
                    if (resetForm) resetForm();
                    navigation.navigate('Home', { hostedEvent: activeEvent });
                }}
            >
                <Text style={styles.buttonText}>Back to Home</Text>
            </TouchableOpacity>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    backArrow: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 999,
    },
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 80,
    },
    card: {
        width: '95%',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#00CFFF',
        marginBottom: 20,
        marginTop: 40,
        shadowColor: '#00CFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 10,
        position: 'relative',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#00CFFF',
        marginBottom: 16,
    },
    cardContent: {
        paddingBottom: 12, // Give space above badge
    },

    bottomRightBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
    },
    badge: {
        backgroundColor: 'rgba(62, 245, 255, 0.74)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    icon: { marginRight: 8, fontSize: 16 },
    infoText: { color: '#00CFFF', fontSize: 22 },
    countdownBox: {
        width: '95%',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingVertical: 12,
        padding: 16,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#00CFFF',
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00CFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 10,
    },
    countdownText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#00CFFF',
        textAlign: 'center',
    },
    qrContainer: {
        alignItems: 'center',
        marginBottom: 20,
        paddingLeft: 20,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        width: '100%',
    },

    qrCaption: {
        color: '#ccc',
        fontSize: 14,
        marginTop: 10,
        textAlign: 'center',
    },
    qrInstruction: {
        color: '#00CFFF',
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        textAlign: 'center',
        maxWidth: 180,
        width: 120,
    },
    qrRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 20,
    },

    linkButtons: {
        marginLeft: 20,
        justifyContent: 'space-between',
        height: 120,
    },

    shareButton: {
        backgroundColor: '#111C',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#00CFFF',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 10,
        shadowColor: '#00CFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },

    copyButton: {
        backgroundColor: '#111C',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#00CFFF',
        paddingVertical: 10,
        paddingHorizontal: 12,
        shadowColor: '#00CFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },

    shareText: {
        color: '#00CFFF',
        fontWeight: '600',
        textAlign: 'center',
    },
    transparentButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // translucent background
        borderColor: '#00CFFF',              // neon blue border
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        margin: 10,
        shadowColor: '#00CFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
        elevation: 10, // Android
        alignItems: 'center',
        width: '44%',
    },

    transparentButtonText: {
        color: '#00CFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    eventStartedText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#00CFFF', // light green or your neon success color
        textAlign: 'center',
    },
    qrScanText: {
        color: '#00eaff',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
        padding: 20,
        borderRadius: 10,
        borderColor: '#00eaff',
        borderWidth: 1.5,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        shadowColor: '#00eaff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    }

});
