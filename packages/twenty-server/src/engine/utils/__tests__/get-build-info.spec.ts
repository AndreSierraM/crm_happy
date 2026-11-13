import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  UNKNOWN_GIT_SHA,
  getBuildInfo,
} from 'src/engine/utils/get-build-info.util';

describe('getBuildInfo', () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'build-info-'),
  );
  const presentFilePath = path.join(temporaryDirectory, 'build-info.json');
  const malformedFilePath = path.join(
    temporaryDirectory,
    'build-info-malformed.json',
  );
  const missingFilePath = path.join(
    temporaryDirectory,
    'build-info-missing.json',
  );

  beforeAll(() => {
    fs.writeFileSync(
      presentFilePath,
      JSON.stringify({ gitSha: '52588b002fde9290db83dbface4bf658a858cf37' }),
    );
    fs.writeFileSync(malformedFilePath, '{not-json');
  });

  afterAll(() => {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('should return the stamped sha when the file is present', () => {
    expect(getBuildInfo(presentFilePath)).toEqual({
      gitSha: '52588b002fde9290db83dbface4bf658a858cf37',
    });
  });

  it('should return unknown when the file is absent', () => {
    expect(getBuildInfo(missingFilePath)).toEqual({
      gitSha: UNKNOWN_GIT_SHA,
    });
  });

  it('should return unknown when the file is malformed', () => {
    expect(getBuildInfo(malformedFilePath)).toEqual({
      gitSha: UNKNOWN_GIT_SHA,
    });
  });

  it('should return unknown from a checkout without a stamped file', () => {
    expect(getBuildInfo()).toEqual({ gitSha: UNKNOWN_GIT_SHA });
  });
});
