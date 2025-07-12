import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

const navItems = [
    { label: 'Home', icon: '🏠', route: 'Home', color: '#D36CFF' },
    { label: 'Map', icon: '📍', route: 'Map', color: '#FF4F91' },
    { label: 'Host', icon: '➕', route: 'Host', color: '#FFFFFF' },
    { label: 'Chat', icon: '💬', route: 'Chat', color: '#D36CFF' },
    { label: 'Profile', icon: '👤', route: 'Profile', color: '#A35BFF' },
];

export default function FusionNavBar({ state, descriptors, navigation }) {
    const currentRoute = state?.routes?.[state.index]?.name || '';

    const hiddenRoutes = ['Map', 'Host', 'Profile'];

    if (hiddenRoutes.includes(currentRoute)) {
        return null;
    }

    return (
        <View style={styles.container}>
            {navItems.map((item, index) => {
                const isActive = currentRoute === item.route;

                return (
                    <TouchableOpacity
                        key={item.label}
                        onPress={() => navigation.navigate(item.route)}
                        style={[
                            styles.navCircle,
                            {
                                borderColor: item.color,
                                shadowColor: isActive ? item.color : 'transparent',
                                shadowOpacity: isActive ? 0.8 : 0,
                            },
                        ]}
                    >
                        <Text style={[styles.icon, { color: item.color }]}>{item.icon}</Text>
                        <Text style={[styles.label, { color: item.color }]}>{item.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        backgroundColor: '#000',
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    navCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 8,
        elevation: 10,
        marginHorizontal: 4,
    },
    icon: {
        fontSize: 24,
        marginBottom: 2,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
