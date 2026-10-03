<template>
    <div class="az-contrast">
        <div class="az-contrast__inputs">
            <BlockInput
                ref="textColorInputRef"
                v-model="textColor"
                :aria-invalid="textColorError ? 'true' : 'false'"
                :border-color="findingColor === 'text' ? 'var(--contrast-text-highlight-color)' : undefined"
                :error="textColorError"
                :focus-color="findingColor === 'text' ? 'var(--contrast-text-highlight-color)' : undefined"
                type="text"
                spellcheck="false"
                @blur="onColorBlur('text')"
            >
                <template #label>
                    <span>Text color</span>
                    <span class="az-contrast__format">{{ textFormat }}</span>
                </template>

                <template
                    v-if="textPreview"
                    #append
                >
                    <span
                        class="az-contrast__preview"
                        :style="{ backgroundColor: textPreview }"
                        aria-hidden="true"
                    />
                </template>
            </BlockInput>

            <BlockInput
                ref="backgroundColorInputRef"
                v-model="backgroundColor"
                :aria-invalid="backgroundColorError ? 'true' : 'false'"
                :border-color="findingColor === 'background' ? 'var(--contrast-background-highlight-color)' : undefined"
                :error="backgroundColorError"
                :focus-color="findingColor === 'background' ? 'var(--contrast-background-highlight-color)' : undefined"
                type="text"
                spellcheck="false"
                @blur="onColorBlur('background')"
            >
                <template #label>
                    <span>Background color</span>
                    <span class="az-contrast__format">{{ backgroundFormat }}</span>
                </template>

                <template
                    v-if="backgroundPreview"
                    #append
                >
                    <span
                        class="az-contrast__preview"
                        :style="{ backgroundColor: backgroundPreview }"
                        aria-hidden="true"
                    />
                </template>
            </BlockInput>
        </div>

        <BlockResult
            :finding-color="findingColor"
            :find-color-target="findColorTarget"
            :formatted-ratio="formattedRatio"
            @find-color="onFindColor"
            @reverse="onReverseColors"
        />

        <BlockGuidelines
            :contrast-ratio="contrastRatio"
            :guidelines="guidelines"
        />

        <div
            class="az-contrast__announcement"
            aria-live="polite"
            aria-atomic="true"
        >
            {{ announcement }}
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    nextTick,
    onBeforeUnmount,
    ref,
    useTemplateRef,
    watch
} from 'vue'

import { useContrastChecker } from '@/composables/useContrastChecker'

import BlockGuidelines from '@/components/BlockGuidelines.vue'
import BlockInput from '@/components/BlockInput.vue'
import BlockResult from '@/components/BlockResult.vue'

const {
    announcement,
    backgroundColor,
    backgroundFormat,
    backgroundPreview,
    contrastRatio,
    findBackgroundColor,
    findColorTarget,
    findTextColor,
    formattedRatio,
    getErrorMessage,
    guidelines,
    normalizeColor,
    reverseColors,
    textColor,
    textFormat,
    textPreview
} = useContrastChecker()

const textColorInputRef = useTemplateRef<InstanceType<typeof BlockInput>>(
    'textColorInputRef'
)
const backgroundColorInputRef = useTemplateRef<InstanceType<typeof BlockInput>>(
    'backgroundColorInputRef'
)

const findingColor = ref<'text' | 'background' | null>(null)
const backgroundColorError = ref('')
const textColorError = ref('')
let colorTimeout: ReturnType<typeof setTimeout> | undefined

const onColorBlur = (target: 'text' | 'background') => {
    const color = target === 'text' ? textColor : backgroundColor

    color.value = normalizeColor(color.value, true)

    if (target === 'text') {
        textColorError.value = getErrorMessage(textColor.value)
    } else {
        backgroundColorError.value = getErrorMessage(backgroundColor.value)
    }
}

const onReverseColors = () => {
    reverseColors()

    textColorError.value = getErrorMessage(textColor.value)
    backgroundColorError.value = getErrorMessage(backgroundColor.value)
}

const cancelFindColor = () => {
    clearTimeout(colorTimeout)
    findingColor.value = null
}

const onFindColor = (event: MouseEvent) => {
    const target = findColorTarget.value

    if (findingColor.value || !target) {
        return
    }

    const openedBy = event.detail === 0 ? 'keyboard' : 'mouse'

    findingColor.value = target

    colorTimeout = setTimeout(async () => {
        if (target === 'text') {
            findTextColor()
        } else {
            findBackgroundColor()
        }

        findingColor.value = null

        await nextTick()

        if (target === 'text') {
            textColorInputRef.value?.focusInput(openedBy)
        } else {
            backgroundColorInputRef.value?.focusInput(openedBy)
        }
    }, 500)
}

watch([backgroundColor, backgroundPreview], () => {
    if (backgroundColorError.value) {
        backgroundColorError.value = getErrorMessage(backgroundColor.value)
    }
})

watch([textColor, textPreview], () => {
    if (textColorError.value) {
        textColorError.value = getErrorMessage(textColor.value)
    }
})

watch([textColor, backgroundColor], cancelFindColor, { flush: 'sync' })

onBeforeUnmount(cancelFindColor)
</script>

<style lang="scss" scoped>
.az-contrast {
    --contrast-text-highlight-color: #{$color-mint-300};
    --contrast-background-highlight-color: #{$color-navy-200};

    width: 100%;
    padding-inline: 36px;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 36px;
    color: $color-grey-400;

    @media (max-width: 360px) {
        padding-inline: 24px;
    }

    &__inputs {
        display: flex;
        flex-direction: column;
        gap: 36px;
    }

    &__format {
        padding: 0 4px;
        font-size: 13px;
        color: $color-grey-200;
    }

    &__preview {
        width: 44px;
        height: 44px;
        display: block;
        border-radius: 50%;
    }

    &__announcement {
        position: absolute;
        overflow: hidden;
        width: 1px;
        height: 1px;
        padding: 0;
        border: 0;
        white-space: nowrap;
        clip-path: inset(50%);
    }
}
</style>