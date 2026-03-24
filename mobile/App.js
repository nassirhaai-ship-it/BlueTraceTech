import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// ─── Home Screen ────────────────────────────────────────────────────────────
function HomeScreen({ onScan }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.homeContainer}>
      <ExpoStatusBar style="auto" />

      {/* Background gradient simulation via overlay */}
      <View style={styles.bgOverlay} />

      {/* Logo area */}
      <View style={styles.logoArea}>
        {/* Hexagonal logo placeholder */}
        <Animated.View style={[styles.logoShield, { transform: [{ scale: pulse }] }]}>
          <Image
            source={require('./assets/logo-bluetrace.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={styles.brandName}>BlueTrace</Text>
        <Text style={styles.brandNameAccent}>Tech</Text>
        <Text style={styles.brandTagline}>Ecosystem of Intelligence</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Description */}
      <View style={styles.descArea}>
        <Text style={styles.descTitle}>Vérificateur de Certificats</Text>
        <Text style={styles.descText}>
          Scannez le QR Code d'un certificat d'authenticité BlueTrace Tech pour accéder à la traçabilité complète du lot aquacole en temps réel.
        </Text>
      </View>

      {/* Scan Button */}
      <TouchableOpacity style={styles.scanButton} onPress={onScan} activeOpacity={0.85}>
        <Text style={styles.scanButtonIcon}>⬡</Text>
        <Text style={styles.scanButtonText}>Scanner un Certificat</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>© 2026 BlueTrace Tech — Tous droits réservés</Text>
    </SafeAreaView>
  );
}

// ─── Scanner Screen ──────────────────────────────────────────────────────────
function ScannerScreen({ onBack }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const scanLine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Animated scan line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 220, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    // Check if the QR code leads to a BlueTrace certificate
    const isBlueTrace = data.includes('tracabilite') || data.includes('bluetrace') || data.includes('bluet');

    Alert.alert(
      isBlueTrace ? '✅ Certificat BlueTrace Tech Détecté' : '🔍 QR Code Détecté',
      isBlueTrace
        ? `Ce QR Code pointe vers un certificat d'authenticité.\n\nVoulez-vous consulter la traçabilité complète du lot ?`
        : `URL détectée :\n${data}\n\nVoulez-vous ouvrir ce lien ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => setScanned(false),
        },
        {
          text: isBlueTrace ? '🔍 Voir le Certificat' : '🌐 Ouvrir le lien',
          onPress: () => {
            Linking.openURL(data).catch(() =>
              Alert.alert('Erreur', 'Impossible d\'ouvrir ce lien.')
            );
            setScanned(false);
          },
        },
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permText}>Demande d'accès à la caméra…</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permText}>❌ Accès à la caméra refusé.</Text>
        <Text style={styles.permSubText}>Veuillez autoriser l'accès dans les paramètres de votre appareil.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <ExpoStatusBar style="auto" />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        {/* Top overlay */}
        <View style={[styles.overlayPart, { height: (height - 260) / 2 }]} />

        {/* Middle row */}
        <View style={{ flexDirection: 'row', height: 260 }}>
          <View style={[styles.overlayPart, { flex: 1 }]} />

          {/* Transparent cutout */}
          <View style={styles.cutout}>
            {/* Corner decorations */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Animated scan line */}
            <Animated.View
              style={[styles.scanLineAnim, { transform: [{ translateY: scanLine }] }]}
            />
          </View>

          <View style={[styles.overlayPart, { flex: 1 }]} />
        </View>

        {/* Bottom overlay */}
        <View style={[styles.overlayPart, { flex: 1 }]}>
          <Text style={styles.scanHint}>Positionnez le QR Code dans le cadre</Text>
          <Text style={styles.scanSubHint}>La détection est automatique</Text>

          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top bar */}
      <SafeAreaView style={styles.scannerTopBar}>
        <Text style={styles.scannerTitle}>BlueTrace Tech</Text>
        <Text style={styles.scannerSubTitle}>Scanner de Certificats</Text>
      </SafeAreaView>
    </View>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'scanner'

  if (screen === 'scanner') {
    return <ScannerScreen onBack={() => setScreen('home')} />;
  }

  return <HomeScreen onScan={() => setScreen('scanner')} />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  /* Home */
  homeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f8fafc',
  },
  logoArea: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
  },
  logoShield: {
    width: 150,
    height: 150,
    borderRadius: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#0891b2',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  logoImage: {
    width: 110,
    height: 110,
  },
  logoIcon: {
    fontSize: 52,
  },
  brandName: {
    fontSize: 40,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1.5,
    textTransform: 'uppercase',
  },
  brandNameAccent: {
    fontSize: 40,
    fontWeight: '900',
    color: '#0891b2',
    letterSpacing: -1.5,
    textTransform: 'uppercase',
    marginTop: -10,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 5,
    textTransform: 'uppercase',
    marginTop: 10,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#0891b2',
    borderRadius: 1,
    marginVertical: 28,
    opacity: 0.5,
  },
  descArea: {
    alignItems: 'center',
    marginBottom: 48,
    paddingHorizontal: 8,
  },
  descTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  descText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  scanButton: {
    backgroundColor: '#0891b2',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0891b2',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    marginBottom: 40,
  },
  scanButtonIcon: {
    fontSize: 22,
    color: '#fff',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  footer: {
    fontSize: 10,
    color: '#334155',
    letterSpacing: 1,
    textTransform: 'uppercase',
    position: 'absolute',
    bottom: 24,
  },

  /* Scanner */
  scannerContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scannerTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scannerSubTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0891b2',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  overlayPart: {
    width: '100%',
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cutout: {
    width: 260,
    height: 260,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#0891b2',
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanLineAnim: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#0891b2',
    opacity: 0.8,
    shadowColor: '#0891b2',
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  scanHint: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 32,
    letterSpacing: 0.3,
  },
  scanSubHint: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  backBtn: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0891b2',
  },
  backBtnText: {
    color: '#0891b2',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  /* Permissions */
  permContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  permSubText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
