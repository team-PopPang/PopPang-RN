import React from 'react';
import type {PopupSubmissionFilter} from '../../domain/entities/PopupSubmissionListItem';
import {GetPopupSubmissions} from '../../domain/usecases/GetPopupSubmissions';
import type {PopupRequestManagementRepository} from '../../domain/repositories/PopupRequestManagementRepository';

export function usePopupRequestManagement(
  adminUuid: string,
  repository: PopupRequestManagementRepository,
) {
  const getPopupSubmissions = React.useMemo(
    () => new GetPopupSubmissions(repository),
    [repository],
  );
  const [selectedFilter, setSelectedFilter] =
    React.useState<PopupSubmissionFilter>('전체');
  const [allItems, setAllItems] = React.useState<
    Awaited<ReturnType<GetPopupSubmissions['execute']>>
  >([]);
  const [items, setItems] = React.useState<
    Awaited<ReturnType<GetPopupSubmissions['execute']>>
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const requestId = React.useRef(0);

  const load = React.useCallback(
    async (filter: PopupSubmissionFilter) => {
      const currentRequestId = ++requestId.current;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [summaryItems, filteredItems] =
          filter === '전체'
            ? await getPopupSubmissions
                .execute(adminUuid, '전체')
                .then(result => [result, result] as const)
            : await Promise.all([
                getPopupSubmissions.execute(adminUuid, '전체'),
                getPopupSubmissions.execute(adminUuid, filter),
              ]);
        if (requestId.current !== currentRequestId) return;
        setAllItems(summaryItems);
        setItems(filteredItems);
      } catch (error) {
        if (requestId.current !== currentRequestId) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '팝업 제보를 불러오지 못했습니다.',
        );
      } finally {
        if (requestId.current === currentRequestId) setIsLoading(false);
      }
    },
    [adminUuid, getPopupSubmissions],
  );

  React.useEffect(() => {
    if (!adminUuid.trim()) {
      setErrorMessage('관리자 UUID를 입력해 주세요.');
      return;
    }
    load(selectedFilter);
  }, [adminUuid, load, selectedFilter]);

  const refresh = React.useCallback(
    () => load(selectedFilter),
    [load, selectedFilter],
  );

  return {
    allItems,
    errorMessage,
    isLoading,
    items,
    refresh,
    selectedFilter,
    selectFilter: setSelectedFilter,
  };
}
