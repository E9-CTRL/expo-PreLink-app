import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { app } from '../firebase';

console.log('[INIT] EmailEntryScreen module loaded');

const functions = getFunctions(app, 'europe-west2');
const sendOTP = httpsCallable(functions, 'sendNTUVerificationCode');

export default function EmailEntryScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleSendCode = async () => {
    console.log('[ACTION] Send Code button pressed');
    console.log('[INPUT] Raw email input:', email);

    const trimmedEmail = email.trim();
    const lowerEmail = trimmedEmail.toLowerCase();

    console.log('[PROCESS] Trimmed + lowercased email:', lowerEmail);

    const isStudentEmail = /^[a-z0-9._%+-]+@my\.ntu\.ac\.uk$/.test(lowerEmail);

    if (!isStudentEmail) {
      console.warn('[VALIDATION] Not an NTU student email:', lowerEmail);
      Alert.alert('Invalid Email', 'Please use your NTU student email address.');
      return;
    }

    try {
      console.log('[CALL] Calling sendNTUVerificationCode function with:', lowerEmail);
      await sendOTP({ email: lowerEmail });
      console.log('✅ OTP successfully sent to:', lowerEmail);
      console.log('[NAV] Navigating to OTPVerificationScreen with email:', lowerEmail);
      navigation.navigate('OTPVerificationScreen', { email: lowerEmail });
    } catch (err) {
      console.error('❌ Failed to send OTP:', err);
      Alert.alert('Error', 'Could not send verification code. Try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.label}>Enter your NTU Email</Text>
          <TextInput
            value={email}
            onChangeText={(text) => {
              console.log('[INPUT] Email text updated:', text);
              setEmail(text);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="e.g. N1069788@my.ntu.ac.uk"
            style={styles.input}
            keyboardType="email-address"
          />
          <Button title="Send Verification Code" onPress={handleSendCode} />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderRadius: 8,
    fontSize: 16,
  },
});
