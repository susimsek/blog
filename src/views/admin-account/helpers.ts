type ConnectedAccountProvider = 'google' | 'github';
type ConnectedAccountMessageVariant = 'success' | 'danger' | 'info';
type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

export const resolveConnectedAccountMessage = (
  provider: ConnectedAccountProvider,
  status: string,
  translate: AdminAccountTranslate,
): {
  variant: ConnectedAccountMessageVariant;
  message: string;
} => {
  const messagePrefix = `adminAccount.connectedAccounts.${provider}.messages`;

  switch (status) {
    case 'connected':
      return {
        variant: 'success',
        message: translate(`${messagePrefix}.connected`, { ns: 'admin-account' }),
      };
    case 'cancelled':
      return {
        variant: 'info',
        message: translate(`${messagePrefix}.cancelled`, { ns: 'admin-account' }),
      };
    case 'not-linked':
      return {
        variant: 'danger',
        message: translate(`${messagePrefix}.notLinked`, { ns: 'admin-account' }),
      };
    case 'conflict':
      return {
        variant: 'danger',
        message: translate(`${messagePrefix}.conflict`, { ns: 'admin-account' }),
      };
    default:
      return {
        variant: 'danger',
        message: translate(`${messagePrefix}.failed`, { ns: 'admin-account' }),
      };
  }
};
