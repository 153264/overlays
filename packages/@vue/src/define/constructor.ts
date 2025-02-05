import { createConstructor } from '@overlays/core'
import { pascalCase } from 'pascal-case'
import type { AppContext, Component } from 'vue-demi'
import { createApp, defineComponent, h, provide } from 'vue-demi'

import { OverlayMetaKey } from '../internal'
import { useVisibleScripts } from '../composable'
import { inheritParent } from '../utils'

export interface VMountOptions {
  /** current app context */
  appContext?: AppContext
}

export const constructor = createConstructor<Component, VMountOptions>((Inst, props, options) => {
  const { container, id, deferred, appContext } = options

  function vanish() {
    app.unmount()
    container.remove()
  }

  const ChildApp = defineComponent({
    name: pascalCase(id),
    setup: () => {
      const scripts = useVisibleScripts({
        vanish,
        deferred,
      })
      provide(OverlayMetaKey, scripts)
    },
    render: () => h(Inst, props),
  })

  const app = createApp(ChildApp)

  inheritParent(app, appContext)

  app.mount(container)

  return vanish
})
