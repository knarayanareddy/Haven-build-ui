import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class GrandchildErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[HAVEN Family] Uncaught render error:', error);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.ink, padding: 40, gap: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.paper, textAlign: 'center' }}>
            Er ging iets mis
          </Text>
          <Text style={{ fontSize: 16, color: colors.pewter, textAlign: 'center' }}>
            De app heeft een fout ondervonden. Probeer opnieuw.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Probeer opnieuw"
            onPress={this.handleReset}
            style={{ minHeight: 48, borderRadius: 20, backgroundColor: colors.slateLight, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 }}
          >
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>
              Probeer opnieuw
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
