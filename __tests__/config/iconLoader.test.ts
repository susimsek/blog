// __tests__/config/iconLoader.test.tsx
import { library } from '@fortawesome/fontawesome-svg-core';
import { faComments, faImages } from '@fortawesome/free-solid-svg-icons';
import { loadIcons } from '@/config/iconLoader';
import { faSidebar } from '@/lib/icons';

jest.mock('@fortawesome/fontawesome-svg-core', () => ({
  library: {
    add: jest.fn(),
  },
}));

describe('Icon Loader - faSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add faSidebar, faComments, and faImages to the library', () => {
    loadIcons();

    const addedIcons = (library.add as jest.Mock).mock.calls.flat();

    expect(addedIcons).toContain(faSidebar);
    expect(addedIcons).toContain(faComments);
    expect(addedIcons).toContain(faImages);

    expect(library.add).toHaveBeenCalledTimes(1);
  });
});
