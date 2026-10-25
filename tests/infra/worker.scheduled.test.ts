// @vitest-environment node
import { expect, it } from 'vitest'
import worker from '../../src/infra/worker'

it('scheduled는 저장소 의존성이 없으면 조용히 종료한다', async () => {
  let task: Promise<unknown> | undefined
  worker.scheduled({} as ScheduledController, { ENVIRONMENT: 'test' } as Env, {
    waitUntil: (promise: Promise<unknown>) => { task = promise },
  } as ExecutionContext)
  await expect(task).resolves.toBeUndefined()
})
