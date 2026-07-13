import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {colors} from '../foundation/colors';

const backButtonImage = require('../../assets/navigation/backButton.png');

export function PopPangNavigationHeader({
  onBack,
  title,
}: {
  onBack?: () => void;
  title: string;
}) {
  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable
          accessibilityLabel="뒤로가기"
          accessibilityRole="button"
          hitSlop={6}
          onPress={onBack}
          style={({pressed}) => [styles.backButton, pressed && styles.pressed]}>
          <Image source={backButtonImage} style={styles.backButtonImage} />
        </Pressable>
      ) : (
        <View style={styles.sideSpacer} />
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.sideSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 48,
  },
  backButtonImage: {height: 18, tintColor: colors.black, width: 18},
  container: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
  },
  pressed: {opacity: 0.65},
  sideSpacer: {width: 48},
  title: {color: colors.black, fontSize: 18, fontWeight: '700'},
});
