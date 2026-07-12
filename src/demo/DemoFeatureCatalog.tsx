import React from 'react';
import {FlatList, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {demoFeatures, type DemoFeature} from './demoFeatures';

type DemoStackParamList = {
  Features: undefined;
  Preview: {featureId: string; userUuid: string};
};

const Stack = createNativeStackNavigator<DemoStackParamList>();

function FeatureListItem({item, index, onPress}: {
  item: DemoFeature;
  index: number;
  onPress: (feature: DemoFeature) => void;
}) {
  return (
    <Pressable onPress={() => onPress(item)} style={({pressed}) => [
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

function FeatureListScreen({onOpen}: {onOpen: (feature: DemoFeature, userUuid: string) => void}) {
  const [userUuid, setUserUuid] = React.useState(
    '4c3b9a55-f4ee-42cc-9bd2-82a5c811db13',
  );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.headerBlock}>
        <Text style={styles.headerEyebrow}>PopPang Demo</Text>
        <Text style={styles.headerTitle}>Features</Text>
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
          renderItem={({item, index}) => (
            <FeatureListItem
              index={index}
              item={item}
              onPress={feature => onOpen(feature, userUuid)}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function DemoFeaturePreview({feature, onBack, userUuid}: {
  feature: DemoFeature;
  onBack: () => void;
  userUuid: string;
}) {
  const SelectedComponent = feature.component;
  return (
    <SafeAreaView edges={['top']} style={styles.previewScreen}>
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
    </SafeAreaView>
  );
}

export default function DemoFeatureCatalog() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{animation: 'default', gestureEnabled: true, headerShown: false}}>
          <Stack.Screen name="Features">
            {({navigation}) => (
              <FeatureListScreen
                onOpen={(feature, userUuid) =>
                  navigation.navigate('Preview', {featureId: feature.id, userUuid})
                }
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Preview">
            {({navigation, route}) => {
              const feature = demoFeatures.find(item => item.id === route.params.featureId);
              return feature ? (
                <DemoFeaturePreview
                  feature={feature}
                  onBack={navigation.goBack}
                  userUuid={route.params.userUuid}
                />
              ) : null;
            }}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  backButton: {minWidth: 60, paddingVertical: 8},
  backButtonText: {color: '#007AFF', fontSize: 17, fontWeight: '500'},
  chevron: {color: '#C7C7CC', fontSize: 19, fontWeight: '700'},
  headerBlock: {marginBottom: 16, paddingHorizontal: 20},
  headerEyebrow: {color: '#6E6E73', fontSize: 13, fontWeight: '600', letterSpacing: 0.4, marginBottom: 8, textTransform: 'uppercase'},
  headerTitle: {color: '#111111', fontSize: 34, fontWeight: '800'},
  listCard: {backgroundColor: '#FFFFFF', borderRadius: 14, marginHorizontal: 16, overflow: 'hidden'},
  listDescription: {color: '#8E8E93', fontSize: 14, lineHeight: 19, marginTop: 4},
  listRow: {borderBottomColor: '#D1D1D6', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 14},
  listRowContent: {alignItems: 'center', flexDirection: 'row'},
  listRowLast: {borderBottomWidth: 0},
  listRowPressed: {backgroundColor: '#F3F4F6'},
  listTextBlock: {flex: 1, paddingRight: 16},
  listTitle: {color: '#111111', fontSize: 17, fontWeight: '600'},
  previewContent: {flex: 1},
  previewHeader: {alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomColor: '#E5E5EA', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: 12},
  previewHeaderSpacer: {minWidth: 60},
  previewScreen: {backgroundColor: '#FFFFFF', flex: 1},
  previewTitle: {color: '#111111', flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center'},
  screen: {backgroundColor: '#F2F2F7', flex: 1, paddingTop: 12},
  userUuidBlock: {marginBottom: 16, marginHorizontal: 16},
  userUuidInput: {backgroundColor: '#FFFFFF', borderColor: '#D1D1D6', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, color: '#111111', fontSize: 15, height: 48, paddingHorizontal: 14},
  userUuidLabel: {color: '#6E6E73', fontSize: 13, fontWeight: '600', marginBottom: 8},
});
