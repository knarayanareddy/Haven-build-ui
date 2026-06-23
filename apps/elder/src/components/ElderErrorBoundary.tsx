import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ElderErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[HAVEN Elder] Uncaught render error:', error);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A2B4C', padding: 40, gap: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' }}>
            Applicatiefout
          </Text>
          <Text style={{ fontSize: 16, color: '#94A3B8', textAlign: 'center' }}>
            Er is een onverwachte fout opgetreden. Herstart de huidige weergave.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Herstart weergave"
            onPress={this.handleReset}
            style={{ minHeight: 48, borderRadius: 20, backgroundColor: '#4A90D9', paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 }}
          >
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>
              Herstart weergave
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
