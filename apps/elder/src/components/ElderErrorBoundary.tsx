import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors, typeScale, touch } from '@haven/ui/src/tokens';

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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.slate, padding: 40, gap: 16 }}>
          <Text style={{ fontSize: typeScale.label, fontWeight: '900', color: colors.paper, textAlign: 'center' }}>
            Applicatiefout
          </Text>
          <Text style={{ fontSize: typeScale.caption, color: colors.pewter, textAlign: 'center' }}>
            Er is een onverwachte fout opgetreden. Herstart de huidige weergave.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Herstart weergave"
            onPress={this.handleReset}
            style={{ minHeight: touch.minimum, borderRadius: 20, backgroundColor: colors.brand, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center', marginTop: 8 }}
          >
            <Text style={{ color: colors.paper, fontSize: 20, fontWeight: '900' }}>
              Herstart weergave
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
