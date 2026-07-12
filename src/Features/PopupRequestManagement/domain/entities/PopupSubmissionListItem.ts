export type PopupSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PopupSubmissionListItem = {
  id: number;
  name: string;
  roadAddress: string;
  region: string;
  submitterUserUuid: string;
  submitterNickname: string;
  submittedAt: string;
  status: PopupSubmissionStatus;
};

export const popupSubmissionFilters = [
  {label: '전체', value: '전체'},
  {label: '대기', value: '대기'},
  {label: '승인', value: '승인'},
  {label: '반려', value: '반려'},
] as const;

export type PopupSubmissionFilter =
  (typeof popupSubmissionFilters)[number]['value'];
