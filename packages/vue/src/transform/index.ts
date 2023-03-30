import type { Component, ExtractPropTypes } from 'vue-demi'
import { provide, ref } from 'vue-demi'

import type { ImperativePromise } from '@unoverlays/utils'
import { createImperativePromiser, noop } from '@unoverlays/utils'
import { renderChildApp } from '../helper/render'
import type { MountOptions } from '../types'
import { OverlayMetaKey } from '../internal'

import { useVisibleScripts } from '../hooks'

export interface ImperativeOverlay<Props, Resolved> {
  (props?: ExtractPropTypes<Props>, options?: MountOptions): ImperativePromise<Resolved>
}

export interface RenderOptions<Props> extends MountOptions {
  props?: ExtractPropTypes<Props>
}

/**
 * Create imperative overlay
 * @param component Component
 */
export function defineOverlay<Props, Resolved = void>(component: Component, options?: MountOptions): ImperativeOverlay<Props, Resolved> {
  function executor(props: any, opts?: MountOptions) {
    const promiser = createImperativePromiser()
    const caches = { vanish: noop }
    function setup() {
      const visible = ref(false)
      const scripts = useVisibleScripts(visible, Object.assign(caches, { promiser }))
      provide(OverlayMetaKey, scripts)
    }
    caches.vanish = renderChildApp(component, props, { ...opts, setup }).vanish
    return promiser.promise as unknown as ImperativePromise<Resolved>
  }

  let inst: ImperativePromise<Resolved> | undefined
  function only(props: any, opts?: MountOptions) {
    if (!inst) {
      inst = executor(props, opts)
      inst.finally(() => inst = undefined)
    }
    return inst
  }
  function caller(props: any, opts?: MountOptions) {
    opts = { ...options, ...opts }
    return opts.only ? only(props, opts) : executor(props, opts)
  }

  return caller
}

/**
 * Execute overlay component
 * @param component Component
 * @param options mount options and props
 */
export function renderOverlay<Props = unknown, Resolved = void>(
  component: Component,
  options: RenderOptions<Props> = {},
) {
  return defineOverlay<Props, Resolved>(component)(options.props, options)
}
