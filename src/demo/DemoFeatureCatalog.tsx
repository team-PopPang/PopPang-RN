import React from 'react';
import {
  Animated,
  Easing,
  FlatList,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type PanResponderInstance,
  type ListRenderItemInfo,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {demoFeatures, type DemoFeature} from './demoFeatures';

const EDGE_SWIPE_WIDTH = 32;
const CLOSE_DISTANCE_RATIO = 0.33;

function FeatureListItem({
  item,
  index,
  onPress,
}: {
  item: DemoFeature;
  index: number;
  onPress: (feature: DemoFeature) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({pressed}) => [
        styles.listRow,
        index === demoFeatures.length - 1 && styles.listRowLast,
        pressed && styles.listRowPressed,
      ]}>
      <View style={styles.listRowContent}>
        <View style={styles.listTextBlock}>
          <Text style={styles.listTitle}>{item.title}</Text>
          <Text style={styles.listDescription}>{item.description}</Text>
        </View>
        <Text style={styles.chevron}>{'>'}</Text>
      </View>
    </Pressable>
  );
}

function DemoFeaturePreview({
  feature,
  onBack,
  panHandlers,
  userUuid,
}: {
  feature: DemoFeature;
  onBack: () => void;
  panHandlers?: PanResponderInstance['panHandlers'];
  userUuid: string;
}) {
  const SelectedComponent = feature.component;

  return (
    <SafeAreaView style={styles.previewScreen} edges={['top']}>
      <View style={styles.previewGestureSurface} {...panHandlers}>
        <View style={styles.previewHeader}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text numberOfLines={1} style={styles.previewTitle}>
            {feature.navigationTitle ?? feature.title}
          </Text>
          <View style={styles.previewHeaderSpacer} />
        </View>
        <View style={styles.previewContent}>
          <SelectedComponent userUuid={userUuid.trim() || null} />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function DemoFeatureCatalog() {
  const {width} = useWindowDimensions();
  const transition = React.useRef(new Animated.Value(0)).current;
  const [selectedFeature, setSelectedFeature] = React.useState<DemoFeature | null>(
    null,
  );
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [userUuid, setUserUuid] = React.useState('43bbbfea-b5c9-40f0-9822-0c8e5cbd0379');

  const listTranslateX = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width * 0.28],
  });

  const listOpacity = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.72],
  });

  const detailTranslateX = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [width, 0],
  });

  const animateToClosed = React.useCallback(() => {
    setIsTransitioning(true);

    Animated.timing(transition, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      setSelectedFeature(null);
      setIsTransitioning(false);
    });
  }, [transition]);

  const animateToOpen = React.useCallback(() => {
    setIsTransitioning(true);

    Animated.timing(transition, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start(() => {
      setIsTransitioning(false);
    });
  }, [transition]);

  const openFeature = React.useCallback(
    (feature: DemoFeature) => {
      if (isTransitioning) {
        return;
      }

      setIsTransitioning(true);
      transition.setValue(0);
      setSelectedFeature(feature);
    },
    [isTransitioning, transition],
  );

  React.useEffect(() => {
    if (selectedFeature == null) {
      return;
    }

    const animationFrame = requestAnimationFrame(animateToOpen);

    return () => cancelAnimationFrame(animationFrame);
  }, [animateToOpen, selectedFeature, transition]);

  const closeFeature = React.useCallback(() => {
    if (isTransitioning || selectedFeature == null) {
      return;
    }

    animateToClosed();
  }, [animateToClosed, isTransitioning, selectedFeature]);

  const edgeSwipeResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (selectedFeature == null || isTransitioning) {
            return false;
          }

          const isFromLeftEdge = gestureState.x0 <= EDGE_SWIPE_WIDTH;
          const horizontalTravel = Math.abs(gestureState.dx);
          const verticalTravel = Math.abs(gestureState.dy);

          return (
            isFromLeftEdge &&
            gestureState.dx > 8 &&
            horizontalTravel > verticalTravel
          );
        },
        onPanResponderGrant: () => {
          transition.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          const dx = Math.max(0, Math.min(width, gestureState.dx));
          const nextValue = 1 - dx / width;
          transition.setValue(nextValue);
        },
        onPanResponderRelease: (_, gestureState) => {
          const draggedDistance = Math.max(0, gestureState.dx);
          const draggedRatio = draggedDistance / width;
          const shouldClose =
            draggedRatio > CLOSE_DISTANCE_RATIO || gestureState.vx > 0.75;

          if (shouldClose) {
            animateToClosed();
            return;
          }

          animateToOpen();
        },
        onPanResponderTerminate: () => {
          animateToOpen();
        },
      }),
    [animateToClosed, animateToOpen, isTransitioning, selectedFeature, transition, width],
  );

  return (
    <SafeAreaProvider>
      <View style={styles.stage}>
        <Animated.View
          pointerEvents={selectedFeature ? 'none' : 'auto'}
          style={[
            styles.layer,
            {
              opacity: listOpacity,
              transform: [{translateX: listTranslateX}],
            },
          ]}>
          <SafeAreaView style={styles.screen} edges={['top']}>
            <View style={styles.headerBlock}>
              <Text style={styles.headerEyebrow}>PopPang Demo</Text>
              <Text style={styles.headerTitle}>Features</Text>
              {/* <Text style={styles.headerDescription}>
                Open each feature like a navigation stack entry while keeping the
                release root unchanged.
              </Text> */}
            </View>

            <View style={styles.userUuidBlock}>
              <Text style={styles.userUuidLabel}>userUuid</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setUserUuid}
                placeholder="테스트할 userUuid를 입력하세요"
                placeholderTextColor="#8E8E93"
                returnKeyType="done"
                style={styles.userUuidInput}
                value={userUuid}
              />
            </View>

            <View style={styles.listCard}>
              <FlatList
                data={demoFeatures}
                keyExtractor={item => item.id}
                renderItem={({item, index}: ListRenderItemInfo<DemoFeature>) => (
                  <FeatureListItem
                    item={item}
                    index={index}
                    onPress={openFeature}
                  />
                )}
              />
            </View>
          </SafeAreaView>
        </Animated.View>

        {selectedFeature ? (
          <Animated.View
            pointerEvents="auto"
            style={[
              styles.layer,
              {
                transform: [{translateX: detailTranslateX}],
              },
            ]}>
            <DemoFeaturePreview
              feature={selectedFeature}
              onBack={closeFeature}
              panHandlers={edgeSwipeResponder.panHandlers}
              userUuid={userUuid}
            />
          </Animated.View>
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
  },
  layer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  screen: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingTop: 12,
  },
  headerBlock: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  userUuidBlock: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  userUuidLabel: {
    color: '#6E6E73',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  userUuidInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D1D6',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    color: '#111111',
    fontSize: 15,
    height: 48,
    paddingHorizontal: 14,
  },
  headerEyebrow: {
    color: '#6E6E73',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#111111',
    fontSize: 34,
    fontWeight: '800',
  },
  headerDescription: {
    color: '#6E6E73',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  listRow: {
    borderBottomColor: '#D1D1D6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  listRowPressed: {
    backgroundColor: '#F3F4F6',
  },
  listRowContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  listTextBlock: {
    flex: 1,
    paddingRight: 16,
  },
  listTitle: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '600',
  },
  listDescription: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 19,
    marginTop: 4,
  },
  chevron: {
    color: '#C7C7CC',
    fontSize: 19,
    fontWeight: '700',
  },
  previewScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  previewGestureSurface: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  previewHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 12,
  },
  backButton: {
    minWidth: 60,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '500',
  },
  previewTitle: {
    color: '#111111',
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  previewHeaderSpacer: {
    minWidth: 60,
  },
  previewContent: {
    flex: 1,
  },
});
