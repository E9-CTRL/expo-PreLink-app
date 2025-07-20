import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ProgressBar } from 'react-native-paper';


const ProfileScreen = ({ navigation, userProfile }) => {

    if (!userProfile && __DEV__) {
        return null; // or a loading spinner if needed
    }

    const {
        avatar,
        username,
        age,
        year,
        gender,
        bio,
        vibe,
        club,
        hostedEvents = [],
        rsvpHistory = [],
        memberSince,
        course,
        campus,
        presAttended = 0,
        aftersAttended = 0,
        status = ''
    } = userProfile;


    const optionalFields = [vibe, club, bio, avatar]; // match names from userProfile
    const filledCount = optionalFields.filter(field => field && field !== '').length;
    const completion = filledCount / optionalFields.length;

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
                <Ionicons name="arrow-back" size={26} color="#00CFFF" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <TouchableOpacity onPress={() => console.log('Settings')} style={styles.settingsIcon}>
                        <Ionicons name="settings-outline" size={22} color="#00CFFF" />
                    </TouchableOpacity>

                    <View style={styles.topRow}>
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder} />
                        )}
                        <View style={styles.topInfo}>
                            <Text style={styles.username}>{username || 'User'}</Text>
                            <Text style={styles.subInfo}>
                                {year ? `${year} year` : '—'} | {age ? `${age} y/o` : '—'} | {gender || '—'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.label, { fontSize: 14 }]}>
                            {(course || '—').toUpperCase()}
                        </Text>
                        <Text style={styles.text}>{campus || '—'}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>BIO</Text>
                        <Text style={styles.text}>{bio || '—'}</Text>
                    </View>

                    {status ? (
                        <View style={styles.section}>
                            <Text style={styles.label}>STATUS</Text>
                            <Text style={styles.text}>"{status}"</Text>
                        </View>
                    ) : null}

                    <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>MUSIC PREFERENCE</Text>
                            <Text style={styles.text}>
                                {vibe ? vibe.split(' ').filter(Boolean).join(', ') : '—'}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { paddingLeft: 16 }]}>FAVOURITE EVENT</Text>
                            <Text style={[styles.text, { paddingLeft: 16 }]}>
                                {club ? club.split(' ').filter(Boolean).join(', ') : '—'}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>RSVP HISTORY</Text>
                            {hostedEvents.length > 0 ? (
                                hostedEvents.map((e, i) => (
                                    <Text key={i} style={styles.bullet}>{`• ${e}`}</Text>
                                ))
                            ) : (
                                <Text style={styles.text}>—</Text>
                            )}
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>TOP FRIENDS</Text>
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                                <View style={styles.friendCircle}><Text style={styles.friendInitials}>JD</Text></View>
                                <View style={styles.friendCircle}><Text style={styles.friendInitials}>MK</Text></View>
                                <View style={styles.friendCircle}><Text style={styles.friendInitials}>AY</Text></View>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>HOSTED EVENTS</Text>
                            {rsvpHistory.length > 0 ? (
                                rsvpHistory.map((e, i) => (
                                    <Text key={i} style={styles.bullet}>{`• ${e}`}</Text>
                                ))
                            ) : (
                                <Text style={styles.text}>—</Text>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>MEMBER SINCE</Text>
                            <Text style={styles.text}>{memberSince}</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>PROFILE COMPLETION</Text>
                        <ProgressBar
                            progress={completion}
                            color="#00CFFF"
                            style={styles.progressBar}
                        />
                        <Text style={styles.percentText}>
                            {Math.round(completion * 100)}%
                        </Text>
                    </View>
                    <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>PRES ATTENDED</Text>
                            <Text style={styles.text}>{presAttended}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { paddingLeft: 16 }]}>AFTERS ATTENDED</Text>
                            <Text style={[styles.text, { paddingLeft: 16 }]}>{aftersAttended}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};


export default ProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B021D',
    },
    scroll: {
        padding: 20,
        paddingTop: 20,
    },
    card: {
        backgroundColor: '#0B021D',
        borderColor: 'rgb(27, 7, 141)',
        borderWidth: 1.5,
        borderRadius: 20,
        padding: 20,
        shadowColor: 'rgb(27, 7, 141)',
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 10,
        marginTop: 65,
        flexGrow: 1,
        minHeight: '85%',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 55,
        borderColor: '#00CFFF',
        borderWidth: 2,
    },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 50,
        backgroundColor: '#333',
        borderColor: '#00CFFF',
        borderWidth: 2,
    },
    topInfo: {
        flex: 1,
        paddingLeft: 30,
        marginTop: 1
    },
    username: {
        color: '#00CFFF',
        fontSize: 24,
        fontWeight: 'bold',
        flexDirection: 'column',
    },
    subInfo: {
        color: '#00CFFF',
        fontSize: 16,
        marginTop: 4,
        flexDirection: 'column',
    },
    section: {
        marginVertical: 12,
        borderTopColor: '#202040',
        borderTopWidth: 1,
        paddingTop: 12,
    },
    label: {
        color: '#00CFFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 15,
    },
    bullet: {
        color: '#FFFFFF',
        fontSize: 15,
        marginLeft: 6,
        marginTop: 2,
    },
    link: {
        marginTop: 24,
        color: '#00CFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 50,
    },
    backArrow: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 20,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#111',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 6,
    },
    progressBarFill: {
        height: 8,
        backgroundColor: '#00CFFF',
        borderRadius: 10,
    },
    topFriend: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333',
    },
    settingsIcon: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    friendCircle: {
        width: 50,
        height: 50,
        borderRadius: 30,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: -3,
        marginTop: 2,
        borderWidth: 2,
        borderColor: '#00CFFF',
        shadowColor: '#00CFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    friendInitials: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        color: '#00CFFF',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    progressBar: {
        height: 10,
        borderRadius: 10,
        backgroundColor: '#222',
    },
    percentText: {
        color: '#fff',
        marginTop: 6,
        fontSize: 14,
    },

});
