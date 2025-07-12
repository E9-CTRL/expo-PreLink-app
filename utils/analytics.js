import * as Analytics from 'expo-firebase-analytics';

export async function logEvent(name, params = {}) {
    try {
        await Analytics.logEvent(name, params);
        console.log(`Logged event: ${name}`, params);
    } catch (error) {
        console.error('Analytics log error:', error);
    }
}
