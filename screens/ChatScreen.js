import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChatScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Chat feature coming soon!</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050013',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#00CFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default ChatScreen;
