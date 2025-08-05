// VerificationScreen.js

import React, { useState, useLayoutEffect, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    Dimensions,
    ScrollView,
    Alert,
    Modal,
    Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import Orientation from 'react-native-orientation-locker';
import Icon from 'react-native-vector-icons/Feather';

// (stub imports — you'll need to install & configure these)
import scanFaces from 'vision-camera-face-detector';
import detectRectangles from 'react-native-vision-camera-rectangle-detector';

const { width } = Dimensions.get('window');
const BOX_RATIO = 0.8;    // width of box as % of screen
const BOX_ASPECT = 0.65;  // height/width ratio for cards
const BOX_SIZE = width * BOX_RATIO;
const BOX_HEIGHT = BOX_SIZE * BOX_ASPECT;

const SELFIE_OVAL_RATIO = 0.6; // % of width
const SELFIE_OVAL = width * SELFIE_OVAL_RATIO;

const DOC_OPTIONS = ['Passport', 'Provisional Licence', 'Full UK Licence'];
const DOC_TYPE_MAP = {
    Passport: 'passport',
    'Provisional Licence': 'provisionalLicence',
    'Full UK Licence': 'drivingLicence'
};
const API_URL = 'https://pre-link-verification-server.onrender.com/compare-faces';

export default function VerificationScreen({ navigation }) {
    useLayoutEffect(() => navigation.setOptions({ title: 'Document Verification' }), [navigation]);

    const cameraRef = useRef(null);
    const [docType, setDocType] = useState(DOC_OPTIONS[0]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [images, setImages] = useState({
        selfie: { uri: null, mode: null },
        idDoc: { uri: null, mode: null },
        ntuCard: { uri: null, mode: null },
    });
    const [loading, setLoading] = useState(false);
    const [cameraModal, setCameraModal] = useState(false);
    const [activeKey, setActiveKey] = useState(null);
    const [isAligned, setIsAligned] = useState(false);

    // pick the appropriate camera device
    const backDevice = useCameraDevice('back');
    const frontDevice = useCameraDevice('front');
    const activeDevice = activeKey === 'selfie' ? frontDevice : backDevice;

    // request perms
    const { hasPermission, requestPermission } = useCameraPermission();
    useEffect(() => {
        (async () => { await requestPermission(); })();
    }, []);

    // lock orientation when capturing documents (landscape), allow portrait for selfies
    useEffect(() => {
        if (cameraModal && activeKey !== 'selfie') {
            Orientation.lockToLandscape();
        } else {
            Orientation.unlockAllOrientations();
        }
        return () => Orientation.unlockAllOrientations();
    }, [cameraModal, activeKey]);

    // frame-processor: stub of rectangle/face detection
    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        if (activeKey === 'selfie') {
            const faces = scanFaces(frame);
            if (faces.length > 0) {
                // TODO: check if face bounding box fits within your oval overlay
                runOnJS(setIsAligned)(true);
            } else {
                runOnJS(setIsAligned)(false);
            }
        } else {
            const rects = detectRectangles(frame);
            if (rects.length > 0) {
                // TODO: check if card quad fits within your box overlay
                runOnJS(setIsAligned)(true);
            } else {
                runOnJS(setIsAligned)(false);
            }
        }
    }, [activeKey]);

    // open camera or gallery
    const pickImage = async (mode, key) => {
        if (mode === 'camera') {
            if (!hasPermission) return Alert.alert('No camera permission');
            setActiveKey(key);
            setIsAligned(false);
            setCameraModal(true);
        } else {
            const result = await ImagePicker.launchImageLibraryAsync({ quality: 1, mediaTypes: ImagePicker.MediaTypeOptions.Images });
            const asset = result.assets?.[0] || result;
            if (asset?.uri) {
                setImages(i => ({ ...i, [key]: { uri: asset.uri, mode } }));
            }
        }
    };

    // helper to append blobs
    async function appendBlob(form, key, file, filename) {
        const res = await fetch(file.uri);
        const blob = await res.blob();
        form.append(key, {
            uri: file.uri.startsWith('file://') ? file.uri : `file://${file.uri}`,
            name: filename,
            type: blob.type
        });
    }

    // submit all three images
    const handleSubmit = async () => {
        const labels = { selfie: 'Selfie', idDoc: 'ID Document', ntuCard: 'NTU Card' };
        for (let k of ['selfie', 'idDoc', 'ntuCard']) {
            if (!images[k].uri) return Alert.alert('Missing Image', `Please select an image for ${labels[k]}.`);
        }

        setLoading(true);
        try {
            const form = new FormData();
            await appendBlob(form, 'selfie', images.selfie, 'selfie.jpg');
            await appendBlob(form, 'ntuCardFront', images.ntuCard, 'ntu.jpg');
            const docField = docType === 'Passport' ? 'idCardFront' : 'driverLicenceFront';
            await appendBlob(form, docField, images.idDoc, `${docField}.jpg`);
            form.append('docType', DOC_TYPE_MAP[docType]);

            const resp = await fetch(API_URL, { method: 'POST', body: form });
            const result = await resp.json();
            navigation.navigate('VerifyScreen', { result });
        } catch (err) {
            Alert.alert('Network error', err.message);
        } finally {
            setLoading(false);
        }
    };


    function ImageSection({ label, imageKey }) {
        const { uri, mode } = images[imageKey];
        return (
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>{label}</Text>
                <View style={styles.row}>
                    {['camera', 'gallery'].map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[
                                styles.box,
                                uri && mode === t && styles.boxFilled,
                            ]}
                            onPress={() => pickImage(t, imageKey)}
                            disabled={loading}
                        >
                            {uri && mode === t
                                ? <Image source={{ uri }} style={styles.preview} />
                                : <Icon name={t === 'camera' ? 'camera' : 'image'} size={36} color="#416AF1" />
                            }
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {/* Document Type */}
                <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                        style={styles.dropdownHeader}
                        onPress={() => setDropdownOpen(o => !o)}
                        disabled={loading}
                    >
                        <Text style={styles.dropdownHeaderText}>{docType}</Text>
                        <Icon name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={20} />
                    </TouchableOpacity>
                    {dropdownOpen && DOC_OPTIONS.filter(o => o !== docType).map(opt => (
                        <TouchableOpacity
                            key={opt}
                            style={styles.dropdownItem}
                            onPress={() => { setDocType(opt); setDropdownOpen(false); }}
                            disabled={loading}
                        >
                            <Text style={styles.dropdownItemText}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ImageSection label="Selfie" imageKey="selfie" />
                <ImageSection label="ID Document" imageKey="idDoc" />
                <ImageSection label="NTU Card" imageKey="ntuCard" />
            </ScrollView>

            <TouchableOpacity style={styles.submit} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>SUBMIT</Text>}
            </TouchableOpacity>

            {/* —— CAMERA MODAL —— */}
            <Modal visible={cameraModal && activeDevice != null} animationType="slide">
                {activeDevice ? (
                    <View style={StyleSheet.absoluteFill}>
                        <Camera
                            ref={cameraRef}
                            style={StyleSheet.absoluteFill}
                            device={activeDevice}
                            isActive={true}
                            photo={true}
                            frameProcessor={frameProcessor}
                            frameProcessorFps={5}
                        />

                        {/* guide overlay */}
                        {activeKey === 'selfie'
                            ? <View style={[styles.selfieOval, isAligned && styles.greenOverlay]} />
                            : <View style={[styles.cardBox, isAligned && styles.greenOverlay]} />
                        }

                        {/* shutter + close */}
                        <View style={styles.camControls}>
                            <TouchableOpacity
                                onPress={async () => {
                                    if (!cameraRef.current) return Alert.alert('Camera not ready');
                                    try {
                                        const photo = await cameraRef.current.takePhoto();
                                        const uri = Platform.OS === 'ios'
                                            ? photo.path
                                            : 'file://' + photo.path;
                                        setImages(i => ({
                                            ...i,
                                            [activeKey]: { uri, mode: 'camera' }
                                        }));
                                        setCameraModal(false);
                                    } catch (e) {
                                        Alert.alert('Capture error', e.message);
                                    }
                                }}
                                style={styles.shutter}>
                                <View style={styles.shutterButton} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.closeCam} onPress={() => setCameraModal(false)}>
                                <Icon name="x" size={30} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : <Text>Loading camera…</Text>}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 20 },
    dropdownContainer: {},
    dropdownHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20
    },
    dropdownHeaderText: { fontSize: 16 },
    dropdownItem: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
    dropdownItemText: { fontSize: 16 },

    section: { marginBottom: 24 },
    sectionLabel: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },

    box: {
        width: BOX_SIZE * 0.48,
        height: BOX_SIZE * 0.48,
        borderWidth: 2, borderColor: '#416AF1',
        borderRadius: 8,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#F9FAFF'
    },
    boxFilled: { backgroundColor: '#E2E8FF' },
    preview: { width: '100%', height: '100%', borderRadius: 8 },

    submit: {
        height: 60, backgroundColor: '#416AF1',
        justifyContent: 'center', alignItems: 'center'
    },
    submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    // camera controls
    camControls: {
        position: 'absolute', bottom: 32, left: 0, right: 0,
        justifyContent: 'center', alignItems: 'center'
    },
    shutter: { marginBottom: 16 },
    shutterButton: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#fff', opacity: 0.8
    },
    closeCam: { position: 'absolute', top: 48, right: 24 },

    // overlays
    cardBox: {
        position: 'absolute',
        top: (Dimensions.get('window').height - BOX_HEIGHT) / 2,
        left: (width - BOX_SIZE) / 2,
        width: BOX_SIZE, height: BOX_HEIGHT,
        borderWidth: 2, borderColor: 'red', borderRadius: 12
    },
    selfieOval: {
        position: 'absolute',
        top: (Dimensions.get('window').height - SELFIE_OVAL) / 2,
        left: (width - SELFIE_OVAL) / 2,
        width: SELFIE_OVAL, height: SELFIE_OVAL,
        borderWidth: 2, borderColor: 'red', borderRadius: SELFIE_OVAL / 2
    },
    greenOverlay: {
        borderColor: 'lime',
    }
});
