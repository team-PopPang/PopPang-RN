import React from 'react';
import {
  createInitialPopupRequestForm,
  mapPopupRequest,
  validatePopupRequest,
} from '../../application/popupRequestForm';
import type {PopupRequestForm} from '../../domain/entities/PopupRequestForm';
import type {Recommend} from '../../domain/entities/Recommend';
import type {PopupRequestRepository} from '../../domain/repositories/PopupRequestRepository';
import {GetRecommendList} from '../../domain/usecases/GetRecommendList';
import {SubmitPopupRequest} from '../../domain/usecases/SubmitPopupRequest';

export function usePopupRequest(
  userUuid: string,
  repository: PopupRequestRepository,
) {
  const [form, setForm] = React.useState(createInitialPopupRequestForm);
  const [recommends, setRecommends] = React.useState<Recommend[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    new GetRecommendList(repository)
      .execute()
      .then(items => active && setRecommends(items))
      .catch(() => active && setRecommends([]));
    return () => {
      active = false;
    };
  }, [repository]);

  const update = React.useCallback(
    <K extends keyof PopupRequestForm>(key: K, value: PopupRequestForm[K]) => {
      setForm(current => ({...current, [key]: value}));
    },
    [],
  );

  const toggleRecommend = React.useCallback((id: number) => {
    setForm(current => ({
      ...current,
      selectedRecommendIds: current.selectedRecommendIds.includes(id)
        ? current.selectedRecommendIds.filter(item => item !== id)
        : [...current.selectedRecommendIds, id],
    }));
  }, []);

  const addImages = React.useCallback(
    (images: PopupRequestForm['images']) => {
      setForm(current => ({
        ...current,
        images: [...current.images, ...images],
      }));
    },
    [],
  );

  const removeImage = React.useCallback((id: string) => {
    setForm(current => ({
      ...current,
      images: current.images.filter(image => image.id !== id),
    }));
  }, []);

  const submit = React.useCallback(async () => {
    const validationError = validatePopupRequest(form, userUuid);
    if (validationError) return {error: validationError, success: false};

    setIsSubmitting(true);
    try {
      await new SubmitPopupRequest(repository).execute(
        mapPopupRequest(form, userUuid),
        form.images,
      );
      return {error: null, success: true};
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '제출에 실패했습니다.',
        success: false,
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [form, repository, userUuid]);

  return {
    addImages,
    form,
    isSubmitting,
    recommends,
    removeImage,
    submit,
    toggleRecommend,
    update,
  };
}
