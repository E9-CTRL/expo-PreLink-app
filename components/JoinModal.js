import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVerifiedProfile } from '../functions/utils/firebaseHelpers';


const convertToTimestamp = (dateStr, timeStr) => {
  try {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const isoString = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    const result = new Date(isoString);
    if (isNaN(result.getTime())) throw new Error('Invalid date/time');
    return result;
  } catch (e) {
    console.warn('⛔ Timestamp parse error:', e.message);
    return new Date(); // fallback
  }
};

const JoinModal = ({ visible, onClose, event }) => {
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [verifiedProfile, setVerifiedProfile] = useState(null);


  useEffect(() => {
    if (typeof currentUser?.uid !== 'string') {
      console.warn('JoinModal: user not ready yet — skipping effect');
      return;
    }

    const loadVerified = async () => {
      try {
        const userId = currentUser.uid;
        const data = await getVerifiedProfile(userId);
        setVerifiedProfile(data);
      } catch (err) {
        console.error('JoinModal: failed to load verified profile:', err);
      }
    };

    loadVerified();
  }, [currentUser?.uid]);

  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfileFromStorage = async () => {
      try {
        const profileString = await AsyncStorage.getItem('userProfile');
        if (profileString) {
          const profile = JSON.parse(profileString);
          setYear(profile.year || '');
          setGender(profile.gender || '');
          setAge(profile.age || '');
        }
      } catch (err) {
        console.error('❌ Failed to load userProfile from AsyncStorage:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfileFromStorage();
  }, []);


  // ✅ Override age from verifiedProfile if dob exists
  if (verifiedProfile?.dob) {
    age = Math.floor(
      (Date.now() - new Date(verifiedProfile.dob)) / (1000 * 60 * 60 * 24 * 365.25)
    );
    console.log(`Verified age: ${age}, name: ${verifiedProfile.fullName}`);
  }

  const eventId = event?.id;

  const minAge = parseInt(event?.minAge ?? 18, 10);
  const maxAge = parseInt(event?.maxAge ?? 25, 10);
  const eventYear = event?.year ?? 'Any';
  const eventGender = event?.gender ?? 'Any';

  useEffect(() => {
    setError('');
  }, [visible]);

  const validateRSVP = () => {
    if (!year || !gender || !age) {
      return 'Missing required profile info.';
    }

    if (eventGender !== 'Mixed' && gender !== eventGender) {
      return `Only ${eventGender} guests allowed.`;
    }

    if (eventYear && eventYear !== year) {
      return `Only ${eventYear} year students can join.`;
    }

    if (minAge && age < minAge) {
      return `Must be at least ${minAge} years old.`;
    }

    if (maxAge && age > maxAge) {
      return `Must be under ${maxAge + 1} years old.`;
    }

    return null;
  };

  const handleConfirm = async () => {
    setShowErrors(true);
    setError('');
    setLoading(true);

    const reason = validateRSVP();
    if (reason) {
      setError(reason);
      setLoading(false);
      return;
    }

    try {
      const userId = auth.currentUser?.uid || 'anon-user';
      const rsvpRef = doc(db, 'rsvps', `${eventId}_${userId}`);
      const existing = await getDoc(rsvpRef);

      if (!__DEV__ && existing.exists()) {
        setError('You have already RSVP’d to this event.');
        setLoading(false);
        return;
      }

      let eventDate = event.date;
      const [timeString] = event.time.split(' ');
      const [hours] = timeString.split(':').map(Number);

      if (event.type === 'Afters' && hours >= 0 && hours < 6) {
        const original = new Date(`${event.date}T00:00:00`);
        const nextDay = new Date(original);
        nextDay.setDate(original.getDate() + 1);
        const yyyy = nextDay.getFullYear();
        const mm = String(nextDay.getMonth() + 1).padStart(2, '0');
        const dd = String(nextDay.getDate()).padStart(2, '0');
        eventDate = `${yyyy}-${mm}-${dd}`;
      }

      const startTimestamp = convertToTimestamp(eventDate, event.time);
      event.startTimestamp = startTimestamp.toISOString();

      await setDoc(rsvpRef, {
        year,
        gender,
        age,
        eventId,
        startTimestamp,
      });

      await AsyncStorage.setItem('rsvpEvent', JSON.stringify(event));
      setLoading(false);
      onClose();
      navigation.navigate('GuestConfirmation', { event });
    } catch (error) {
      console.error('❌ RSVP failed:', error);
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>Loading your profile...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>RSVP to {event?.title}</Text>
          <Text style={styles.info}>
            🎓 Year: {year} | 🧑 {gender} | 🎂 {age} y/o
          </Text>

          {showErrors && error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.5 }]}
            onPress={handleConfirm}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Submitting...' : 'Confirm RSVP'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000aa',
  },
  modal: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    width: '85%',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  info: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  error: {
    color: '#FF6B6B',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#00CFFF',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  buttonText: {
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
  },
  close: {
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 15,
  },
});

export default JoinModal;
