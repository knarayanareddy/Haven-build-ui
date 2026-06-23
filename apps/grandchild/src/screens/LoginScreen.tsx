import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { fontFamily } from '@haven/ui/src/tokens';
import { useAuth } from '../auth/AuthProvider';

export function LoginScreen() {
  const { signInWithOtp, supabase } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp() {
    if (!emailOrPhone.trim()) {
      setError('Vul uw e-mail of telefoonnummer in');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithOtp(emailOrPhone.trim());
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
      const isPhone = !emailOrPhone.includes('@');
      const { error: verifyError } = await supabase.auth.verifyOtp({
        ...(isPhone ? { phone: emailOrPhone.trim() } : { email: emailOrPhone.trim() }),
        token: otp.trim(),
        type: isPhone ? 'sms' : 'email',
      });
      if (verifyError) throw verifyError;
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
          <MaterialCommunityIcons name="account-group" size={48} color="#2A7A6F" style={{ marginBottom: 12 }} />
          <Text style={styles.logo}>HAVEN</Text>
          <Text style={styles.tagline}>Verbonden met wie u liefheeft</Text>
        </View>

        <Text style={styles.title}>
          {step === 'input' ? 'Welkom' : 'Verificatiecode'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'input'
            ? 'Log in om het welzijn van uw familielid te volgen'
            : `We hebben een code gestuurd naar ${emailOrPhone}`}
        </Text>

        {step === 'input' ? (
          <TextInput
            style={styles.input}
            placeholder="e-mail of telefoonnummer"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
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
          onPress={step === 'input' ? handleSendOtp : handleVerifyOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {step === 'input' ? 'Verstuur code' : 'Verifiëren'}
            </Text>
          )}
        </TouchableOpacity>

        {step === 'otp' && (
          <TouchableOpacity style={styles.backLink} onPress={() => { setStep('input'); setOtp(''); setError(null); }}>
            <Text style={styles.backLinkText}>← Ander account gebruiken</Text>
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
                  email: 'demo-family@haven.nl',
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
    backgroundColor: '#1B3A4B',
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
    color: '#8BBAD4',
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
    color: '#8BBAD4',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#2A4A5B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A5A6B',
  },
  error: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2A7A6F',
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
    fontFamily: fontFamily.bold,
  },
  backLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#8BBAD4',
    fontSize: 14,
  },
  demoButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2A7A6F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  demoButtonText: {
    color: '#2A7A6F',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
});
