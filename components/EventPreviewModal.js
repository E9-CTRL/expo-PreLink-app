import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVerifiedProfile } from '../functions/utils/firebaseHelpers';
import { auth } from '../firebase';


const EventPreviewModal = ({ visible, event, onContinue, onClose }) => {
    const [verifiedProfile, setVerifiedProfile] = useState(null);


    useEffect(() => {
        const loadFromStorage = async () => {
            try {
                const stored = await AsyncStorage.getItem('verifiedProfile');
                if (stored) {
                    setVerifiedProfile(JSON.parse(stored));
                } else {
                    console.warn('⚠️ No verifiedProfile found in AsyncStorage');
                }
            } catch (err) {
                console.error('❌ Error loading verifiedProfile from storage:', err);
            }
        };

        loadFromStorage();
    }, []);

    if (!verifiedProfile) {
        return (
            <Modal visible={visible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.title}>Loading host info...</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.close}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }


    const {
        title,
        time,
        music,
        dress,
        gender,
        year,
        location,
        vibe,
        hostAvatar,
        capacity,
        minAge,
        maxAge,
    } = event;

    const { fullName, dob } = verifiedProfile;

    const computedAge = Math.floor(
        (Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25)
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>×</Text>
                        </TouchableOpacity>

                        {hostAvatar && (
                            <Image source={{ uri: hostAvatar }} style={styles.avatar} />
                        )}
                        <Text style={styles.hostedBy}>Host: {fullName}</Text>
                        <Text style={styles.detail}>🎂 Host Age: {computedAge}</Text>

                        <Text style={styles.title}>{title}</Text>

                        <Text style={styles.detail}>⏰ {time}</Text>
                        <Text style={styles.detail}>🎵 {music}</Text>
                        <Text style={styles.detail}>🧍 {dress}</Text>
                        <Text style={styles.detail}>👯 {gender}</Text>
                        <Text style={styles.detail}>🎓 Year: {year}</Text>
                        <Text style={styles.detail}>📍 Going to: {location}</Text>
                        <Text style={styles.detail}>🌀 Vibe: {vibe}</Text>
                        <Text style={styles.detail}>🎂 Age: {minAge}–{maxAge}</Text>
                        <Text style={styles.detail}>👥 Capacity: {capacity}</Text>

                        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
                            <Text style={styles.continueText}>Continue</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modal: {
        backgroundColor: '#111',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    content: {
        paddingBottom: 40,
    },
    closeButton: {
        alignSelf: 'flex-end',
    },
    closeText: {
        fontSize: 28,
        color: '#fff',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignSelf: 'center',
        marginVertical: 10,
    },
    hostedBy: {
        textAlign: 'center',
        color: '#aaa',
        fontSize: 14,
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0ff',
        textAlign: 'center',
        marginBottom: 12,
    },
    detail: {
        fontSize: 16,
        color: '#fff',
        marginVertical: 3,
    },
    continueButton: {
        marginTop: 20,
        backgroundColor: '#0ff',
        paddingVertical: 14,
        borderRadius: 10,
    },
    continueText: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#000',
        fontSize: 16,
    },
});

export default EventPreviewModal;
