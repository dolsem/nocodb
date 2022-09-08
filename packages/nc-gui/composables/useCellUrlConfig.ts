import type { MaybeRef } from '@vueuse/core'
import { computed, ref, unref, useInjectionState, useRoute } from '#imports'

export interface CellUrlOptions {
  behavior?: string
  overlay?: string
}

type ParsedRules = [RegExp, CellUrlOptions]

const parseUrlRules = (serialized?: string): ParsedRules[] | undefined => {
  if (!serialized) return undefined

  try {
    return Object.entries(JSON.parse(serialized)).map(([key, value]) => [new RegExp(key), value] as ParsedRules)
  } catch (err) {
    console.error(err)

    return undefined
  }
}

const [setup, use] = useInjectionState((url?: MaybeRef<string>) => {
  const route = useRoute()

  const _url = ref<string>(unref(url) ?? '')

  const disableOverlay = ref(false)

  const config = $computed(() => ({
    behavior: route.query.url_behavior as string | undefined,
    overlay: route.query.url_overlay as string | undefined,
    rules: parseUrlRules(route.query.url_rules as string),
  }))

  const cellUrlOptions = computed(() => {
    const options = { behavior: config.behavior, overlay: config.overlay }

    if (config.rules && (!config.behavior || !config.overlay)) {
      for (const [regex, value] of config.rules) {
        if (_url.value.match(regex)) return Object.assign(options, value)
      }
    }

    return options
  })

  return {
    cellUrlConfig: config,
    cellUrlOptions,
    disableOverlay,
    url: _url,
  }
}, 'cell-url-config')

export const provideCellUrlConfig = setup

export function useCellUrlConfig(url?: MaybeRef<string>, disableOverlay?: MaybeRef<boolean>) {
  const config = use()

  if (!config) {
    setup(url)
  } else {
    if (url) config.url.value = unref(url)
    if (disableOverlay) config.disableOverlay.value = unref(disableOverlay)
  }

  return config
}
