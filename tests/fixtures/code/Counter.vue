<template>
	<button :class="{ active }" @click="count++">{{ label }}: {{ count }}</button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
defineProps<{ label: string; active?: boolean }>();
const count = ref(0);
</script>

<style scoped>
button.active { font-weight: 700; }
</style>
