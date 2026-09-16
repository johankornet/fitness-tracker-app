import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function BrandHeader() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/android-icon-foreground.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.name}>StriveGen</Text>
      <Text style={styles.tagline}>Train smarter. Eat better. Evolve.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 72, height: 72, marginBottom: 12 },
  name: { color: colors.textPrimary, fontSize: 28, fontWeight: '700', letterSpacing: 0.5 },
  tagline: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
});
