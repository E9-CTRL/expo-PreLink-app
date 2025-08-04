// components/RetryModal.js
import React from 'react';
import { Modal, View, Text, Button, StyleSheet } from 'react-native';

export default function RetryModal({ visible, onRetry }) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.text}>Verification failed. Try again?</Text>
                    <Button title="Retry" onPress={onRetry} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modal: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
    },
    text: {
        marginBottom: 10,
        fontSize: 16,
    },
});
