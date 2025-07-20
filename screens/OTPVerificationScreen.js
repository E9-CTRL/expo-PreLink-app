import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { app } from '../firebase'; // adjust path if needed

console.log('[INIT] OTPVerificationScreen loaded');

const functions = getFunctions(undefined, 'europe-west2');
const verifyOTP = httpsCallable(functions, 'verifyNTUCode');

export default function OTPVerificationScreen({ route, navigation }) {
    const { email } = route.params;
    const [code, setCode] = useState('');

    const handleVerify = async () => {
        console.log('[ACTION] Verifying OTP for email:', email);
        console.log('[INPUT] Code entered:', code);

        try {
            const res = await verifyOTP({ email, code });
            console.log('✅ Cloud function verifyNTUCode returned:', res.data);

            if (res.data?.token) {
                console.log('✅ OTP verified successfully, token received.');
                navigation.replace('VerificationScreen');
            } else {
                console.warn('⚠️ No token returned — OTP may be incorrect');
                Alert.alert('Error', 'Invalid verification code.');
            }
        } catch (err) {
            console.error('❌ OTP verification failed:', err);
            Alert.alert('Verification Failed', 'Check your code or try again.');
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, marginBottom: 20 }}>
                Enter the 6-digit code sent to {email}
            </Text>

            <TextInput
                keyboardType="number-pad"
                value={code}
                onChangeText={(text) => {
                    console.log('[INPUT] Code field updated:', text);
                    setCode(text);
                }}
                maxLength={6}
                placeholder="Enter verification code"
                style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 20,
                    width: '80%',
                    textAlign: 'center',
                    marginBottom: 20,
                    color: 'black'
                }}
            />

            <Button title="Confirm Code" onPress={handleVerify} />
        </View>
    );

}
