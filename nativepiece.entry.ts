import { defineModule } from '@team-poppang/nativepiece-runtime';
import contract from './nativepiece.contract';
import { PopupRequestManagementScreenRoot, PopupRequestScreenRoot } from './src/nativepiece/screens';

export default defineModule(contract, {
  popupRequest: PopupRequestScreenRoot,
  popupRequestManagement: PopupRequestManagementScreenRoot,
});
