<template>
    <div class="az-result">
        <div class="az-result__headline">
            <span>Contrast</span>

            <button
                class="az-result__reverse"
                type="button"
                @click="emit('reverse')"
            >
                Reverse
            </button>
        </div>

        <div class="az-result__ratio">
            {{ formattedRatio }}<span class="az-result__separator">:</span>1
        </div>

        <button
            v-if="findColorTarget"
            class="az-result__button"
            :class="findColorTarget === 'text' ? 'az-result__button--mint' : 'az-result__button--navy'"
            type="button"
            :aria-disabled="findingColor !== null"
            @click="emit('find-color', $event)"
        >
            {{ findColorTarget === 'text' ? 'Find AAA text color' : 'Find AAA background color' }}
        </button>
    </div>
</template>

<script lang="ts" setup>
defineProps<{
    findColorTarget: 'text' | 'background' | null
    findingColor: 'text' | 'background' | null
    formattedRatio: string
}>()

const emit = defineEmits<{
    'find-color': [event: MouseEvent]
    reverse: []
}>()
</script>

<style lang="scss" scoped>
.az-result {
    display: flex;
    flex-direction: column;
    gap: 8px;

    &__headline {
        padding-inline: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 15px;
        line-height: 1em;
        color: $color-milk-400;
        text-align: left;
    }

    &__reverse {
        color: $color-grey-200;

        &:hover {
            color: $color-milk-400;
        }

        &:focus-visible {
            @include focus-ring($color-grey-400, 4px);
        }
    }

    &__button {
        width: 100%;
        padding: 20px 12px;
        align-self: center;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 500;
        line-height: 1em;
        color: $color-milk-100;
        text-transform: uppercase;

        &:focus-visible {
            @include focus-ring($color-grey-400, 12px);
        }

        &[aria-disabled='true'] {
            cursor: wait;
        }

        &--mint {
            background: $color-mint-300;

            &:hover {
                background: $color-mint-400;
            }
        }

        &--navy {
            background: $color-navy-200;

            &:hover {
                background: $color-navy-300;
            }
        }
    }

    &__ratio {
        margin-block-end: 16px;
        font-size: 96px;
        font-weight: 700;
        line-height: 1em;
        color: $color-grey-300;
        text-align: center;

        @media (max-width: 360px) {
            font-size: 84px;
        }
    }

    &__separator {
        color: $color-milk-300;
    }
}
</style>