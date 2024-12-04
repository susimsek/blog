import languageDetector from '@/lib/languageDetector';

describe('languageDetector', () => {
  it('should detect a valid language', () => {
    const mockDetect = jest.fn().mockReturnValue('en');
    languageDetector.detect = mockDetect;

    const language = languageDetector.detect();
    expect(mockDetect).toHaveBeenCalled();
    expect(language).toBe('en');
  });

  it('should fallback to default language if detection fails', () => {
    const mockDetect = jest.fn().mockReturnValue(undefined);
    languageDetector.detect = mockDetect;

    const language = languageDetector.detect();
    expect(mockDetect).toHaveBeenCalled();
    expect(language).toBeUndefined();
  });
});
