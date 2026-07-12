import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import {
  Platform,
  Pressable,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import {formatDate, parseDate} from '../../application/popupRequestForm';
import type {Recommend} from '../../domain/entities/Recommend';

export const colors = {
  background: '#F8F8F8',
  black: '#333333',
  gray: '#777777',
  gray2: '#AAAAAA',
  gray3: '#CCCCCC',
  orange: '#FF7A00',
  categoryOrange: '#FFF4EA',
  red: '#DD0000',
  white: '#FFFFFF',
};

export function FormSection({
  title,
  required = false,
  children,
}: React.PropsWithChildren<{title: string; required?: boolean}>) {
  return (
    <View style={styles.section}>
      <FieldTitle title={title} required={required} section />
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export function FieldTitle({
  title,
  required = false,
  section = false,
}: {
  title: string;
  required?: boolean;
  section?: boolean;
}) {
  return (
    <Text style={[styles.fieldTitle, section && styles.sectionTitle]}>
      {title}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

export function FormTextInput({
  title,
  placeholder,
  value,
  onChangeText,
  required = false,
  keyboardType = 'default',
  multiline = false,
}: {
  title?: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  required?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      {title ? <FieldTitle title={title} required={required} /> : null}
      <TextInput
        autoCapitalize={keyboardType === 'url' ? 'none' : 'sentences'}
        autoCorrect={keyboardType !== 'url'}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray2}
        style={[styles.input, multiline && styles.textArea]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

export function DateRangeInput({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}) {
  const [active, setActive] = React.useState<'start' | 'end' | null>(null);
  const [draftDate, setDraftDate] = React.useState(new Date());

  const openPicker = (target: 'start' | 'end') => {
    setDraftDate(parseDate(target === 'end' ? endDate : startDate));
    setActive(target);
  };

  const applyDate = (date: Date) => {
    const target = active;
    setActive(null);
    const next = formatDate(date);
    if (target === 'start') {
      onStartDateChange(next);
      if (endDate < next) onEndDateChange(next);
    } else if (target === 'end') {
      onEndDateChange(next);
    }
  };

  const onChange = (_: unknown, date?: Date) => {
    if (!date) {
      setActive(null);
      return;
    }
    if (Platform.OS === 'ios') {
      setDraftDate(date);
      return;
    }
    applyDate(date);
  };

  return (
    <View style={styles.field}>
      <FieldTitle title="운영 기간" required />
      <View style={styles.dateRow}>
        <Pressable onPress={() => openPicker('start')} style={styles.dateButton}>
          <Text style={styles.dateText}>{startDate}</Text>
        </Pressable>
        <Text style={styles.dateDash}>-</Text>
        <Pressable onPress={() => openPicker('end')} style={styles.dateButton}>
          <Text style={styles.dateText}>{endDate}</Text>
        </Pressable>
      </View>
      {active && Platform.OS === 'android' ? (
        <DateTimePicker
          display="default"
          minimumDate={active === 'end' ? parseDate(startDate) : undefined}
          mode="date"
          onChange={onChange}
          value={draftDate}
        />
      ) : null}
      <Modal
        animationType="fade"
        onRequestClose={() => setActive(null)}
        transparent
        visible={active != null && Platform.OS === 'ios'}>
        <Pressable onPress={() => setActive(null)} style={styles.modalBackdrop}>
          <Pressable
            onPress={event => event.stopPropagation()}
            style={styles.datePickerSheet}>
            <View style={styles.datePickerHeader}>
              <Pressable onPress={() => setActive(null)} style={styles.modalAction}>
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Text style={styles.datePickerTitle}>
                {active === 'start' ? '시작일' : '종료일'}
              </Text>
              <Pressable onPress={() => applyDate(draftDate)} style={styles.modalAction}>
                <Text style={styles.modalDoneText}>완료</Text>
              </Pressable>
            </View>
            <DateTimePicker
              display="spinner"
              locale="ko-KR"
              minimumDate={active === 'end' ? parseDate(startDate) : undefined}
              mode="date"
              onChange={onChange}
              style={styles.datePicker}
              textColor={colors.black}
              themeVariant="light"
              value={draftDate}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function CategoryPicker({
  categories,
  selectedIds,
  onToggle,
}: {
  categories: Recommend[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <View style={styles.field}>
      <FieldTitle title="추천 카테고리" required />
      {categories.length ? (
        <View style={styles.categoryList}>
          {categories.map(category => {
            const selected = selectedIds.includes(category.id);
            return (
              <Pressable
                key={category.id}
                onPress={() => onToggle(category.id)}
                style={[
                  styles.category,
                  selected && styles.categorySelected,
                ]}>
                <Text
                  style={[
                    styles.categoryText,
                    selected && styles.categoryTextSelected,
                  ]}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.loadingBox}>
          <Text style={styles.placeholder}>추천 카테고리를 불러오는 중입니다.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {gap: 14},
  sectionContent: {gap: 14},
  sectionTitle: {fontSize: 15, fontWeight: '700'},
  field: {gap: 8},
  fieldTitle: {color: colors.black, fontSize: 12, fontWeight: '500'},
  required: {color: colors.orange, fontWeight: '700'},
  input: {
    backgroundColor: colors.white,
    borderColor: colors.gray3,
    borderRadius: 8,
    borderWidth: 0.8,
    color: colors.black,
    fontSize: 12,
    height: 48,
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
  textArea: {height: 116, paddingHorizontal: 14, paddingVertical: 12},
  dateRow: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.gray3,
    borderRadius: 8,
    borderWidth: 0.8,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 14,
  },
  dateButton: {flex: 1, paddingVertical: 10},
  dateText: {color: colors.black, fontSize: 12, textAlign: 'center'},
  dateDash: {color: colors.gray, fontSize: 12},
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  datePickerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
  },
  datePickerHeader: {
    alignItems: 'center',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  modalAction: {minWidth: 54, padding: 10},
  modalCancelText: {color: colors.gray, fontSize: 16},
  modalDoneText: {color: colors.orange, fontSize: 16, fontWeight: '600'},
  datePickerTitle: {color: colors.black, fontSize: 16, fontWeight: '600'},
  datePicker: {height: 216, width: '100%'},
  categoryList: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  category: {
    backgroundColor: colors.white,
    borderColor: colors.gray3,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  categorySelected: {
    backgroundColor: colors.categoryOrange,
    borderColor: colors.orange,
  },
  categoryText: {color: colors.gray, fontSize: 12},
  categoryTextSelected: {color: colors.orange},
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
