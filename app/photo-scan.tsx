import { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { estimateMealFromPhoto } from '../src/firebase/functions';

export default function PhotoScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  async function handleCapture() {
    if (!cameraRef.current || loading) return;
    setLoading(true);
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) throw new Error('Geen foto ontvangen van camera.');

      const rendered = await ImageManipulator.manipulate(photo.uri)
        .resize({ width: 800 })
        .renderAsync();
      const saved = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.7,
        base64: true,
      });

      if (!saved.base64) throw new Error('Kon foto niet verwerken.');

      const estimate = await estimateMealFromPhoto(saved.base64);

      router.replace({
        pathname: '/(tabs)/add',
        params: {
          name: estimate.foodName,
          calories: String(estimate.calories),
          protein: String(estimate.protein),
          carbs: String(estimate.carbs),
          fat: String(estimate.fat),
          photoConfidence: estimate.confidence,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Kon de foto niet analyseren. Probeer het opnieuw.'
      );
      setLoading(false);
    }
  }

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera-toestemming is nodig om een foto te maken.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Toestemming geven</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        ref={cameraRef}
        onCameraReady={() => setCameraReady(true)}
      />

      <View style={styles.overlay}>
        <Text style={styles.hint}>Maak een foto van je maaltijd</Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>AI analyseert je foto...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.button} onPress={() => setError(null)}>
            <Text style={styles.buttonText}>Opnieuw proberen</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && (
        <Pressable
          style={[styles.shutter, !cameraReady && styles.shutterDisabled]}
          onPress={handleCapture}
          disabled={!cameraReady}
        >
          <View style={styles.shutterInner} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  message: { textAlign: 'center', fontSize: 16 },
  overlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hint: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: '#fff', fontSize: 16 },
  errorBanner: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  errorText: { textAlign: 'center', color: '#111827' },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  shutter: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: { opacity: 0.4 },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});
