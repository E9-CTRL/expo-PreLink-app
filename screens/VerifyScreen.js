// screens/VerifyScreen.js
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity
} from 'react-native';

export default function VerifyScreen({ route, navigation }) {
    const { result } = route.params || {};

    if (!result) {
        return (
            <View style={styles.container}>
                <Text style={styles.error}>No verification result found.</Text>
            </View>
        );
    }

    const {
        success,
        message,
        matches,
        similarities,
        extracted,
        utils
    } = result;

    const errorList = utils?.validation?.errors || [];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>{success ? '✅ Verification Passed' : '❌ Verification Failed'}</Text>

            <View style={styles.section}>
                <Text style={styles.title}>Face Match</Text>
                <Text style={styles.item}>Selfie ↔️ ID: {matches?.selfieToDoc ? '✅' : '❌'} ({similarities?.selfieToDoc?.toFixed(1)}%)</Text>
                <Text style={styles.item}>ID ↔️ NTU: {matches?.docToNTU ? '✅' : '❌'} ({similarities?.docToNTU?.toFixed(1)}%)</Text>
                <Text style={styles.item}>Selfie ↔️ NTU: {matches?.selfieToNTU ? '✅' : '❌'} ({similarities?.selfieToNTU?.toFixed(1)}%)</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.title}>Extracted Info</Text>
                <Text style={styles.item}>Name: {extracted?.name || '—'}</Text>
                <Text style={styles.item}>DOB: {extracted?.dob || '—'}</Text>
                <Text style={styles.item}>Expiry: {extracted?.expiry || '—'}</Text>
                <Text style={styles.item}>Document #: {extracted?.documentNumber || '—'}</Text>
                <Text style={styles.item}>NTU Name: {extracted?.ntuName || '—'}</Text>
            </View>

            {errorList.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.title}>Errors</Text>
                    {errorList.map((err, idx) => (
                        <Text key={idx} style={styles.error}>• {err}</Text>
                    ))}
                </View>
            )}

            <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
                <Text style={styles.buttonText}>← Back</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: '#fff',
        justifyContent: 'flex-start'
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20
    },
    section: {
        marginBottom: 24
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8
    },
    item: {
        fontSize: 15,
        marginBottom: 4
    },
    error: {
        color: 'red',
        fontSize: 14,
        marginBottom: 4
    },
    button: {
        marginTop: 16,
        padding: 14,
        backgroundColor: '#416AF1',
        alignItems: 'center',
        borderRadius: 6
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600'
    }
});
