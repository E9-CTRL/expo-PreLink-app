import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity, Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Keyboard, Alert } from 'react-native';
import { auth } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';



const HostScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { setHostedEvent } = route.params || {};
    const { hostedEvent } = route.params || {};

    const [type, setType] = useState(null);
    const [title, setTitle] = useState('');
    const [address, setAddress] = useState('');
    const [time, setTime] = useState('');
    const [capacity, setCapacity] = useState('');
    const [vibe, setVibe] = useState('');
    const [dressCode, setDressCode] = useState('');
    const [music, setMusic] = useState('');
    const [gender, setGender] = useState('');
    const [club, setClub] = useState('');
    const [years, setYears] = useState([]); // Multi-select array
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');

    const [verifiedProfile, setVerifiedProfile] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const stored = await AsyncStorage.getItem('verifiedProfile');
                if (stored) {
                    setVerifiedProfile(JSON.parse(stored));
                }
            } catch (err) {
                console.error('⚠️ Failed to load verified profile in HostScreen:', err);
            }
        };

        loadProfile();
    }, []);

    const hostName = verifiedProfile?.fullName || 'Host';
    const age = verifiedProfile?.dob
        ? Math.floor((Date.now() - new Date(verifiedProfile.dob)) / (1000 * 60 * 60 * 24 * 365.25))
        : '';
    const userGender = verifiedProfile?.gender || '';

    const getGlowColor = (type) => {
        switch (type) {
            case 'Pres': return '#FF4F91';
            case 'Afters': return '#00CFFF';
            default: return '#ccc';
        }
    };

    const convertTo24Hour = (timeStr) => {
        const [time, modifier] = timeStr.trim().split(' ');
        let [hours, minutes] = time.split(':');
        if (modifier.toLowerCase() === 'pm' && hours !== '12') hours = String(parseInt(hours, 10) + 12);
        if (modifier.toLowerCase() === 'am' && hours === '12') hours = '00';
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
    };

    const handleSubmit = async () => {
        if (hostedEvent) {
            Alert.alert('Already Hosting', 'You’ve already hosted an event. Cancel it before creating a new one.');
            return;
        }

        Keyboard.dismiss();

        const requiredFields = { type, title, address, time, capacity, gender, club };
        for (const [key, value] of Object.entries(requiredFields)) {
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                Alert.alert('Missing info', `Please fill the "${key}" field properly.`);
                return;
            }
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const fullDateTime = new Date(`${todayStr}T${convertTo24Hour(time)}`);
        if (fullDateTime < now) fullDateTime.setDate(fullDateTime.getDate() + 1);
        if (isNaN(fullDateTime.getTime())) {
            Alert.alert('Invalid time', 'Please enter a valid time like "8:30 PM".');
            return;
        }

        const newEventId = uuid.v4();
        const userId = auth.currentUser?.uid || 'dev-user';

        const event = {
            id: newEventId,
            type,
            title,
            time,
            location: address,
            startTimestamp: fullDateTime.toISOString(),
            hostName,
            capacity: parseInt(capacity),
            vibe,
            dressCode,
            music,
            gender,
            year: years,
            ageRange: { min: parseInt(minAge) || 0, max: parseInt(maxAge) || 99 },
            hostId: userId,
            destination: type === 'Pres' ? club : '',
            rsvpCount: 0,
        };

        try {
            await setDoc(doc(db, 'events', event.id), event);
            await AsyncStorage.setItem('hostedEventId', event.id);
            if (setHostedEvent) setHostedEvent(event);
            resetForm();
            navigation.navigate('Confirmation', { event });
        } catch (e) {
            console.error('🔥 Host event failed:', e);
            Alert.alert('Error', 'Could not save event.');
        }
    };

    const resetForm = () => {
        setType(null);
        setTitle('');
        setAddress('');
        setTime('');
        setCapacity('');
        setVibe('');
        setDressCode('');
        setMusic('');
        setGender('');
        setClub('');
        setYears([]);
        setMinAge('');
        setMaxAge('');
    };

    return (
        <KeyboardAwareScrollView
            style={{ backgroundColor: '#000', flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
            enableOnAndroid={true}
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={60}
        >
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.typeRow}>
                {['Pres', 'Afters'].map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[
                            styles.typeButton,
                            type === item && {
                                borderColor: getGlowColor(item),
                                shadowColor: getGlowColor(item),
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.8,
                                shadowRadius: 10,
                                backgroundColor: '#000',
                            },
                        ]}
                        onPress={() => setType(item)}
                    >
                        <Text style={[styles.typeText, { color: getGlowColor(item) }]}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {type && (
                <>
                    <TextInput style={styles.input} placeholder="Event Title" value={title} onChangeText={setTitle} />
                    <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
                    <TextInput style={styles.input} placeholder="Time (e.g. 8:30 PM)" value={time} onChangeText={setTime} />
                    <Text style={styles.autoInfo}>👤 {hostName} | 🧑 {userGender} | 🎂 {age}</Text>
                    <TextInput style={styles.input} placeholder="Max Guests" keyboardType="numeric" value={capacity} onChangeText={setCapacity} />
                    <TextInput style={styles.input} placeholder="Vibe (e.g. Chill, Wild)" value={vibe} onChangeText={setVibe} />
                    <TextInput style={styles.input} placeholder="Dress Code (optional)" value={dressCode} onChangeText={setDressCode} />
                    <TextInput style={styles.input} placeholder="Music Type (optional)" value={music} onChangeText={setMusic} />
                    <TextInput style={styles.input} placeholder="Gender (Male, Female, Mixed)" value={gender} onChangeText={setGender} />
                    {type === 'Pres' && (
                        <TextInput style={styles.input} placeholder="Club Destination" value={club} onChangeText={setClub} />
                    )}
                    <TextInput style={styles.input} placeholder="Min Age (18+)" value={minAge} onChangeText={setMinAge} />
                    <TextInput style={styles.input} placeholder="Max Age (≤25)" value={maxAge} onChangeText={setMaxAge} />
                    <TextInput
                        style={styles.input}
                        placeholder="Years (e.g. 1,2,3)"
                        value={years.join(',')}
                        onChangeText={(text) => setYears(text.split(',').map((y) => y.trim()))}
                    />

                    <TouchableOpacity onPress={handleSubmit} style={styles.hostButton}>
                        <Text style={styles.hostButtonText}>🎉 Host Event</Text>
                    </TouchableOpacity>
                </>
            )}
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    heading: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    typeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 70,
        marginBottom: 24,
        gap: 16,
    },
    typeButton: {
        borderWidth: 2,
        borderColor: '#555',
        borderRadius: 999,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: '#111',
    },
    typeText: {
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#444',
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
        color: '#fff',
        backgroundColor: '#111',
    },
    hostButton: {
        backgroundColor: '#FF4F91',
        padding: 14,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#FF4F91',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
        marginTop: 20,
        marginBottom: 30,
    },
    hostButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#FF4F91',
        shadowColor: '#FF4F91',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        backgroundColor: '#000',
    }
});



export default HostScreen;
