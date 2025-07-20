import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Platform, Image } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import FusionNavBar from '../components/FusionNavBar';
import JoinModal from '../components/JoinModal';
import RSVPConfirmModal from '../components/RSVPConfirmModal';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native'
import EventPreviewModal from '../components/EventPreviewModal';


const nightMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];

export default function MapScreen({
    eventData,
    userProfile,
    hostedEvent,
    setEventData,
    setHostedEvent
}) {
    const route = useRoute();
    const { filter } = route.params || {};
    const activefilter = filter || 'All';
    const navigation = useNavigation();
    const [selectedType, setSelectedType] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false); // if not already there



    useEffect(() => {
        if (route.params?.filter) {
            setSelectedType(route.params.filter);
        }
    }, [route.params?.filter]);

    useFocusEffect(
        useCallback(() => {
            if (!route.params?.filter) {
                setSelectedType(null);
            }
        }, [route.params?.filter])
    );

    // ✅ Put this near the top of your return() JSX
    {
        selectedType === null && route.params?.filter && (
            <View style={{ flex: 1, backgroundColor: '#000' }} />
        )
    }

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [isNightMode, setIsNightMode] = useState(false);

    useEffect(() => {
        console.log('🧭 Filter from route:', route.params?.filter);
        console.log('🎯 Selected type state:', selectedType);
    }, [route.params?.filter, selectedType]);

    useEffect(() => {
        console.log('🪄 Selected event changed:', selectedEvent);
    }, [selectedEvent]);

    useEffect(() => {
        console.log('🧩 Modal visibility changed:', isModalVisible);
    }, [isModalVisible]);

    const handleFilter = (type) => {
        setSelectedType((prev) => (prev === type ? null : type));
    };

    const getPinColor = (type) => {
        switch (type) {
            case 'Pres': return 'orange';
            case 'Club': return 'blue';
            case 'Afters': return 'purple';
            default: return 'gray';
        }
    };

    const filteredEvents = selectedType
        ? eventData.filter((event) => event.type === selectedType)
        : eventData;

    return (
        <View style={styles.container}>
            <MapView
                key={selectedType} // 🔁 Forces remount when filter changes
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                customMapStyle={Platform.OS === 'android' && isNightMode ? nightMapStyle : []}
                initialRegion={{
                    latitude: 52.9548,
                    longitude: -1.1581,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                {filteredEvents.map((event) => (
                    <Marker
                        key={event.id}
                        coordinate={event.location}
                        pinColor={getPinColor(event.type)}
                        onPress={() => {
                            if (event.type !== 'Club') {
                                setSelectedEvent(event);     // Save the event
                                setShowPreview(true);
                            }
                        }}
                    >
                        <Callout tooltip>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>{event.title || 'Event'}</Text>
                                <Text style={styles.calloutText}>{event.type} • {event.time}</Text>

                                {event.type !== 'Club' && (
                                    <>
                                        <Text style={styles.calloutText}>Host: {event.hostName || 'Anonymous'}</Text>
                                        <Text style={styles.calloutText}>Location: {event.accommodation || 'N/A'}</Text>
                                        <Text style={styles.calloutText}>Capacity: {event.capacity || 'N/A'}</Text>
                                        {event.type === 'Pres' && (
                                            <Text style={styles.calloutText}>Going to: {event.destination || 'Unknown'}</Text>
                                        )}
                                        <Text style={styles.calloutText}>Music: {event.music || 'N/A'}</Text>
                                        <Text style={styles.calloutText}>Vibe: {event.vibe || 'N/A'}</Text>
                                        <Text style={styles.calloutText}>Dress: {event.dressCode || 'N/A'}</Text>
                                        <Text style={styles.calloutText}>Guests: {event.gender || 'Mixed'}</Text>
                                        <Text style={styles.calloutText}>Year: {event.year || 'Any'}</Text>
                                        <Text style={styles.calloutText}>
                                            Age: {event.minAge || '?'}–{event.maxAge || '?'}
                                        </Text>
                                    </>
                                )}

                                {event.type === 'Club' && (
                                    <>
                                        <Text style={styles.calloutText}>Welcome to {event.title}!</Text>
                                        <Text style={styles.calloutText}>Top venue for student nights in Nottingham.</Text>
                                        {event.imageUrl && (
                                            <Image source={{ uri: event.imageUrl }} style={styles.clubImage} />
                                        )}
                                    </>
                                )}
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            <TouchableOpacity
                onPress={() => navigation.navigate('Home')}
                style={styles.homeButton}
            >
                <Text style={styles.homeButtonText}>← Home</Text>
            </TouchableOpacity>

            {Platform.OS === 'android' && (
                <TouchableOpacity onPress={() => setIsNightMode(!isNightMode)} style={styles.nightModeToggle}>
                    <Text style={styles.nightModeIcon}>{isNightMode ? '☀️' : '🌙'}</Text>
                </TouchableOpacity>
            )}

            <View style={styles.filterContainer}>
                {['Afters', 'Pres', 'Club'].map((type) => (
                    <TouchableOpacity
                        key={type}
                        onPress={() => handleFilter(type)}
                        style={[
                            styles.filterButton,
                            selectedType === type && styles.selectedFilter,
                            { borderColor: getPinColor(type) },
                        ]}
                    >
                        <Text style={[styles.filterText, { color: getPinColor(type) }]}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <EventPreviewModal
                visible={showPreview}
                event={selectedEvent}
                onContinue={() => {
                    setShowPreview(false);
                    setTimeout(() => setShowJoinModal(true), 300); // open JoinModal after preview
                }}
                onClose={() => setShowPreview(false)}
            />

            <JoinModal
                event={
                    selectedEvent
                        ? {
                            ...selectedEvent,
                            date: selectedEvent?.date || '2025-06-22', // fallback
                        }
                        : null
                }
                visible={isModalVisible && !!selectedEvent} // ✅ Fix: modal only opens when user has tapped
                onClose={() => {
                    console.log('📍 Modal closed');
                    setModalVisible(false);
                    setSelectedEvent(null); // ✅ Clear event after closing
                }}
                userProfile={userProfile}
            />
        </View>
    );
} // ← closes MapScreen

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    filterContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        gap: 12,
    },
    filterButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    selectedFilter: {
        backgroundColor: '#1a1a1a',
    },
    filterText: {
        fontWeight: '600',
        fontSize: 14,
    },
    callout: {
        width: 220,
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
        elevation: 5,
    },
    calloutTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 5,
    },
    calloutText: {
        fontSize: 13,
        color: '#555',
        marginBottom: 3,
    },
    clubImage: {
        width: 180,
        height: 100,
        borderRadius: 8,
        marginTop: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 300,
        alignItems: 'center',
    },
    modalTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 10,
    },
    modalInfo: {
        fontSize: 14,
        marginBottom: 6,
        color: '#555',
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    confirmButton: {
        backgroundColor: '#FF9966',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    cancelButton: {
        backgroundColor: '#ccc',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    buttonText: {
        fontWeight: 'bold',
        color: '#fff',
    },
    nightModeToggle: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: '#000',
        padding: 12,
        borderRadius: 20,
        zIndex: 10,
    },
    nightModeIcon: {
        fontSize: 20,
        color: '#fff',
    },
    homeButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: '#222',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 14,
        borderColor: '#FF4F91',
        borderWidth: 1.5,
        shadowColor: '#FF4F91',
        shadowOpacity: 0.7,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
        zIndex: 10,
    },
    homeButtonText: {
        color: '#FF4F91',
        fontSize: 16,
        fontWeight: 'bold',
    },

});
