import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PhotoGuidelinesScreen = () => {
    const navigation = useNavigation();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Before You Upload Your Documents</Text>

            <Text style={styles.subtitle}>Follow these tips to ensure a successful verification:</Text>

            <Text style={styles.bullet}>✅ Take the photo in <Text style={styles.bold}>portrait mode</Text></Text>
            <Text style={styles.bullet}>✅ Hold your phone <Text style={styles.bold}>directly above</Text> the document</Text>
            <Text style={styles.bullet}>✅ Make sure the <Text style={styles.bold}>entire document is visible</Text></Text>
            <Text style={styles.bullet}>✅ Avoid glare, shadows, or reflections</Text>
            <Text style={styles.bullet}>✅ Ensure all <Text style={styles.bold}>text is readable</Text></Text>
            <Text style={styles.bullet}>🚫 Do NOT crop or cut off any part of the ID</Text>

            <Text style={styles.sectionTitle}>Example Comparison:</Text>
            <View style={styles.imageRow}>
                <View style={styles.imageColumn}>
                    <Text style={styles.goodLabel}>✅ Good</Text>
                    <Image source={require('../assets/good-example.jpg')} style={styles.image} />
                </View>
                <View style={styles.imageColumn}>
                    <Text style={styles.badLabel}>❌ Bad</Text>
                    <Image source={require('../assets/bad-example.jpg')} style={styles.image} />
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Verification')}>
                <Text style={styles.buttonText}>Continue to Upload</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#000',
        flexGrow: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        marginBottom: 20,
    },
    bullet: {
        fontSize: 16,
        color: '#0ef0e4',
        marginBottom: 10,
    },
    bold: {
        fontWeight: 'bold',
        color: '#0ef0e4',
    },
    sectionTitle: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 10,
    },
    imageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    imageColumn: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    goodLabel: {
        color: '#00ff99',
        marginBottom: 5,
    },
    badLabel: {
        color: '#ff4444',
        marginBottom: 5,
    },
    image: {
        width: 150,
        height: 100,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0ef0e4',
    },
    button: {
        marginTop: 20,
        backgroundColor: '#0ef0e4',
        padding: 14,
        borderRadius: 8,
    },
    buttonText: {
        textAlign: 'center',
        color: '#000',
        fontWeight: 'bold',
    },
});

export default PhotoGuidelinesScreen;
