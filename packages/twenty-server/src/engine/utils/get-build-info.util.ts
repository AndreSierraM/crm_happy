import fs from 'fs';
import path from 'path';

import { isDefined, isNonEmptyString } from 'twenty-shared/utils';

export type BuildInfo = {
  gitSha: string;
};

export const UNKNOWN_GIT_SHA = 'unknown';

const BUILD_INFO_FILE_NAME = 'build-info.json';

// The image build stamps dist/build-info.json; local checkouts lack the file and report unknown.
export const getBuildInfo = (buildInfoFilePath?: string): BuildInfo => {
  const resolvedFilePath = isNonEmptyString(buildInfoFilePath)
    ? buildInfoFilePath
    : path.join(__dirname, '..', '..', BUILD_INFO_FILE_NAME);

  try {
    const parsed: unknown = JSON.parse(
      fs.readFileSync(resolvedFilePath, 'utf8'),
    );

    if (!isDefined(parsed) || typeof parsed !== 'object') {
      return { gitSha: UNKNOWN_GIT_SHA };
    }

    const gitSha: unknown = (parsed as Partial<BuildInfo>).gitSha;

    return { gitSha: isNonEmptyString(gitSha) ? gitSha : UNKNOWN_GIT_SHA };
  } catch {
    return { gitSha: UNKNOWN_GIT_SHA };
  }
};
