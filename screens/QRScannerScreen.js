import React, { useState, useEffect, } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration } from 'react-native';
import { Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import CryptoJS from 'crypto-js';

const QR_SECRET = 'prelink-secret-key';

const QRScannerScreen = () => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [scanCount, setScanCount] = useState(0);
    const [sound, setSound] = useState();
    const navigation = useNavigation();
    const { hostedEvent } = props;


    useEffect(() => {
        const getPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
            if (__DEV__) console.log('📷 Camera permission status:', status);
        };
        getPermissions();
    }, []);

    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    useEffect(() => {
        return sound ? () => sound.unloadAsync() : undefined;
    }, [sound]);

    const playBeep = async () => {
        const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/beep.mp3'));
        setSound(sound);
        await sound.playAsync();
    };

    const decryptQR = (data) => {
        const bytes = CryptoJS.AES.decrypt(data, QR_SECRET);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decrypted);
    };

    const handleBarCodeScanned = async ({ data }) => {
        setScanned(true);
        if (__DEV__) console.log('📥 Encrypted QR data:', data);

        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/sounds/beep.mp3') // ✅ adjust path if needed
            );
            setSound(sound);
            await sound.playAsync();
        } catch (error) {
            console.warn('🔇 Beep sound failed:', error);
        }

        try {
            const { eventId, guestId } = decryptQR(data);

            if (!hostedEvent || eventId !== hostedEvent.id) {
                Alert.alert('❌ Wrong Event', 'This QR code is not for your current event.');
                setScanned(false);
                return;
            }

            const q = query(
                collection(db, 'rsvps'),
                where('eventId', '==', eventId),
                where('guestId', '==', guestId)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                Alert.alert('❌ Not Found', 'No matching RSVP found for this guest.');
            } else {
                const rsvpDoc = snapshot.docs[0];
                const rsvpData = rsvpDoc.data();

                if (rsvpData.checkedIn) {
                    Alert.alert('⚠️ Already Checked In', `${rsvpData.name} has already been scanned.`);
                } else {
                    await rsvpDoc.ref.update({ checkedIn: true });
                    Alert.alert('✅ Guest Confirmed', `${rsvpData.name} has successfully RSVP’d!`);
                    setScanCount((prev) => prev + 1);
                    if (__DEV__) console.log(`🟢 Guest ${guestId} (${rsvpData.name}) marked as checked in.`);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    await playBeep();
                }
            }
        } catch (err) {
            console.error('🔴 Error processing QR code:', err);
            Alert.alert('Invalid QR Code', 'Could not read QR code.');
        }

        setTimeout(() => setScanned(false), 2000);
    };

    if (hasPermission === null) {
        return <Text style={styles.statusText}>Requesting camera permission...</Text>;
    }

    if (hasPermission === false) {
        return <Text style={styles.statusText}>Camera access denied.</Text>;
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <Camera
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                barCodeScannerSettings={{
                    barCodeTypes: [Camera.Constants.BarCodeType.qr],
                }}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.overlay}>
                <Text style={styles.scanText}>Scan guest QR code</Text>
                <Text style={styles.scanCount}>✅ Guests scanned: {scanCount}</Text>
            </View>
        </View>
    );
};

export default QRScannerScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    overlay: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#00eaff',
        shadowColor: '#00eaff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
    },
    scanText: {
        color: '#00eaff',
        fontSize: 18,
        fontWeight: '600',
    },
    scanCount: {
        color: '#ffffff',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
    },
    statusText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 100,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
    },
    backText: {
        color: '#00eaff',
        fontSize: 18,
    },
});
