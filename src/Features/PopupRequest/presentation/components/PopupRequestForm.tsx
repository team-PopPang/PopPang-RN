import React from 'react';
import {StyleSheet, View} from 'react-native';
import type {PopupRequestForm as Form} from '../../domain/entities/PopupRequestForm';
import type {Recommend} from '../../domain/entities/Recommend';
import {
  CategoryPicker,
  DateRangeInput,
  FormSection,
  FormTextInput,
} from './FormControls';
import {PopupRequestImagePicker} from './PopupRequestImagePicker';

export function PopupRequestForm({
  form,
  recommends,
  update,
  toggleRecommend,
  addImages,
  removeImage,
}: {
  form: Form;
  recommends: Recommend[];
  update: <K extends keyof Form>(key: K, value: Form[K]) => void;
  toggleRecommend: (id: number) => void;
  addImages: (images: Form['images']) => void;
  removeImage: (id: string) => void;
}) {
  return (
    <View style={styles.form}>
      <FormSection title="필수 입력">
        <FormTextInput title="팝업명" required placeholder="팝업명을 입력해 주세요" value={form.name} onChangeText={value => update('name', value)} />
        <DateRangeInput startDate={form.startDate} endDate={form.endDate} onStartDateChange={value => update('startDate', value)} onEndDateChange={value => update('endDate', value)} />
        <FormTextInput title="도로명 주소" required placeholder="예: 서울 성동구 성수이로 00" value={form.roadAddress} onChangeText={value => update('roadAddress', value)} />
        <FormTextInput title="지역" required placeholder="예: 서울" value={form.region} onChangeText={value => update('region', value)} />
        <FormTextInput title="제보 내용" required multiline placeholder="팝업의 주요 내용과 참고할 정보를 입력해 주세요" value={form.description} onChangeText={value => update('description', value)} />
        <CategoryPicker categories={recommends} selectedIds={form.selectedRecommendIds} onToggle={toggleRecommend} />
      </FormSection>

      <FormSection title="이미지" required>
        <PopupRequestImagePicker
          images={form.images}
          onAdd={addImages}
          onRemove={removeImage}
        />
      </FormSection>

      <FormSection title="기본 정보">
        <FormTextInput title="지번 주소" placeholder="도로명 주소와 다를 때 입력" value={form.address} onChangeText={value => update('address', value)} />
        <View style={styles.twoColumns}>
          <View style={styles.column}><FormTextInput title="오픈 시간" keyboardType="numbers-and-punctuation" placeholder="10:00" value={form.openTime} onChangeText={value => update('openTime', value)} /></View>
          <View style={styles.column}><FormTextInput title="마감 시간" keyboardType="numbers-and-punctuation" placeholder="20:00" value={form.closeTime} onChangeText={value => update('closeTime', value)} /></View>
        </View>
        <View style={styles.twoColumns}>
          <View style={styles.column}><FormTextInput title="위도" keyboardType="decimal-pad" placeholder="37.544" value={form.latitude} onChangeText={value => update('latitude', value)} /></View>
          <View style={styles.column}><FormTextInput title="경도" keyboardType="decimal-pad" placeholder="127.055" value={form.longitude} onChangeText={value => update('longitude', value)} /></View>
        </View>
        <FormTextInput title="인스타그램 URL" keyboardType="url" placeholder="https://instagram.com/p/..." value={form.instagramUrl} onChangeText={value => update('instagramUrl', value)} />
      </FormSection>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {gap: 28},
  twoColumns: {flexDirection: 'row', gap: 10},
  column: {flex: 1},
});
