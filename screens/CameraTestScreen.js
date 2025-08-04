// src/screens/CameraTestScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';

export default function CameraTestScreen() {
    const [hasPermission, setHasPermission] = useState(null);
    const cameraRef = useRef(null);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    if (hasPermission === null) {
        return <View style={styles.center}><Text>Requesting camera permission…</Text></View>;
    }
    if (!hasPermission) {
        return <View style={styles.center}><Text>No access to camera</Text></View>;
    }

    return (
        <Camera style={styles.camera} ref={cameraRef}>
            <View style={styles.center}>
                <Text style={{ color: 'white' }}>📷 Hello from Camera!</Text>
            </View>
        </Camera>
    );
}

const styles = StyleSheet.create({
    camera: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});