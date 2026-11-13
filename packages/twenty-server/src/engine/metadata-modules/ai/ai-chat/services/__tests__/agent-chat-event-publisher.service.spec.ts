import { AgentChatEventPublisherService } from 'src/engine/metadata-modules/ai/ai-chat/services/agent-chat-event-publisher.service';

const WORKSPACE_A_ID = 'workspace-a-id';
const WORKSPACE_B_ID = 'workspace-b-id';
const THREAD_ID = 'thread-id';
const STREAM_A_ID = 'stream-a-id';
const STREAM_B_ID = 'stream-b-id';

type FakeRedisMulti = {
  del: (key: string) => FakeRedisMulti;
  set: (key: string, value: string, ...rest: unknown[]) => FakeRedisMulti;
  exec: () => Promise<unknown[]>;
};

type FakeRedisClient = {
  rpush: (key: string, value: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  del: (...keys: string[]) => Promise<number>;
  lrange: (key: string, start: number, stop: number) => Promise<string[]>;
  multi: () => FakeRedisMulti;
  eval: (
    script: string,
    keyCount: number,
    ...keysAndArgs: string[]
  ) => Promise<null>;
};

const buildFakeRedisClient = (): FakeRedisClient => {
  const lists = new Map<string, string[]>();
  const values = new Map<string, string>();

  const deleteKeys = (keys: string[]): number => {
    let removedCount = 0;

    for (const key of keys) {
      if (lists.delete(key)) {
        removedCount += 1;
      }

      if (values.delete(key)) {
        removedCount += 1;
      }
    }

    return removedCount;
  };

  return {
    rpush: async (key: string, value: string) => {
      const list = lists.get(key) ?? [];
      list.push(value);
      lists.set(key, list);

      return list.length;
    },
    expire: async () => 1,
    del: async (...keys: string[]) => deleteKeys(keys),
    lrange: async (key: string, start: number, stop: number) => {
      const list = lists.get(key) ?? [];

      return list.slice(start, stop === -1 ? undefined : stop + 1);
    },
    multi: () => {
      const operations: (() => void)[] = [];
      const multi: FakeRedisMulti = {
        del: (key: string) => {
          operations.push(() => {
            deleteKeys([key]);
          });

          return multi;
        },
        set: (key: string, value: string) => {
          operations.push(() => {
            values.set(key, value);
          });

          return multi;
        },
        exec: async () => {
          for (const operation of operations) {
            operation();
          }

          return [];
        },
      };

      return multi;
    },
    // Runs the owned-reset script the publisher sends, nothing else
    eval: async (
      _script: string,
      keyCount: number,
      ...keysAndArgs: string[]
    ) => {
      const keys = keysAndArgs.slice(0, keyCount);
      const args = keysAndArgs.slice(keyCount);

      if (values.get(keys[1]) === args[0]) {
        deleteKeys([keys[0], keys[1]]);
      }

      return null;
    },
  };
};

const buildService = () => {
  const subscriptionService = { publishToAgentChat: jest.fn() };
  const redisClientService = { getClient: () => buildFakeRedisClient() };

  // One shared client stands in for the Redis server both workspaces reach
  const sharedClient = buildFakeRedisClient();
  redisClientService.getClient = () => sharedClient;

  const service = new AgentChatEventPublisherService(
    subscriptionService as never,
    redisClientService as never,
  );

  return { service, sharedClient };
};

const publishChunk = (
  service: AgentChatEventPublisherService,
  workspaceId: string,
  text: string,
) =>
  service.publish({
    threadId: THREAD_ID,
    workspaceId,
    event: { type: 'stream-chunk', chunk: { type: 'text-delta', text } },
  });

describe('AgentChatEventPublisherService workspace isolation', () => {
  it('keeps accumulated chunks of colliding thread ids within their workspace', async () => {
    const { service } = buildService();

    await publishChunk(service, WORKSPACE_A_ID, 'secret');

    await expect(
      service.getAccumulatedChunks(THREAD_ID, WORKSPACE_A_ID),
    ).resolves.toEqual({
      chunks: [{ type: 'text-delta', text: 'secret' }],
      maxSeq: 1,
    });

    await expect(
      service.getAccumulatedChunks(THREAD_ID, WORKSPACE_B_ID),
    ).resolves.toEqual({ chunks: [], maxSeq: 0 });
  });

  it('keeps stream ownership of colliding thread ids within their workspace', async () => {
    const { service } = buildService();

    await service.startStreamState({
      threadId: THREAD_ID,
      streamId: STREAM_A_ID,
      workspaceId: WORKSPACE_A_ID,
    });
    await publishChunk(service, WORKSPACE_A_ID, 'alpha');

    await service.startStreamState({
      threadId: THREAD_ID,
      streamId: STREAM_B_ID,
      workspaceId: WORKSPACE_B_ID,
    });
    await publishChunk(service, WORKSPACE_B_ID, 'beta');

    await service.resetOwnedStreamState({
      threadId: THREAD_ID,
      streamId: STREAM_A_ID,
      workspaceId: WORKSPACE_A_ID,
    });

    await expect(
      service.getAccumulatedChunks(THREAD_ID, WORKSPACE_A_ID),
    ).resolves.toEqual({ chunks: [], maxSeq: 0 });
    await expect(
      service.getAccumulatedChunks(THREAD_ID, WORKSPACE_B_ID),
    ).resolves.toEqual({
      chunks: [{ type: 'text-delta', text: 'beta' }],
      maxSeq: 1,
    });
  });

  it('clears only the owning workspace when its stream state is reset', async () => {
    const { service } = buildService();

    await publishChunk(service, WORKSPACE_A_ID, 'alpha');
    await publishChunk(service, WORKSPACE_B_ID, 'beta');

    await service.resetStreamState(THREAD_ID, WORKSPACE_A_ID);

    await expect(
      service.getAccumulatedChunks(THREAD_ID, WORKSPACE_A_ID),
    ).resolves.toEqual({ chunks: [], maxSeq: 0 });
    await expect(
      service.getAccumulatedChunks(THREAD_ID, WORKSPACE_B_ID),
    ).resolves.toEqual({
      chunks: [{ type: 'text-delta', text: 'beta' }],
      maxSeq: 1,
    });
  });
});
