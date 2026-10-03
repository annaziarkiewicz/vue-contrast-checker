<template>
    <div
        class="az-guidelines"
        role="table"
        aria-label="WCAG contrast requirements"
    >
        <div
            class="az-guidelines__row"
            role="row"
        >
            <div role="columnheader">WCAG</div>

            <div
                v-for="level in levels"
                :key="level"
                role="columnheader"
            >
                {{ level.toUpperCase() }}
            </div>
        </div>

        <div
            v-for="row in guidelines"
            :key="row.label"
            class="az-guidelines__row"
            role="row"
        >
            <div
                class="az-guidelines__label"
                role="rowheader"
            >
                {{ row.label }}
            </div>

            <div
                v-for="level in levels"
                :key="level"
                class="az-guidelines__threshold"
                role="cell"
            >
                <span>{{ row[level] }}</span>

                <svg
                    v-if="contrastRatio !== null"
                    class="az-guidelines__status"
                    :class="contrastRatio >= row[level] ? 'az-guidelines__status--pass' : 'az-guidelines__status--fail'"
                    :aria-label="contrastRatio >= row[level] ? 'Pass' : 'Fail'"
                    role="img"
                    :viewBox="contrastRatio >= row[level] ? '0 0 122.88 122.88' : '0 0 122.879 122.879'"
                >
                    <path
                        v-if="contrastRatio >= row[level]"
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M61.44,0c33.932,0,61.44,27.508,61.44,61.44c0,33.932-27.508,61.439-61.44,61.439 C27.507,122.88,0,95.372,0,61.44C0,27.508,27.507,0,61.44,0L61.44,0z M34.258,63.075c0.824-4.78,6.28-7.44,10.584-4.851 c0.39,0.233,0.763,0.51,1.11,0.827l0.034,0.032c1.932,1.852,4.096,3.778,6.242,5.688l1.841,1.652l21.84-22.91 c1.304-1.366,2.259-2.25,4.216-2.689c6.701-1.478,11.412,6.712,6.663,11.719L59.565,81.108c-2.564,2.735-7.147,2.985-9.901,0.373 c-1.581-1.466-3.297-2.958-5.034-4.467c-3.007-2.613-6.077-5.28-8.577-7.919C34.551,67.595,33.903,65.139,34.258,63.075 L34.258,63.075z"
                    />

                    <path
                        v-else
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M61.44,0c33.933,0,61.439,27.507,61.439,61.439 s-27.506,61.439-61.439,61.439C27.507,122.879,0,95.372,0,61.439S27.507,0,61.44,0L61.44,0z M73.451,39.151 c2.75-2.793,7.221-2.805,9.986-0.027c2.764,2.776,2.775,7.292,0.027,10.083L71.4,61.445l12.076,12.249 c2.729,2.77,2.689,7.257-0.08,10.022c-2.773,2.765-7.23,2.758-9.955-0.013L61.446,71.54L49.428,83.728 c-2.75,2.793-7.22,2.805-9.986,0.027c-2.763-2.776-2.776-7.293-0.027-10.084L51.48,61.434L39.403,49.185 c-2.728-2.769-2.689-7.256,0.082-10.022c2.772-2.765,7.229-2.758,9.953,0.013l11.997,12.165L73.451,39.151L73.451,39.151z"
                    />
                </svg>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { ContrastGuideline } from '@/types/contrastChecker'

defineProps<{
    contrastRatio: number | null
    guidelines: ContrastGuideline[]
}>()

const levels = ['aa', 'aaa'] as const
</script>

<style lang="scss" scoped>
.az-guidelines {
    margin-block-start: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 15px;
    line-height: 1.35em;

    &__row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 56px 56px;
        align-items: center;
        gap: 36px;
        font-size: 20px;

        @media (max-width: 360px) {
            grid-template-columns: minmax(0, 1fr) 48px 48px;
            gap: 24px;
            font-size: 15px;
        }

        > [role='columnheader'] {
            font-size: 15px;
            color: $color-milk-400;
        }
    }

    &__label {
        font-size: 15px;
        color: $color-grey-300;
    }

    &__threshold {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        white-space: nowrap;

        > span:first-child {
            font-weight: 700;
            color: $color-grey-300;
        }
    }

    &__status {
        width: 20px;
        height: 20px;
        flex-shrink: 0;

        &--fail {
            fill: $color-rose-200;
        }

        &--pass {
            fill: $color-mint-300;
        }
    }
}
</style>