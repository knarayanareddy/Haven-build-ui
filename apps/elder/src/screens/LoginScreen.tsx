import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { fontFamily, typeScale, touch } from '@haven/ui/src/tokens';
import { useAuth } from '../auth/AuthProvider';

export function LoginScreen() {
  const { signInWithOtp, supabase } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp() {
    if (!phone.trim()) {
      setError('Vul uw telefoonnummer in');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithOtp(phone.trim());
      setStep('otp');
    } catch (e: any) {
      setError(e?.message ?? 'Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) {
      setError('Vul de verificatiecode in');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: otp.trim(),
        type: 'sms',
      });
      if (verifyError) throw verifyError;
      // Session is set via onAuthStateChange in AuthProvider — navigator will auto-redirect
    } catch (e: any) {
      setError(e?.message ?? 'Ongeldige code. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="heart-pulse" size={48} color="#4A7B5A" style={{ marginBottom: 12 }} />
          <Text style={styles.logo}>HAVEN</Text>
          <Text style={styles.tagline}>Uw veilige thuis</Text>
        </View>

        <Text style={styles.title}>
          {step === 'phone' ? 'Welkom bij HAVEN' : 'Verificatiecode'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'phone'
            ? 'Voer uw telefoonnummer in om in te loggen'
            : `We hebben een code gestuurd naar ${phone}`}
        </Text>

        {step === 'phone' ? (
          <TextInput
            style={styles.input}
            placeholder="+31 6 1234 5678"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            autoComplete="tel"
            value={phone}
            onChangeText={setPhone}
            editable={!loading}
          />
        ) : (
          <TextInput
            style={styles.input}
            placeholder="123456"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
            editable={!loading}
          />
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={step === 'phone' ? handleSendOtp : handleVerifyOtp}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={step === 'phone' ? 'Verstuur code' : 'Verifieer code'}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {step === 'phone' ? 'Verstuur code' : 'Verifiëren'}
            </Text>
          )}
        </TouchableOpacity>

        {step === 'otp' && (
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => { setStep('phone'); setOtp(''); setError(null); }}
            accessibilityRole="button"
            accessibilityLabel="Terug"
          >
            <Text style={styles.backLinkText}>← Ander nummer gebruiken</Text>
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
                  email: 'demo-elder@haven.nl',
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
            accessibilityRole="button"
            accessibilityLabel="Demo modus"
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
    backgroundColor: '#1A2B4C',
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
    fontSize: typeScale.caption,
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
    fontSize: typeScale.caption,
    fontFamily: fontFamily.regular,
    color: '#8BA4C4',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#2A3B5C',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A4B6C',
  },
  error: {
    color: '#FF6B6B',
    fontSize: typeScale.caption,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4A7B5A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: touch.minimum,
    justifyContent: 'center',
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
  backLink: {
    marginTop: 16,
    alignItems: 'center',
    minHeight: touch.minimum,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  backLinkText: {
    color: '#8BA4C4',
    fontSize: typeScale.caption,
  },
  demoButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A7B5A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    minHeight: touch.minimum,
    justifyContent: 'center',
  },
  demoButtonText: {
    color: '#4A7B5A',
    fontSize: typeScale.caption,
    fontWeight: '600',
    fontFamily: fontFamily.semiBold,
  },
});
