// RSVPConfirmModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

const RSVPConfirmModal = ({ visible, onClose, event, guestInfo }) => {
    const navigation = useNavigation();

    const handleConfirm = async () => {
        try {
            await addDoc(collection(db, 'rsvps'), {
                eventId: event.id,
                ...guestInfo,
                timestamp: new Date().toISOString(),
            });

            onClose();
            navigation.navigate('GuestConfirmationScreen');
        } catch (error) {
            console.error('RSVP Error:', error);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Confirm Your RSVP</Text>
                    <Text style={styles.detail}>Name: {guestInfo?.name}</Text>
                    <Text style={styles.detail}>Year: {guestInfo?.year}</Text>
                    <Text style={styles.detail}>Gender: {guestInfo?.gender}</Text>
                    <TouchableOpacity style={styles.button} onPress={handleConfirm}>
                        <Text style={styles.buttonText}>Confirm RSVP</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000aa' },
    modal: { backgroundColor: '#111', padding: 20, borderRadius: 12, width: '85%' },
    title: { color: '#fff', fontSize: 18, marginBottom: 12, textAlign: 'center' },
    detail: { color: '#ccc', marginBottom: 8, fontSize: 16 },
    button: { backgroundColor: '#00CFFF', padding: 12, borderRadius: 10, marginTop: 10 },
    buttonText: { textAlign: 'center', color: '#000', fontWeight: 'bold' },
    cancel: { color: '#999', textAlign: 'center', marginTop: 10 },
});

export default RSVPConfirmModal;
