// driveService.test.js
import { listFiles } from './driveService.js';

describe('Drive Service', () => {
  it('should list files with pagination', async () => {
    const files = await listFiles({ limit: 10, offset: 0 });
    expect(files).toBeDefined();
    expect(Array.isArray(files.files)).toBe(true);
    expect(files.files.length).toBeLessThanOrEqual(10);
  });
});