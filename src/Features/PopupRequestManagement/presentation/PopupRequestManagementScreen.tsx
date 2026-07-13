import React from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  colors,
  PopPangNavigationHeader,
  PopPangSelectableChip,
} from '../../../PopPangDesignSystem';
import {countByStatus, submittedDate} from '../application/popupRequestManagement';
import type {
  PopupSubmissionListItem,
  PopupSubmissionStatus,
} from '../domain/entities/PopupSubmissionListItem';
import {popupSubmissionFilters} from '../domain/entities/PopupSubmissionListItem';
import type {PopupRequestManagementRepository} from '../domain/repositories/PopupRequestManagementRepository';
import {usePopupRequestManagement} from './hooks/usePopupRequestManagement';

export function PopupRequestManagementScreen({
  adminUuid,
  onNativeBackPress,
  onSubmissionPress,
  repository,
}: {
  adminUuid: string;
  onNativeBackPress?: () => void;
  onSubmissionPress?: (submissionId: number) => void;
  repository: PopupRequestManagementRepository;
}) {
  const state = usePopupRequestManagement(adminUuid, repository);
  const refresh = state.refresh;
  const hasFocused = React.useRef(false);
  const [isPullRefreshing, setIsPullRefreshing] = React.useState(false);

  const refreshByPull = React.useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsPullRefreshing(false);
    }
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      if (hasFocused.current) refresh();
      else hasFocused.current = true;
    }, [refresh]),
  );

  return (
    <View style={styles.screen}>
      <PopPangNavigationHeader
        onBack={onNativeBackPress}
        title="팝업 제보 관리"
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={refreshByPull}
            refreshing={isPullRefreshing}
            tintColor={colors.orange}
          />
        }>
        <View style={styles.summaryRow}>
          <SummaryTile
            count={countByStatus(state.allItems, 'PENDING')}
            title="대기"
          />
          <SummaryTile
            count={countByStatus(state.allItems, 'APPROVED')}
            title="승인"
          />
          <SummaryTile
            count={countByStatus(state.allItems, 'REJECTED')}
            title="반려"
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.filterRow}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {popupSubmissionFilters.map(filter => {
            const selected = state.selectedFilter === filter.value;
            return (
              <PopPangSelectableChip
                key={filter.value}
                label={filter.label}
                onPress={() => state.selectFilter(filter.value)}
                selected={selected}
              />
            );
          })}
        </ScrollView>

        {state.isLoading && state.allItems.length === 0 ? (
          <LoadingView />
        ) : state.errorMessage ? (
          <ErrorView message={state.errorMessage} retry={state.refresh} />
        ) : state.items.length === 0 ? (
          <EmptyView />
        ) : (
          <View style={styles.list}>
            {state.items.map(item => (
              <SubmissionCell
                item={item}
                key={item.id}
                onPress={() => onSubmissionPress?.(item.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryTile({count, title}: {count: number; title: string}) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryCount}>{count}</Text>
    </View>
  );
}

const statusStyle: Record<
  PopupSubmissionStatus,
  {backgroundColor: string; color: string; title: string}
> = {
  APPROVED: {backgroundColor: '#E0ECE2', color: colors.green, title: '승인'},
  PENDING: {
    backgroundColor: colors.categoryOrange,
    color: colors.orange,
    title: '검토 대기',
  },
  REJECTED: {backgroundColor: '#F8E0E0', color: colors.red, title: '반려'},
};

function SubmissionCell({
  item,
  onPress,
}: {
  item: PopupSubmissionListItem;
  onPress: () => void;
}) {
  const badge = statusStyle[item.status];
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.cell, pressed && styles.pressed]}>
      <View style={styles.cellTop}>
        <View style={styles.cellTitleBlock}>
          <Text numberOfLines={2} style={styles.cellTitle}>
            {item.name}
          </Text>
          <Text numberOfLines={2} style={styles.cellAddress}>
            {item.roadAddress}
          </Text>
        </View>
        <View style={[styles.badge, {backgroundColor: badge.backgroundColor}]}>
          <Text style={[styles.badgeText, {color: badge.color}]}>
            {badge.title}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
      <View style={styles.metaRow}>
        <MetaText text={item.region} />
        <MetaDivider />
        <MetaText text={item.submitterNickname} />
        <MetaDivider />
        <MetaText text={submittedDate(item.submittedAt)} />
      </View>
    </Pressable>
  );
}

function MetaText({text}: {text: string}) {
  return (
    <Text numberOfLines={1} style={styles.metaText}>
      {text}
    </Text>
  );
}

function MetaDivider() {
  return <View style={styles.metaDivider} />;
}

function LoadingView() {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={colors.orange} />
      <Text style={styles.stateText}>팝업 제보를 불러오는 중입니다.</Text>
    </View>
  );
}

function ErrorView({message, retry}: {message: string; retry: () => void}) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateIcon}>⚠</Text>
      <Text style={styles.stateText}>{message}</Text>
      <Pressable onPress={retry} style={styles.retryButton}>
        <Text style={styles.retryText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

function EmptyView() {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateIcon}>▱</Text>
      <Text style={styles.stateText}>표시할 팝업 제보가 없습니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  badgeText: {fontSize: 11, fontWeight: '500'},
  cell: {backgroundColor: colors.white, borderRadius: 8, gap: 12, padding: 14},
  cellAddress: {color: colors.gray, fontSize: 12, fontWeight: '500'},
  cellTitle: {color: colors.black, fontSize: 15, fontWeight: '700'},
  cellTitleBlock: {flex: 1, gap: 6},
  cellTop: {alignItems: 'flex-start', flexDirection: 'row', gap: 10},
  chevron: {
    color: colors.gray2,
    fontSize: 25,
    fontWeight: '600',
    height: 28,
    lineHeight: 25,
    textAlign: 'center',
    width: 16,
  },
  content: {gap: 18, paddingBottom: 32, paddingHorizontal: 15, paddingTop: 16},
  filterRow: {gap: 8},
  list: {gap: 10},
  metaDivider: {backgroundColor: colors.gray3, borderRadius: 2, height: 3, width: 3},
  metaRow: {alignItems: 'center', flexDirection: 'row', gap: 8},
  metaText: {color: colors.gray2, flexShrink: 1, fontSize: 11, fontWeight: '500'},
  pressed: {opacity: 0.65},
  retryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.orange,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
  },
  retryText: {color: colors.white, fontSize: 14, fontWeight: '600'},
  screen: {backgroundColor: colors.background, flex: 1},
  stateBox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    gap: 12,
    height: 220,
    justifyContent: 'center',
    padding: 20,
  },
  stateIcon: {color: colors.orange, fontSize: 28},
  stateText: {color: colors.gray, fontSize: 13, fontWeight: '500', textAlign: 'center'},
  summaryCount: {color: colors.black, fontSize: 20, fontWeight: '700'},
  summaryRow: {flexDirection: 'row', gap: 8},
  summaryTile: {
    backgroundColor: colors.white,
    borderRadius: 8,
    flex: 1,
    gap: 6,
    height: 72,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  summaryTitle: {color: colors.gray, fontSize: 12, fontWeight: '500'},
});
