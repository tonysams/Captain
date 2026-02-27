import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Camera Permission Required',
      'Instructor Buddy needs camera access to record skiing sessions. Please enable it in Settings.',
      [{ text: 'OK' }],
    );
    return false;
  }
  return true;
}

export async function requestMicrophonePermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Microphone Permission Required',
      'Instructor Buddy records audio with video for coaching context. Please enable it in Settings.',
      [{ text: 'OK' }],
    );
    return false;
  }
  return true;
}

export async function requestAllMediaPermissions(): Promise<boolean> {
  const camera = await requestCameraPermission();
  const mic = await requestMicrophonePermission();
  return camera && mic;
}
