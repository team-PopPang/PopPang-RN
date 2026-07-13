import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {colors} from '../../../../PopPangDesignSystem';
import {createUploadImageMetadata} from '../../application/popupRequestImage';
import type {PopupRequestImage} from '../../domain/entities/PopupRequestForm';

export function PopupRequestImagePicker({
  images,
  onAdd,
  onRemove,
}: {
  images: PopupRequestImage[];
  onAdd: (images: PopupRequestImage[]) => void;
  onRemove: (id: string) => void;
}) {
  const selectImages = async () => {
    const result = await launchImageLibrary({
      assetRepresentationMode: 'current',
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 0,
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert(
        '이미지 선택 실패',
        result.errorMessage ?? '이미지를 선택할 수 없습니다.',
      );
      return;
    }

    let rejectedCount = 0;
    const selected = (result.assets ?? []).flatMap((asset, index) => {
      if (!asset.uri || !asset.type) return [];
      const metadata = createUploadImageMetadata(
        asset.fileName,
        asset.type,
        index,
      );
      if (!metadata) {
        rejectedCount += 1;
        return [];
      }
      return [{
        fileName: metadata.fileName,
        fileSize: asset.fileSize,
        height: asset.height,
        id: `${asset.uri}-${Date.now()}-${index}`,
        mimeType: metadata.mimeType,
        uri: asset.uri,
        width: asset.width,
      }];
    });

    if (selected.length) onAdd(selected);
    if (rejectedCount) {
      Alert.alert(
        '지원하지 않는 이미지',
        'JPEG, PNG, HEIC, HEIF 형식이며 파일 정보가 올바른 이미지만 선택할 수 있습니다.',
      );
    }
  };

  return (
    <View style={styles.container}>
      {images.length ? (
        <ScrollView
          contentContainerStyle={styles.imageList}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {images.map((image, index) => (
            <View key={image.id} style={styles.previewContainer}>
              <Image source={{uri: image.uri}} style={styles.preview} />
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{index + 1}</Text>
              </View>
              <Pressable
                accessibilityLabel={`${index + 1}번째 이미지 삭제`}
                hitSlop={8}
                onPress={() => onRemove(image.id)}
                style={styles.removeButton}>
                <Text style={styles.removeText}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>선택된 이미지가 없습니다.</Text>
        </View>
      )}

      <Pressable onPress={selectImages} style={styles.selectButton}>
        <Text style={styles.selectButtonText}>＋  이미지 선택</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {gap: 10},
  imageList: {gap: 10},
  previewContainer: {height: 104, position: 'relative', width: 104},
  preview: {borderRadius: 8, height: 104, width: 104},
  orderBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    bottom: 6,
    height: 20,
    justifyContent: 'center',
    left: 6,
    width: 20,
  },
  orderText: {color: colors.white, fontSize: 11, fontWeight: '700'},
  removeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 5,
    top: 5,
    width: 24,
  },
  removeText: {color: colors.white, fontSize: 19, lineHeight: 21},
  emptyBox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.gray3,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
  },
  emptyText: {color: colors.gray2, fontSize: 12},
  selectButton: {
    backgroundColor: colors.white,
    borderColor: colors.orange,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  selectButtonText: {color: colors.orange, fontSize: 12, fontWeight: '500'},
});
