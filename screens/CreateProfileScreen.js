import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Picker } from '@react-native-picker/picker';

const CreateProfileScreen = ({ onContinue }) => {
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [year, setYear] = useState('');
    const [campus, setCampus] = useState('');
    const [vibe, setVibe] = useState('');
    const [club, setClub] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [genderModalVisible, setGenderModalVisible] = useState(false);
    const genderOptions = ['Male', 'Female', 'Other'];
    const [yearModalVisible, setYearModalVisible] = useState(false);
    const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Master’s'];
    const [campusModalVisible, setCampusModalVisible] = useState(false);
    const campusOptions = ['City Campus', 'Clifton Campus', 'Brackenhurst Campus', 'Confetti Campus', 'Mansfield Hub'];
    const [usernameFocused, setUsernameFocused] = useState(false);
    const [courseFocused, setCourseFocused] = useState(false);
    const [ageFocused, setAgeFocused] = useState(false);
    const [vibeFocused, setVibeFocused] = useState(false);
    const [clubFocused, setClubFocused] = useState(false);
    const [bioFocused, setBioFocused] = useState(false);
    const [studyCycle, setStudyCycle] = useState('sept');
    const [course, setCourse] = useState('');
    const courseOptions = [
        'Accounting and Finance', 'Architecture', 'Biomedical Science',
        'Business Management', 'Computer Science', 'Criminology', 'Design',
        'Economics', 'Fashion Design', 'Law', 'Marketing', 'Mechanical Engineering',
        'Medicine', 'Psychology', 'Sociology', 'Sports Science', 'Zoology'
    ];



    const isValid = () => {
        if (!username || !gender || !year || !course || !campus) {
            Alert.alert('Missing Info', 'Please fill out all required fields.');
            return false;
        }
    };

    const memberSince = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const handleContinue = () => {
        if (!isValid()) return;

        const profileData = {
            username,
            gender,
            year,
            course,
            campus,
            vibe,
            club,
            bio,
            avatar,
            memberSince,
            studyCycle,
            course,
        };
        if (typeof onContinue === 'function') {
            onContinue(profileData);
        }
    };

    const formatTags = (input) => {
        return [...new Set(
            input
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
                .map(tag =>
                    tag
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ')
                )
        )].join(', ');
    };

    const pickAvatar = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    return (
        <KeyboardAwareScrollView
            style={{ backgroundColor: '#0B021D', flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
            enableOnAndroid={true}
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={60}
        >
            <Text style={styles.title}>Create Your Profile</Text>

            <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
                {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                    <Text style={styles.avatarText}>Tap to Upload Avatar</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.sectionHeader}>🔒 Mandatory Fields</Text>

            <TextInput
                value={username}
                onChangeText={setUsername}
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
                placeholder={usernameFocused ? '' : '👤 Username'}
                placeholderTextColor="rgb(14, 240, 228)"
                style={styles.input}
            />

            <TouchableOpacity onPress={() => setGenderModalVisible(true)} style={styles.input}>
                <Text style={{ color: gender ? 'white' : 'rgb(14, 240, 228)' }}>
                    🧬 {gender || 'Gender'} <Text style={{ color: '#00CFFF' }}>›</Text>
                </Text>
            </TouchableOpacity>



            <TouchableOpacity onPress={() => setYearModalVisible(true)} style={styles.input}>
                <Text style={{ color: year ? 'white' : 'rgb(14, 240, 228)' }}>
                    🎓 {year || 'Year of Study'} <Text style={{ color: '#00CFFF' }}>›</Text>
                </Text>
            </TouchableOpacity>

            <Text style={styles.label}>📅 Study Cycle</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={studyCycle}
                    style={styles.picker}
                    onValueChange={(itemValue) => setStudyCycle(itemValue)}
                >
                    <Picker.Item label="September Start" value="sept" />
                    <Picker.Item label="January Start" value="jan" />
                </Picker>
            </View>

            <Text style={styles.label}>📘 What do you study?</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={course}
                    style={styles.picker}
                    onValueChange={(itemValue) => setCourse(itemValue)}
                >
                    {courseOptions.map((item, index) => (
                        <Picker.Item key={index} label={item} value={item} />
                    ))}
                </Picker>
            </View>

            <TouchableOpacity onPress={() => setCampusModalVisible(true)} style={styles.input}>
                <Text style={{ color: campus ? 'white' : 'rgb(14, 240, 228)' }}>
                    🏫 {campus || 'Select Your Campus'} <Text style={{ color: '#00CFFF' }}>›</Text>
                </Text>
            </TouchableOpacity>

            <Text style={styles.sectionHeader}>🎨 Optional Fields</Text>

            <TextInput
                value={vibe}
                onChangeText={setVibe}
                onFocus={() => setVibeFocused(true)}
                onBlur={() => {
                    setVibeFocused(false);
                    setVibe(formatTags(vibe));
                }}
                placeholder={vibeFocused ? '' : '🎵 Music Preference e.g. R&B'}
                placeholderTextColor="rgb(188, 93, 198)"
                style={[styles.input, styles.optionalInput]}
            />
            <TextInput
                value={club}
                onChangeText={setClub}
                onFocus={() => setClubFocused(true)}
                onBlur={() => {
                    setClubFocused(false);
                    setClub(formatTags(club));
                }}
                placeholder={clubFocused ? '' : '🍸 Clubs or Events you enjoy e.g. Ink'}
                placeholderTextColor="rgb(188, 93, 198)"
                style={[styles.input, styles.optionalInput]}
            />
            <TextInput
                value={bio}
                onChangeText={setBio}
                onFocus={() => setBioFocused(true)}
                onBlur={() => setBioFocused(false)}
                placeholder={bioFocused ? '' : '📝  Bio'}
                placeholderTextColor="rgb(188, 93, 198)"
                multiline
                numberOfLines={3}
                style={[styles.input, styles.optionalInput, { height: 60 }]}
            />

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>

            {genderModalVisible && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        {genderOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    setGender(option);
                                    setGenderModalVisible(false);
                                }}
                                style={styles.modalOption}
                            >
                                <Text style={styles.modalText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setGenderModalVisible(false)} style={styles.modalCancel}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {yearModalVisible && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        {yearOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    setYear(option);
                                    setYearModalVisible(false);
                                }}
                                style={styles.modalOption}
                            >
                                <Text style={styles.modalText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setYearModalVisible(false)} style={styles.modalCancel}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {campusModalVisible && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        {campusOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    setCampus(option);
                                    setCampusModalVisible(false);
                                }}
                                style={styles.modalOption}
                            >
                                <Text style={styles.modalText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setCampusModalVisible(false)} style={styles.modalCancel}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0B021D',
        padding: 24,
        paddingBottom: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#00FFB2',
        textAlign: 'center',
        marginVertical: 24,
        textShadowColor: '#00FFB2',
        textShadowRadius: 6,
    },
    avatarContainer: {
        borderColor: '#00f6ff',
        borderWidth: 1.5,
        borderRadius: 80,
        height: 120,
        width: 120,
        alignSelf: 'center',
        marginBottom: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'rgb(7, 169, 161)',
        fontSize: 12,
        textAlign: 'center',
    },
    avatar: {
        height: 118,
        width: 118,
        borderRadius: 80,
    },
    sectionHeader: {
        color: '#FFD84D',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 2,
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#FFFFFF',
        marginBottom: 8,
        backgroundColor: '#0B021D',
        borderColor: 'rgb(27, 7, 141)',
    },
    optionalInput: {
        borderColor: 'rgba(104, 21, 176, 0.93)',
        backgroundColor: '#0B021D',
    },
    continueButton: {
        backgroundColor: '#00FFB2',
        paddingVertical: 16,
        borderRadius: 20,
        marginTop: 26,
        marginBottom: 16,
        alignItems: 'center',
    },
    continueText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    modalBox: {
        backgroundColor: '#1A103D',
        borderRadius: 16,
        padding: 20,
        width: '80%',
    },
    modalOption: {
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
    },
    modalText: {
        color: '#00CFFF',
        fontSize: 16,
    },
    modalCancel: {
        marginTop: 10,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#FF4F91',
        fontSize: 15,
    },

});

export default CreateProfileScreen;
