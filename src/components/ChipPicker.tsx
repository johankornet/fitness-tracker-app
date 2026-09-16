import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipPickerProps<T extends string> {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  allowClear?: boolean;
  clearLabel?: string;
}

export function ChipPicker<T extends string>({
  options,
  value,
  onChange,
  allowClear,
  clearLabel = 'Alles',
}: ChipPickerProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {allowClear && (
        <Pressable
          style={[styles.chip, value === null && styles.chipActive]}
          onPress={() => onChange(null)}
        >
          <Text style={[styles.chipText, value === null && styles.chipTextActive]}>{clearLabel}</Text>
        </Pressable>
      )}
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[styles.chip, value === opt.value && styles.chipActive]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[styles.chipText, value === opt.value && styles.chipTextActive]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.white },
});
