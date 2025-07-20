// screens/VerifyScreen.js
import React, { useState } from 'react'
import {
    View,
    Button,
    Alert,
    ActivityIndicator,
    StyleSheet
} from 'react-native'
import RetryModal from '../components/RetryModal'

// 1️⃣ Declare your code→message mapping at the top
const USER_MESSAGES = {
    FACE_MATCH_LOW_SCORE: 'Face match too low – please retry in better lighting.',
    OCR_TEXT_TOO_BLURRY: 'Document text unreadable – please hold the camera steady.',
    NAME_MISMATCH: 'Name on ID didn’t match your profile – contact support.',
    // …etc
}

export default function VerifyScreen() {
    const [loading, setLoading] = useState(false)
    const [retryModalVisible, setRetryModal] = useState(false)
    const [retryMessage, setRetryMessage] = useState('')

    const performVerification = async () => {
        setLoading(true)
        try {
            // … build FormData and POST …

            const json = await resp.json()

            if (json.success) {
                Alert.alert('✅ Verified!', 'All checks passed.')
            } else {
                // 2️⃣ Pick the best message: mapped or fallback
                const msg = USER_MESSAGES[json.code] || json.message || 'Unknown error'

                if (json.retryable) {
                    setRetryMessage(msg)
                    setRetryModal(true)
                } else {
                    Alert.alert('❌ Verification failed', msg)
                }
            }
        } catch (err) {
            Alert.alert('⚠️ Network error', err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            {loading
                ? <ActivityIndicator size="large" />
                : <Button title="Start Verification" onPress={performVerification} />
            }

            <RetryModal
                visible={retryModalVisible}
                message={retryMessage}
                onRetry={() => {
                    setRetryModal(false)
                    performVerification()
                }}
                onCancel={() => setRetryModal(false)}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 }
})
