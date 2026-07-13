import React from 'react';
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type KeyboardEvent,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  emitPopPangNativeEvent,
  POPPANG_NATIVE_EVENT,
  type PopPangNativeEvent,
} from '../../../native/PopPangHostAction';
import type {PopupRequestRepository} from '../domain/repositories/PopupRequestRepository';
import {colors} from './components/FormControls';
import {PopupRequestForm} from './components/PopupRequestForm';
import {usePopupRequest} from './hooks/usePopupRequest';

export function PopupRequestScreen({
  nativeEvents,
  userUuid,
  repository,
}: {
  nativeEvents?: readonly PopPangNativeEvent[] | null;
  userUuid: string;
  repository: PopupRequestRepository;
}) {
  const popupRequest = usePopupRequest(userUuid, repository);
  const insets = useSafeAreaInsets();
  const keyboardTranslation = React.useRef(new Animated.Value(0)).current;
  const bottomBarAnimatedStyle = React.useMemo(
    () => ({transform: [{translateY: keyboardTranslation}]}),
    [keyboardTranslation],
  );

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      Animated.timing(keyboardTranslation, {
        duration: 140,
        easing: Easing.out(Easing.cubic),
        toValue: -Math.max(0, event.endCoordinates.height - insets.bottom),
        useNativeDriver: true,
      }).start();
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardTranslation, {
        duration: 140,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [insets.bottom, keyboardTranslation]);

  const submit = async () => {
    const result = await popupRequest.submit();
    if (result.success) {
      Alert.alert('제보 완료', '팝업 제보가 등록되었습니다.', [
        {
          onPress: () =>
            emitPopPangNativeEvent(
              POPPANG_NATIVE_EVENT.POPUP_REQUEST_SUBMITTED,
              nativeEvents,
            ),
          text: '확인',
        },
      ]);
    } else {
      Alert.alert('제출 실패', result.error ?? '제출에 실패했습니다.');
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <PopupRequestForm
            addImages={popupRequest.addImages}
            form={popupRequest.form}
            recommends={popupRequest.recommends}
            removeImage={popupRequest.removeImage}
            toggleRecommend={popupRequest.toggleRecommend}
            update={popupRequest.update}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <Animated.View
        style={[styles.bottomBar, bottomBarAnimatedStyle]}>
        <Pressable
          disabled={popupRequest.isSubmitting}
          onPress={submit}
          style={({pressed}) => [
            styles.submitButton,
            (pressed || popupRequest.isSubmitting) && styles.submitButtonMuted,
          ]}>
          <Text style={styles.submitText}>
            {popupRequest.isSubmitting ? '제출 중' : '제보하기'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {backgroundColor: colors.background, flex: 1},
  content: {flex: 1},
  scrollContent: {paddingBottom: 120, paddingHorizontal: 15, paddingTop: 24},
  bottomBar: {
    backgroundColor: colors.white,
    bottom: 0,
    borderTopColor: '#E5E5EA',
    borderTopWidth: StyleSheet.hairlineWidth,
    left: 0,
    paddingHorizontal: 15,
    paddingVertical: 12,
    position: 'absolute',
    right: 0,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.orange,
    borderRadius: 5,
    height: 56,
    justifyContent: 'center',
  },
  submitButtonMuted: {opacity: 0.45},
  submitText: {color: '#F1F1F1', fontSize: 14, fontWeight: '700'},
});
