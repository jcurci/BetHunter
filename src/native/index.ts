export {
  enableBlocker,
  disableBlocker,
  getStatus,
  updateBlocklist,
  addCustomDomain,
  addCustomApp,
  getBlockedAttempts,
  requestPermissions,
  checkPermissions,
  setBlockedDomainsCache,
  getBlockedDomainsCache,
  getBlocklistUpdatedAt,
  isNativeBlockerAvailable,
  BLOCKER_STORAGE_KEYS,
} from './GamblingBlocker';
export type { BlockerConfig, BlockAttempt, BlockerStatus, PermissionStatus } from './GamblingBlocker.types';
