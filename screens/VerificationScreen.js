import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
    ScrollView, Alert, Modal, Button
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';
import { useNavigation } from '@react-navigation/native';

const VerificationScreen = () => {
    const navigation = useNavigation();

    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState(null);
    const [ntuFront, setNtuFront] = useState(null);
    const [ntuBack, setNtuBack] = useState(null);
    const [govID, setGovID] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const [studyCycle, setStudyCycle] = useState('sept');
    const [onPlacement, setOnPlacement] = useState(false);
    const [placementYear, setPlacementYear] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    const formattedDOB = dob ? dob.toISOString().split('T')[0] : null;
    const age = dob ? Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25)) : null;

    const launchCamera = async (setter) => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission denied", "Camera access is required.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({ quality: 1 });
        if (!result.canceled) setter(result.assets[0].uri);
    };

    const launchPicker = async (setter) => {
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
        if (!result.canceled) setter(result.assets[0].uri);
    };

    const uploadImageToSupabase = async (uri, filename) => {
        try {
            const res = await fetch(uri);
            const blob = await res.blob();
            const path = `verification/${Date.now()}_${filename}`;
            const { error: uploadError } = await supabase.storage.from('verification').upload(path, blob);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('verification').getPublicUrl(path);
            return data.publicUrl;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const convertToBase64 = async (uri) => {
        const res = await fetch(uri);
        const blob = await res.blob();
        const buffer = await blob.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
    };

    const handleVerify = async () => {
        try {
            const selfieBase64 = await convertToBase64(selfie);
            const idCardBase64 = await convertToBase64(govID);

            const payload = {
                enteredName: fullName,
                enteredDOB: formattedDOB,
                selfieBase64,
                idCardBase64
            };

            const { data, error } = await supabase.functions.invoke('verifyIdentity', { body: payload });
            if (error) throw error;

            return data?.success;
        } catch (e) {
            console.error('Verification error:', e);
            return false;
        }
    };

    const handleSubmit = async () => {
        try {
            const ntuFrontUrl = await uploadImageToSupabase(ntuFront, 'ntuFront.jpg');
            const ntuBackUrl = await uploadImageToSupabase(ntuBack, 'ntuBack.jpg');
            const govIdUrl = await uploadImageToSupabase(govID, 'govID.jpg');
            const selfieUrl = await uploadImageToSupabase(selfie, 'selfie.jpg');

            const verified = await handleVerify();
            if (!verified) {
                Alert.alert('Verification failed');
                return;
            }

            const profile = {
                name: fullName,
                dob: formattedDOB,
                age,
                studyCycle,
                onPlacement,
                placementYear: onPlacement ? placementYear : null,
                verified: true,
                ntuFrontUrl,
                ntuBackUrl,
                govIdUrl,
                selfieUrl
            };

            const { error } = await supabase.from('verified_profiles').upsert(profile);
            if (error) throw error;

            await AsyncStorage.setItem('verifiedProfile', JSON.stringify(profile));
            navigation.navigate('CreateProfile');
        } catch (e) {
            console.error('Submit error:', e);
            Alert.alert('Error', e.message);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Verify Your Identity</Text>

            <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Legal Name"
                style={styles.input}
            />

            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text>{dob ? dob.toLocaleDateString('en-GB') : '🎂 Select DOB'}</Text>
            </TouchableOpacity>

            {showDatePicker && (
                <Modal transparent>
                    <View style={styles.modalContainer}>
                        <View style={styles.pickerBox}>
                            <DateTimePicker
                                value={dob || new Date()}
                                mode="date"
                                display="spinner"
                                onChange={(e, date) => { if (date) setDob(date); }}
                            />
                            <Button title="Done" onPress={() => setShowDatePicker(false)} />
                        </View>
                    </View>
                </Modal>
            )}

            {/* Upload Sections */}
            {[
                { label: "NTU Front", state: ntuFront, setter: setNtuFront },
                { label: "NTU Back", state: ntuBack, setter: setNtuBack },
                { label: "Gov ID", state: govID, setter: setGovID }
            ].map(({ label, state, setter }) => (
                <View key={label}>
                    <Text>{label}</Text>
                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => launchCamera(setter)}><Text>📸 Take Photo</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => launchPicker(setter)}><Text>📁 Pick Image</Text></TouchableOpacity>
                    </View>
                    {state && <Image source={{ uri: state }} style={styles.preview} />}
                </View>
            ))}

            <Text>Selfie</Text>
            <Button title="Take Selfie" onPress={() => launchCamera(setSelfie)} />
            {selfie && <Image source={{ uri: selfie }} style={styles.preview} />}

            <Text>Study Cycle</Text>
            <View style={styles.row}>
                <TouchableOpacity onPress={() => setStudyCycle('sept')}><Text>📚 September</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setStudyCycle('jan')}><Text>❄ January</Text></TouchableOpacity>
            </View>

            <Text>On Placement?</Text>
            <TouchableOpacity onPress={() => setOnPlacement(!onPlacement)}>
                <Text>{onPlacement ? '✅ Yes – Going into:' : '❌ No'}</Text>
            </TouchableOpacity>
            {onPlacement && (
                <TextInput
                    placeholder="e.g. 3rd Year"
                    style={styles.input}
                    value={placementYear}
                    onChangeText={setPlacementYear}
                />
            )}

            <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
                <Text style={styles.submitText}>Submit Verification</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 24, paddingBottom: 48 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    input: { borderWidth: 1, padding: 12, marginVertical: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
    preview: { width: 120, height: 120, borderRadius: 8, marginVertical: 10 },
    modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    pickerBox: { backgroundColor: 'white', margin: 20, borderRadius: 10, padding: 16 },
    submit: { backgroundColor: '#007AFF', padding: 16, borderRadius: 10, marginTop: 20, alignItems: 'center' },
    submitText: { color: 'white', fontWeight: 'bold' }
});

export default VerificationScreen;
