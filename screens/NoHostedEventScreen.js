// screens/NoHostedEventScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function NoHostedEventScreen() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            {/* Back Arrow */}
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })} style={styles.backArrow}>
                <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>

            {/* Balloon Icon */}
            <Text style={styles.balloon}>🎈</Text>

            {/* Primary Title */}
            <Text style={styles.title}>No Hosted Event</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>Use the Host tab to create your event</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        position: 'relative',
    },
    backArrow: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    balloon: {
        fontSize: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
    },
});
