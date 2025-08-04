import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import HostScreen from './screens/HostScreen';
import MapScreen from './screens/MapScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import GuestConfirmationScreen from './screens/GuestConfirmationScreen';
import NoHostedEventScreen from './screens/NoHostedEventScreen';
import RSVPListScreen from './screens/RSVPListScreen';
import CreateProfileScreen from './screens/CreateProfileScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatScreen from './screens/ChatScreen';
import FusionNavBar from './components/FusionNavBar';
import { Ionicons } from '@expo/vector-icons';
import NoRSVPEventScreen from './screens/NoRSVPEventScreen';
import QRScannerScreen from './screens/QRScannerScreen';
import VerificationScreen from './screens copy/VerificationScreen';
import EmailEntryScreen from './screens/EmailEntryScreen';
import OTPVerificationScreen from './screens/OTPVerificationScreen';
import VerifyScreen from './screens/VerifyScreen';



console.log('🧪 Loaded VerificationScreen is:', typeof VerificationScreen);
console.log('[ENTRY] AppNavigator loaded');



const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator({ userProfile, eventData, setEventData, hostedEvent, setHostedEvent, rsvpEvent, setRSVPEvent }) {

    return (
        <Tab.Navigator
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <FusionNavBar {...props} />}
        >
            <Tab.Screen
                name="Home"
                children={(props) => (
                    <HomeScreen
                        {...props}
                        eventData={eventData}
                        setEventData={setEventData}
                        hostedEvent={hostedEvent}
                        setHostedEvent={setHostedEvent}
                        userProfile={userProfile}
                        rsvpEvent={rsvpEvent}
                        setRSVPEvent={setRSVPEvent}
                    />
                )}
            />
            <Tab.Screen
                name="Host"
                children={(props) => (
                    <HostScreen
                        {...props}
                        userProfile={userProfile}
                        hostedEvent={hostedEvent}
                        setHostedEvent={setHostedEvent}
                    />
                )}
            />
            <Tab.Screen
                name="Map"
                children={(props) => (
                    <MapScreen
                        {...props}
                        eventData={eventData}
                        setEventData={setEventData}
                        hostedEvent={hostedEvent}
                        setHostedEvent={setHostedEvent}
                        userProfile={userProfile}
                    />
                )}
            />
            <Tab.Screen
                name="Chat"
                children={(props) => (
                    <ChatScreen {...props} userProfile={userProfile} hostedEvent={hostedEvent} />
                )}
            />
            <Tab.Screen
                name="Profile"
                children={(props) => (
                    <ProfileScreen {...props} userProfile={userProfile} />
                )}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator({ userProfile, eventData, setEventData, hostedEvent, setHostedEvent, rsvpEvent, setRSVPEvent }) {
    console.log('[RENDER] AppNavigator rendered');
    console.log('📦 VerificationScreen reference is:', VerificationScreen);

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs">
                {() => (
                    <TabNavigator
                        userProfile={userProfile}
                        eventData={eventData}
                        setEventData={setEventData}
                        hostedEvent={hostedEvent}
                        setHostedEvent={setHostedEvent}
                        rsvpEvent={rsvpEvent}
                        setRSVPEvent={setRSVPEvent}
                    />
                )}
            </Stack.Screen>
            <Stack.Screen name="EmailEntryScreen" component={EmailEntryScreen} options={{ title: 'NTU Email Login' }} />
            <Stack.Screen name="OTPVerificationScreen" component={OTPVerificationScreen} options={{ title: 'Enter Code' }} />
            <Stack.Screen name="VerificationScreen" component={VerificationScreen} />
            <Stack.Screen name="VerifyScreen" component={require('./screens/VerifyScreen').default} />
            <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
            <Stack.Screen name="NoHostedEvent" component={NoHostedEventScreen} />
            <Stack.Screen name="NoRSVPEvent" component={NoRSVPEventScreen} />
            <Stack.Screen name="Confirmation">
                {(props) => (
                    <ConfirmationScreen
                        {...props}
                        hostedEvent={hostedEvent}
                        setHostedEvent={setHostedEvent}
                    />
                )}
            </Stack.Screen>
            <Stack.Screen name="GuestConfirmation">
                {(props) => (
                    <GuestConfirmationScreen
                        {...props}
                        userProfile={userProfile}
                    />
                )}
            </Stack.Screen>
            <Stack.Screen name="RSVPList">
                {(props) => (
                    <RSVPListScreen {...props} hostedEvent={hostedEvent} />
                )}
            </Stack.Screen>
            <Stack.Screen name="QRScanner">
                {(props) => (
                    <QRScannerScreen {...props} hostedEvent={hostedEvent} />
                )}
            </Stack.Screen>
        </Stack.Navigator>
    );
}
