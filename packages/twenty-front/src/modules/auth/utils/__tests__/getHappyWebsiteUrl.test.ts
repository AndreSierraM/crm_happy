import { getHappyWebsiteUrl } from '@/auth/utils/getHappyWebsiteUrl';

describe('getHappyWebsiteUrl', () => {
  it('links the Happy BPO website', () => {
    expect(getHappyWebsiteUrl()).toBe('https://happybpo.co');
  });
});
