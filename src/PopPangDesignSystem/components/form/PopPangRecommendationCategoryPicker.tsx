import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../../foundation/colors';
import {PopPangSelectableChip} from '../PopPangSelectableChip';
import {PopPangFieldTitle} from './PopPangFormControls';

export function PopPangRecommendationCategoryPicker({
  categories,
  onToggle,
  selectedIds,
}: {
  categories: readonly {id: number; name: string}[];
  onToggle: (id: number) => void;
  selectedIds: readonly number[];
}) {
  return (
    <View style={styles.field}>
      <PopPangFieldTitle required title="추천 카테고리" />
      {categories.length ? (
        <View style={styles.categoryList}>
          {categories.map(category => (
            <PopPangSelectableChip
              key={category.id}
              label={category.name}
              onPress={() => onToggle(category.id)}
              selected={selectedIds.includes(category.id)}
              variant="soft"
            />
          ))}
        </View>
      ) : (
        <View style={styles.loadingBox}>
          <Text style={styles.placeholder}>
            추천 카테고리를 불러오는 중입니다.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryList: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  field: {gap: 8},
  loadingBox: {
    backgroundColor: colors.white,
    borderColor: colors.gray3,
    borderRadius: 8,
    borderWidth: 0.8,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  placeholder: {color: colors.gray2, fontSize: 12},
});
