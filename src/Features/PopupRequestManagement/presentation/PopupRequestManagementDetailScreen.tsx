import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  CategoryPicker,
  DateRangeInput,
  FormSection,
  FormTextInput,
  colors,
} from '../../PopupRequest/presentation/components/FormControls';
import {createUploadImageMetadata} from '../../PopupRequest/application/popupRequestImage';
import {absoluteImageUrl, validateAdminApprovalForm} from '../application/popupRequestManagement';
import type {PopupSubmissionAdminForm} from '../domain/entities/PopupSubmissionAdminUpdate';
import type {PopupSubmissionStatus} from '../domain/entities/PopupSubmissionListItem';
import type {PopupRequestManagementRepository} from '../domain/repositories/PopupRequestManagementRepository';
import {usePopupRequestManagementDetail} from './hooks/usePopupRequestManagementDetail';

const backButtonImage = require('../../../assets/navigation/backButton.png');

export function PopupRequestManagementDetailScreen({adminUuid, onBack, repository, submissionId}: {
  adminUuid: string;
  onBack: () => void;
  repository: PopupRequestManagementRepository;
  submissionId: number;
}) {
  const state = usePopupRequestManagementDetail(adminUuid, submissionId, repository);

  const decide = (status: 'APPROVED' | 'REJECTED') => {
    if (status === 'APPROVED' && state.form) {
      const message = validateAdminApprovalForm(state.form);
      if (message) return Alert.alert('입력 확인', message);
    }
    Alert.alert(
      status === 'APPROVED' ? '제보 승인' : '제보 반려',
      status === 'APPROVED'
        ? '입력한 내용으로 팝업을 최종 등록할까요?'
        : '이 제보를 반려할까요?',
      [
        {style: 'cancel', text: '취소'},
        {
          style: status === 'REJECTED' ? 'destructive' : 'default',
          text: status === 'APPROVED' ? '승인' : '반려',
          onPress: async () => {
            try {
              const result = await state.submit(status);
              Alert.alert(
                '처리 완료',
                result.popupUuid
                  ? '팝업 리스트에 반영되었습니다.'
                  : '제보가 반려되었습니다.',
                [{onPress: onBack, text: '확인'}],
              );
            } catch (error) {
              Alert.alert(
                '처리 실패',
                error instanceof Error ? error.message : '요청에 실패했습니다.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <DetailNavigationBar onBack={onBack} />
      {state.isLoading && !state.form ? (
        <ActivityIndicator color={colors.orange} style={styles.loading} />
      ) : state.errorMessage && !state.form ? (
        <ErrorView message={state.errorMessage} retry={state.refresh} />
      ) : state.detail && state.form ? (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                onRefresh={state.refresh}
                refreshing={state.isLoading}
                tintColor={colors.orange}
              />
            }>
            <StatusBadge status={state.detail.status} />
            <View style={styles.descriptionCard}>
              <Text style={styles.cardTitle}>원본 제보 내용</Text>
              <Text style={styles.descriptionText}>
                {state.detail.description || '제보 내용이 없습니다.'}
              </Text>
            </View>
            <AdminEditForm
              form={state.form}
              recommends={state.recommends}
              update={state.update}
            />
          </ScrollView>
          {state.detail.status === 'PENDING' ? (
            <View style={styles.footer}>
              <Pressable
                disabled={state.isSubmitting}
                onPress={() => decide('REJECTED')}
                style={styles.rejectButton}>
                <Text style={styles.rejectText}>
                  {state.isSubmitting ? '처리 중' : '반려'}
                </Text>
              </Pressable>
              <Pressable
                disabled={state.isSubmitting}
                onPress={() => decide('APPROVED')}
                style={[styles.approveButton, state.isSubmitting && styles.disabled]}>
                <Text style={styles.approveText}>
                  {state.isSubmitting ? '처리 중' : '승인'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function AdminEditForm({form, recommends, update}: {
  form: PopupSubmissionAdminForm;
  recommends: {id: number; name: string}[];
  update: <K extends keyof PopupSubmissionAdminForm>(key: K, value: PopupSubmissionAdminForm[K]) => void;
}) {
  const toggleRecommend = (id: number) =>
    update(
      'selectedRecommendIds',
      form.selectedRecommendIds.includes(id)
        ? form.selectedRecommendIds.filter(value => value !== id)
        : [...form.selectedRecommendIds, id],
    );

  return (
    <View style={styles.form}>
      <FormSection title="필수 입력">
        <FormTextInput title="팝업명" required placeholder="팝업명을 입력해 주세요" value={form.name} onChangeText={value => update('name', value)} />
        <DateRangeInput startDate={form.startDate} endDate={form.endDate} onStartDateChange={value => update('startDate', value)} onEndDateChange={value => update('endDate', value)} />
        <FormTextInput title="도로명 주소" required placeholder="도로명 주소" value={form.roadAddress} onChangeText={value => update('roadAddress', value)} />
        <FormTextInput title="지역" required placeholder="예: 서울" value={form.region} onChangeText={value => update('region', value)} />
        <FormTextInput title="팝업 한줄 소개" required multiline placeholder="노출용 한줄 소개를 입력해 주세요" value={form.captionSummary} onChangeText={value => update('captionSummary', value)} />
        <FormTextInput title="팝업 상세 소개" required multiline placeholder="최종 노출용 상세 소개를 입력해 주세요" value={form.caption} onChangeText={value => update('caption', value)} />
        <CategoryPicker categories={recommends} selectedIds={form.selectedRecommendIds} onToggle={toggleRecommend} />
      </FormSection>

      <FormSection title="이미지" required>
        <AdminImagePicker form={form} update={update} />
      </FormSection>

      <FormSection title="기본 정보">
        <FormTextInput title="지번 주소" required placeholder="지번 주소" value={form.address} onChangeText={value => update('address', value)} />
        <View style={styles.twoColumns}>
          <View style={styles.column}><FormTextInput title="오픈 시간" keyboardType="numbers-and-punctuation" placeholder="10:00" value={form.openTime} onChangeText={value => update('openTime', value)} /></View>
          <View style={styles.column}><FormTextInput title="마감 시간" keyboardType="numbers-and-punctuation" placeholder="20:00" value={form.closeTime} onChangeText={value => update('closeTime', value)} /></View>
        </View>
        <View style={styles.twoColumns}>
          <View style={styles.column}><FormTextInput title="위도" required keyboardType="decimal-pad" placeholder="37.544" value={form.latitude} onChangeText={value => update('latitude', value)} /></View>
          <View style={styles.column}><FormTextInput title="경도" required keyboardType="decimal-pad" placeholder="127.055" value={form.longitude} onChangeText={value => update('longitude', value)} /></View>
        </View>
        <FormTextInput title="인스타그램 URL" keyboardType="url" placeholder="https://instagram.com/p/..." value={form.instaPostUrl} onChangeText={value => update('instaPostUrl', value)} />
      </FormSection>

      <FormSection title="관리자 입력">
        <MediaTypePicker selected={form.mediaType} onSelect={value => update('mediaType', value)} />
        <FormTextInput title="인스타그램 Post ID" placeholder="선택 입력" value={form.instaPostId} onChangeText={value => update('instaPostId', value)} />
        <FormTextInput title="Geocoding Query" placeholder="선택 입력" value={form.geocodingQuery} onChangeText={value => update('geocodingQuery', value)} />
      </FormSection>
    </View>
  );
}

function AdminImagePicker({form, update}: {
  form: PopupSubmissionAdminForm;
  update: <K extends keyof PopupSubmissionAdminForm>(key: K, value: PopupSubmissionAdminForm[K]) => void;
}) {
  const add = async () => {
    const result = await launchImageLibrary({assetRepresentationMode: 'current', mediaType: 'photo', quality: 1, selectionLimit: 0});
    if (result.didCancel) return;
    if (result.errorCode) return Alert.alert('이미지 선택 실패', result.errorMessage ?? '이미지를 선택할 수 없습니다.');
    const added = (result.assets ?? []).flatMap((asset, index) => {
      if (!asset.uri || !asset.type) return [];
      const metadata = createUploadImageMetadata(asset.fileName, asset.type, index);
      if (!metadata) return [];
      return [{
        fileName: metadata.fileName,
        fileSize: asset.fileSize,
        height: asset.height,
        id: `upload-${Date.now()}-${index}-${asset.uri}`,
        mimeType: metadata.mimeType,
        sourceType: 'UPLOAD' as const,
        uri: asset.uri,
        width: asset.width,
      }];
    });
    if (added.length) update('images', [...form.images, ...added]);
  };

  return (
    <View style={styles.imagePicker}>
      {form.images.length ? (
        <ScrollView contentContainerStyle={styles.imageRow} horizontal showsHorizontalScrollIndicator={false}>
          {form.images.map((image, index) => (
            <View key={image.id} style={styles.imageContainer}>
              <Image source={{uri: image.sourceType === 'EXISTING' ? absoluteImageUrl(image.imageUrl) : image.uri}} style={styles.image} />
              <View style={styles.orderBadge}><Text style={styles.orderText}>{index + 1}</Text></View>
              <Pressable onPress={() => update('images', form.images.filter(item => item.id !== image.id))} style={styles.removeButton}>
                <Text style={styles.removeText}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : <View style={styles.emptyImage}><Text style={styles.emptyText}>등록할 이미지가 없습니다.</Text></View>}
      <Pressable onPress={add} style={styles.addImageButton}><Text style={styles.addImageText}>＋  이미지 추가</Text></Pressable>
    </View>
  );
}

function MediaTypePicker({selected, onSelect}: {
  selected: PopupSubmissionAdminForm['mediaType'];
  onSelect: (value: PopupSubmissionAdminForm['mediaType']) => void;
}) {
  return (
    <View style={styles.mediaTypes}>
      {(['IMAGE', 'CAROUSEL', 'VIDEO'] as const).map(value => (
        <Pressable key={value} onPress={() => onSelect(value)} style={[styles.mediaType, selected === value && styles.mediaTypeSelected]}>
          <Text style={[styles.mediaTypeText, selected === value && styles.mediaTypeTextSelected]}>{value}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function DetailNavigationBar({onBack}: {onBack: () => void}) {
  return <View style={styles.navigationBar}><Pressable accessibilityLabel="뒤로가기" accessibilityRole="button" hitSlop={6} onPress={onBack} style={styles.backButton}><Image source={backButtonImage} style={styles.backButtonImage} /></Pressable><Text style={styles.navigationTitle}>제보 상세</Text><View style={styles.navigationSpacer} /></View>;
}

function StatusBadge({status}: {status: PopupSubmissionStatus}) {
  const title = status === 'PENDING' ? '검토 대기' : status === 'APPROVED' ? '승인' : '반려';
  return <View style={styles.statusBadge}><Text style={styles.statusText}>{title}</Text></View>;
}

function ErrorView({message, retry}: {message: string; retry: () => void}) {
  return <View style={styles.errorBox}><Text style={styles.errorText}>{message}</Text><Pressable onPress={retry} style={styles.approveButton}><Text style={styles.approveText}>다시 시도</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  addImageButton: {borderColor: colors.orange, borderRadius: 8, borderWidth: 1, height: 44, justifyContent: 'center', paddingHorizontal: 14},
  addImageText: {color: colors.orange, fontSize: 12, fontWeight: '500'}, approveButton: {alignItems: 'center', backgroundColor: colors.orange, borderRadius: 12, flex: 1, height: 56, justifyContent: 'center'},
  approveText: {color: colors.white, fontSize: 15, fontWeight: '600'}, backButton: {height: 44, justifyContent: 'center', minWidth: 64},
  backButtonImage: {height: 18, tintColor: colors.black, width: 18}, cardTitle: {color: colors.black, fontSize: 15, fontWeight: '700'},
  column: {flex: 1}, content: {gap: 16, paddingBottom: 32, paddingHorizontal: 15, paddingTop: 16}, descriptionCard: {backgroundColor: colors.white, borderRadius: 8, gap: 10, padding: 18},
  descriptionText: {color: colors.gray, fontSize: 13, lineHeight: 21}, disabled: {opacity: 0.45}, emptyImage: {alignItems: 'center', borderColor: colors.gray3, borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, height: 88, justifyContent: 'center'},
  emptyText: {color: colors.gray2, fontSize: 12}, errorBox: {alignItems: 'center', gap: 16, padding: 24}, errorText: {color: colors.gray, fontSize: 13, textAlign: 'center'},
  footer: {backgroundColor: colors.white, borderTopColor: '#E5E5EA', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, paddingHorizontal: 15, paddingVertical: 12},
  form: {gap: 28}, image: {borderRadius: 8, height: 104, width: 104}, imageContainer: {height: 104, position: 'relative', width: 104}, imagePicker: {gap: 10}, imageRow: {gap: 10},
  loading: {marginTop: 48}, mediaType: {alignItems: 'center', borderColor: colors.gray3, borderRadius: 17, borderWidth: 1, height: 34, justifyContent: 'center', paddingHorizontal: 14},
  mediaTypeSelected: {backgroundColor: colors.orange, borderColor: colors.orange}, mediaTypeText: {color: colors.gray, fontSize: 12}, mediaTypeTextSelected: {color: colors.white}, mediaTypes: {flexDirection: 'row', gap: 8},
  navigationBar: {alignItems: 'center', backgroundColor: colors.white, borderBottomColor: '#E5E5EA', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 52, justifyContent: 'space-between', paddingHorizontal: 12},
  navigationSpacer: {minWidth: 64}, navigationTitle: {color: '#111111', fontSize: 17, fontWeight: '700'}, orderBadge: {alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, bottom: 6, height: 20, justifyContent: 'center', left: 6, position: 'absolute', width: 20},
  orderText: {color: colors.white, fontSize: 11, fontWeight: '700'}, rejectButton: {alignItems: 'center', backgroundColor: 'rgba(221,0,0,0.1)', borderRadius: 12, flex: 1, height: 56, justifyContent: 'center'},
  rejectText: {color: colors.red, fontSize: 15, fontWeight: '600'}, removeButton: {alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 12, height: 24, justifyContent: 'center', position: 'absolute', right: 5, top: 5, width: 24},
  removeText: {color: colors.white, fontSize: 19, lineHeight: 21}, screen: {backgroundColor: colors.background, flex: 1}, statusBadge: {alignSelf: 'flex-start', backgroundColor: colors.categoryOrange, borderRadius: 16, height: 32, justifyContent: 'center', paddingHorizontal: 12},
  statusText: {color: colors.orange, fontSize: 12, fontWeight: '500'}, twoColumns: {flexDirection: 'row', gap: 10},
});
