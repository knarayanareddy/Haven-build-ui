import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { fontFamily } from '@haven/ui/src/tokens';
import { useAuth } from '../auth/AuthProvider';

export function LoginScreen() {
  const { signInWithEmail, signInWithBiometric, isBiometricAvailable, supabase } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSendLink() {
    if (!email.trim()) {
      setError('Vul uw e-mailadres in');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? 'Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometric() {
    setLoading(true);
    setError(null);
    try {
      const success = await signInWithBiometric();
      if (!success) setError('Biometrische verificatie mislukt');
    } catch (e: any) {
      setError(e?.message ?? 'Verificatie mislukt.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="stethoscope" size={48} color="#4A90D9" style={{ marginBottom: 12 }} />
          <Text style={styles.logo}>HAVEN</Text>
          <Text style={styles.tagline}>Professioneel zorgportaal</Text>
        </View>

        <Text style={styles.title}>Inloggen</Text>
        <Text style={styles.subtitle}>
          {sent
            ? `Controleer uw e-mail (${email}) voor de inloglink`
            : 'Voer uw werkmail in om een inloglink te ontvangen'}
        </Text>

        {!sent && (
          <TextInput
            style={styles.input}
            placeholder="naam@zorgorganisatie.nl"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {!sent && (
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendLink}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verstuur inloglink</Text>
            )}
          </TouchableOpacity>
        )}

        {isBiometricAvailable && (
          <TouchableOpacity
            style={[styles.biometricButton, loading && styles.buttonDisabled]}
            onPress={handleBiometric}
            disabled={loading}
          >
            <Text style={styles.biometricText}>🔐 Inloggen met biometrie</Text>
          </TouchableOpacity>
        )}

        {sent && (
          <TouchableOpacity style={styles.backLink} onPress={() => { setSent(false); setError(null); }}>
            <Text style={styles.backLinkText}>← Ander e-mailadres gebruiken</Text>
          </TouchableOpacity>
        )}

        {(process.env.EXPO_PUBLIC_ENABLE_DEMO === 'true' || __DEV__) && (
          <TouchableOpacity
            style={[styles.demoButton, loading && styles.buttonDisabled]}
            onPress={async () => {
              setLoading(true);
              setError(null);
              try {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                  email: 'demo-carer@haven.nl',
                  password: 'HavenDemo2026!',
                });
                if (signInError) throw signInError;
              } catch (e: any) {
                setError(e?.message ?? 'Demo login mislukt');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <Text style={styles.demoButtonText}>Demo Mode</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C3E6B',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    fontFamily: fontFamily.bold,
    color: '#fff',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#8BA4C4',
    marginTop: 4,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    color: '#8BA4C4',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#3A4F7C',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4A5F8C',
  },
  error: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fontFamily.semiBold,
  },
  biometricButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A90D9',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  biometricText: {
    color: '#4A90D9',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.semiBold,
  },
  backLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#8BA4C4',
    fontSize: 14,
  },
  demoButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  demoButtonText: {
    color: '#4A90D9',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.semiBold,
  },
});
