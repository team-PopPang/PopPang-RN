import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {colors} from '../foundation/colors';

export function PopPangSelectableChip({
  label,
  onPress,
  selected,
  variant = 'solid',
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
  variant?: 'soft' | 'solid';
}) {
  const soft = variant === 'soft';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.chip,
        soft ? styles.softChip : styles.solidChip,
        selected && (soft ? styles.softChipSelected : styles.solidChipSelected),
      ]}>
      <Text
        style={[
          styles.label,
          soft ? styles.softLabel : styles.solidLabel,
          selected && (soft ? styles.softLabelSelected : styles.solidLabelSelected),
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.gray3,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: {fontSize: 12},
  softChip: {borderRadius: 18, minHeight: 34, paddingHorizontal: 16},
  softChipSelected: {
    backgroundColor: colors.categoryOrange,
    borderColor: colors.orange,
  },
  softLabel: {color: colors.gray},
  softLabelSelected: {color: colors.orange},
  solidChip: {borderRadius: 17, height: 34, paddingHorizontal: 14},
  solidChipSelected: {backgroundColor: colors.orange, borderColor: colors.orange},
  solidLabel: {color: colors.gray, fontWeight: '500'},
  solidLabelSelected: {color: colors.white},
});
