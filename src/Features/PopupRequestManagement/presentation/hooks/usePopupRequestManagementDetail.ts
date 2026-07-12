import React from 'react';
import type {PopupRequestManagementRepository} from '../../domain/repositories/PopupRequestManagementRepository';
import {GetPopupSubmissionDetail} from '../../domain/usecases/GetPopupSubmissionDetail';
import {UpdatePopupSubmission} from '../../domain/usecases/UpdatePopupSubmission';
import {
  adminFormFromDetail,
  type PopupSubmissionAdminForm,
} from '../../domain/entities/PopupSubmissionAdminUpdate';
import type {Recommend} from '../../../PopupRequest/domain/entities/Recommend';

export function usePopupRequestManagementDetail(
  adminUuid: string,
  submissionId: number,
  repository: PopupRequestManagementRepository,
) {
  const usecase = React.useMemo(
    () => new GetPopupSubmissionDetail(repository),
    [repository],
  );
  const updateUsecase = React.useMemo(
    () => new UpdatePopupSubmission(repository),
    [repository],
  );
  const [detail, setDetail] = React.useState<
    Awaited<ReturnType<GetPopupSubmissionDetail['execute']>> | null
  >(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<PopupSubmissionAdminForm | null>(null);
  const [recommends, setRecommends] = React.useState<Recommend[]>([]);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [loadedDetail, loadedRecommends] = await Promise.all([
        usecase.execute(adminUuid, submissionId),
        repository.getRecommendList(),
      ]);
      setDetail(loadedDetail);
      setForm(adminFormFromDetail(loadedDetail));
      setRecommends(loadedRecommends);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '팝업 제보 상세 정보를 불러오지 못했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminUuid, repository, submissionId, usecase]);

  React.useEffect(() => {
    load();
  }, [load]);

  const update = React.useCallback(
    <K extends keyof PopupSubmissionAdminForm>(
      key: K,
      value: PopupSubmissionAdminForm[K],
    ) => setForm(current => (current ? {...current, [key]: value} : current)),
    [],
  );

  const submit = React.useCallback(
    async (status: 'APPROVED' | 'REJECTED') => {
      setIsSubmitting(true);
      try {
        return await updateUsecase.execute(
          adminUuid,
          submissionId,
          status,
          status === 'APPROVED' ? form ?? undefined : undefined,
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [adminUuid, form, submissionId, updateUsecase],
  );

  return {
    detail,
    errorMessage,
    form,
    isLoading,
    isSubmitting,
    recommends,
    refresh: load,
    submit,
    update,
  };
}
