import { View, ScrollView, Pressable, Text, StyleSheet } from 'react-native';
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
  compact?: boolean;
  /** Render as equal-width columns filling the available width, instead of a scrollable row. */
  fill?: boolean;
}

export function ChipPicker<T extends string>({
  options,
  value,
  onChange,
  allowClear,
  clearLabel = 'Alles',
  compact,
  fill,
}: ChipPickerProps<T>) {
  const chips = (
    <>
      {allowClear && (
        <Pressable
          style={[
            styles.chip,
            compact && styles.chipCompact,
            fill && styles.chipFill,
            value === null && styles.chipActive,
          ]}
          onPress={() => onChange(null)}
        >
          <Text style={[styles.chipText, compact && styles.chipTextCompact, value === null && styles.chipTextActive]}>
            {clearLabel}
          </Text>
        </Pressable>
      )}
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[
            styles.chip,
            compact && styles.chipCompact,
            fill && styles.chipFill,
            value === opt.value && styles.chipActive,
          ]}
          onPress={() => onChange(opt.value)}
        >
          <Text
            style={[styles.chipText, compact && styles.chipTextCompact, value === opt.value && styles.chipTextActive]}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </>
  );

  if (fill) {
    return <View style={styles.rowFill}>{chips}</View>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4, alignItems: 'flex-start' },
  rowFill: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipCompact: { paddingHorizontal: 10, paddingVertical: 5 },
  chipFill: { flex: 1, borderRadius: 10 },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextCompact: { fontSize: 12 },
  chipTextActive: { color: colors.white },
});
