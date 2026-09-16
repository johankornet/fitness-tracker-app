import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { lookupProductByBarcode, ProductNotFoundError } from '../src/api/openFoodFacts';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError(null);

    try {
      const product = await lookupProductByBarcode(result.data);
      router.replace({
        pathname: '/(tabs)/add',
        params: {
          name: product.name,
          calories: String(product.caloriesPer100g),
          protein: String(product.proteinPer100g),
          carbs: String(product.carbsPer100g),
          fat: String(product.fatPer100g),
          barcode: product.barcode,
        },
      });
    } catch (err) {
      setError(
        err instanceof ProductNotFoundError
          ? err.message
          : 'Kon product niet opzoeken. Controleer je internetverbinding.'
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
        <Text style={styles.message}>Camera-toestemming is nodig om barcodes te scannen.</Text>
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
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hint}>Richt de camera op de barcode van het product</Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Product opzoeken...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.button}
            onPress={() => {
              setError(null);
              setScanned(false);
            }}
          >
            <Text style={styles.buttonText}>Opnieuw scannen</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  message: { textAlign: 'center', fontSize: 16 },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
  },
  hint: { color: '#fff', marginTop: 16, fontSize: 14 },
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
    bottom: 40,
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
});
