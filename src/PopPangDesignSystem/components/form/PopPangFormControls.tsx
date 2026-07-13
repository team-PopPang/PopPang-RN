import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import {colors} from '../../foundation/colors';
import {formatDate, parseDate} from '../../foundation/date';

export function PopPangFormSection({
  children,
  required = false,
  title,
}: React.PropsWithChildren<{title: string; required?: boolean}>) {
  return (
    <View style={styles.section}>
      <PopPangFieldTitle required={required} section title={title} />
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export function PopPangFieldTitle({
  required = false,
  section = false,
  title,
}: {
  required?: boolean;
  section?: boolean;
  title: string;
}) {
  return (
    <Text style={[styles.fieldTitle, section && styles.sectionTitle]}>
      {title}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

export function PopPangFormTextInput({
  keyboardType = 'default',
  multiline = false,
  onChangeText,
  placeholder,
  required = false,
  title,
  value,
}: {
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  required?: boolean;
  title?: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      {title ? <PopPangFieldTitle required={required} title={title} /> : null}
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

export function PopPangDateRangeInput({
  endDate,
  onEndDateChange,
  onStartDateChange,
  startDate,
}: {
  endDate: string;
  onEndDateChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  startDate: string;
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
      <PopPangFieldTitle required title="운영 기간" />
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

const styles = StyleSheet.create({
  dateButton: {flex: 1, paddingVertical: 10},
  dateDash: {color: colors.gray, fontSize: 12},
  datePicker: {height: 216, width: '100%'},
  datePickerHeader: {
    alignItems: 'center',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  datePickerTitle: {color: colors.black, fontSize: 16, fontWeight: '600'},
  datePickerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
  },
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
  dateText: {color: colors.black, fontSize: 12, textAlign: 'center'},
  field: {gap: 8},
  fieldTitle: {color: colors.black, fontSize: 12, fontWeight: '500'},
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
  modalAction: {minWidth: 54, padding: 10},
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCancelText: {color: colors.gray, fontSize: 16},
  modalDoneText: {color: colors.orange, fontSize: 16, fontWeight: '600'},
  required: {color: colors.orange, fontWeight: '700'},
  section: {gap: 14},
  sectionContent: {gap: 14},
  sectionTitle: {fontSize: 15, fontWeight: '700'},
  textArea: {height: 116, paddingHorizontal: 14, paddingVertical: 12},
});
