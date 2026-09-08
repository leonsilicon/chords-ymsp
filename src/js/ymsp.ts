import { tasksMap } from "yabai-master-stack-plugin";
import { hasOwn } from '@voxpelli/typed-utils'

export default function buildAction() {
  return async function action(taskSlug: string) {
    if (!hasOwn(tasksMap, taskSlug)) {
      throw new Error(`ymsp task ${taskSlug} not found`)
    }

    const task = tasksMap[taskSlug]
    await task();
  }
}
