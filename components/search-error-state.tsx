import { Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

type SearchErrorStateProps = {
  message: string;
  onRetry: () => void;
  disabled?: boolean;
};

export function SearchErrorState({
  message,
  onRetry,
  disabled = false,
}: SearchErrorStateProps) {
  const tint = useThemeColor({}, "tint");
  const icon = useThemeColor({}, "icon");

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.message, { color: icon }]}>
        {message}
      </ThemedText>
      <Pressable
        style={[
          styles.retryButton,
          { borderColor: tint },
          disabled && styles.disabled,
        ]}
        onPress={onRetry}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Spróbuj ponownie"
      >
        <Text style={[styles.retryText, { color: tint }]}>
          Spróbuj ponownie
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 20,
    gap: 12,
  },
  message: {
    textAlign: "center",
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
