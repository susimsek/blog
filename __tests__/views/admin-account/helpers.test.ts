import { resolveConnectedAccountMessage } from '@/views/admin-account/helpers';

const translate = (key: string) => key;

describe('admin-account helpers', () => {
  it('resolves provider callback states to the expected variant and message key', () => {
    expect(resolveConnectedAccountMessage('google', 'connected', translate)).toEqual({
      variant: 'success',
      message: 'adminAccount.connectedAccounts.google.messages.connected',
    });

    expect(resolveConnectedAccountMessage('github', 'cancelled', translate)).toEqual({
      variant: 'info',
      message: 'adminAccount.connectedAccounts.github.messages.cancelled',
    });

    expect(resolveConnectedAccountMessage('google', 'not-linked', translate)).toEqual({
      variant: 'danger',
      message: 'adminAccount.connectedAccounts.google.messages.notLinked',
    });
  });

  it('falls back to the provider failure message for unknown states', () => {
    expect(resolveConnectedAccountMessage('github', 'unexpected', translate)).toEqual({
      variant: 'danger',
      message: 'adminAccount.connectedAccounts.github.messages.failed',
    });
  });
});
