import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export const getVerifiedProfile = async (userId) => {
    try {
        const ref = doc(db, 'verifiedProfiles', userId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            return snap.data();
        } else {
            console.log('🔍 No verified profile found.');
            return null;
        }
    } catch (e) {
        console.error('❌ Error fetching verified profile:', e);
        return null;
    }
};
