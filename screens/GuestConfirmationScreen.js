import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, ImageBackground } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import * as Crypto from 'expo-crypto';
import { useNavigation, useRoute } from '@react-navigation/native'; // ✅ Make sure this is present

export default function GuestConfirmationScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const event = route.params?.event;

    if (!event) {
        console.warn('❌ No event passed to GuestConfirmationScreen');
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <Text style={{ color: 'white' }}>Something went wrong. No event data found.</Text>
            </View>
        );
    }

    console.log('⏳ GuestConfirmation event.startTimestamp:', event.startTimestamp);


    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {

        console.log('🔥 Raw startTimestamp:', event.startTimestamp);

        const target = new Date(event.startTimestamp);
        console.log('✅ Converted date:', target);


        if (isNaN(target.getTime())) {
            console.warn('⛔ Invalid date detected');
            setTimeLeft('Invalid Time');
            return;
        }

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
    }, [event.startTimestamp]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `🎉 I'm attending a ${event.type}!
${event.title} at ${event.time}.
Join me on Pre-Link!`,
            });
        } catch (error) {
            Alert.alert('Error', 'Could not share event');
        }
    };

    const handleCopy = async () => {
        try {
            const message = `🎉 I'm attending a ${event.type}!
${event.title} at ${event.time}.
Join me on Pre-Link!`;
            await Clipboard.setStringAsync(message);
            Alert.alert('Copied to Clipboard', 'Event link has been copied!');
        } catch (error) {
            Alert.alert('Error', 'Could not copy event');
        }
    };

    const handleCancel = async () => {
        Alert.alert(
            'Cancel RSVP',
            'Are you sure you want to cancel your RSVP to this event?',
            [
                {
                    text: 'No',
                    onPress: () => { },
                    style: 'cancel',
                },
                {
                    text: 'Yes',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'rsvps', `${event.id}_anon-user`));
                            if (setRSVPEvent) setRSVPEvent(null);
                            navigation.navigate('Home');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to cancel RSVP');
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <ImageBackground
            source={require('../assets/starfield.png')}
            resizeMode="cover"
            style={styles.background}
        >
            <TouchableOpacity
                onPress={() => navigation.navigate('MainTabs', {
                    screen: 'Home',
                    params: { rsvpEvent: event },
                })}
                style={styles.backArrow}
            >
                <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>

            <View style={styles.card}>
                <View style={styles.cardContent}>
                    <Text style={styles.title}>{event.title}</Text>

                    <View style={styles.infoRow}><Text style={styles.icon}>🙋</Text><Text style={styles.infoText}>Hosted by {event.hostName}</Text></View>
                    <View style={styles.infoRow}><Text style={styles.icon}>⏰</Text><Text style={styles.infoText}>{event.type} • {event.time}</Text></View>
                    <View style={styles.infoRow}>
                        <Text style={styles.icon}>📍</Text>
                        <Text style={styles.infoText}>
                            {typeof event.location === 'object'
                                ? event.location.label || `Lat: ${event.location.latitude}, Lng: ${event.location.longitude}`
                                : event.location}
                        </Text>
                    </View>
                    <View style={styles.infoRow}><Text style={styles.icon}>🎵</Text><Text style={styles.infoText}>Music: {event.music}</Text></View>
                    <View style={styles.infoRow}><Text style={styles.icon}>🪩</Text><Text style={styles.infoText}>Vibe: {event.vibe}</Text></View>
                    <View style={styles.infoRow}><Text style={styles.icon}>👗</Text><Text style={styles.infoText}>Dress Code: {event.dressCode}</Text></View>
                    <View style={styles.infoRow}><Text style={styles.icon}>🎯</Text><Text style={styles.infoText}>After this: {event.destinationClub}</Text></View>
                </View>
                <View style={styles.bottomRightBadge}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{event.type.toUpperCase()}</Text>
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
                        <QRCode
                            value={JSON.stringify({
                                eventId: event.id,
                                guestId: 'anon-user' // Replace with actual user ID if available
                            })}
                            size={120}
                            color="#00CFFF"
                            backgroundColor="transparent"
                        />
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
                    <Text style={styles.transparentButtonText}>Cancel RSVP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.transparentButton}
                    onPress={() => navigation.navigate('RSVPList', { event })}
                >
                    <Text style={styles.transparentButtonText}>See RSVPs</Text>
                </TouchableOpacity>
            </View>
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
        paddingBottom: 110,
    },
    card: {
        width: '90%',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#00CFFF',
        marginBottom: 20,
        marginTop: 100,
        marginHorizontal: 20,
        shadowColor: '#00CFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 10,
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
        borderRadius: 16,
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
        width: '90%',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingVertical: 12,
        padding: 16,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#00CFFF',
        marginBottom: 20,
        marginHorizontal: 20,
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

    qrBox: {
        backgroundColor: '#0a0a1f',
        borderRadius: 12,
        padding: 12,
        borderWidth: 2,
        borderColor: '#00CFFF',
        shadowColor: '#00CFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        alignItems: 'center',
        elevation: 8, // for Android
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


});
