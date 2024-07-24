import { MockedFunction, vi } from 'vitest'
import { MakeRequest } from '../../../lib/common-types'

export default function setupMakeRequest(
  promise: Promise<unknown> = Promise.resolve({ data: {} })
): MockedFunction<MakeRequest> & MakeRequest {
  return vi.fn().mockReturnValue(promise)
}
