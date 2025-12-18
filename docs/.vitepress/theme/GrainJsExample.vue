<script setup>

  // This is a component that may be included immediately below a markdown code block to create a
  // preview of that codeblock in an iframe. The actual implementation is in GrainJsExample.js,
  // but we create a Vue component so that it integrates better into markdown rendering, and gets
  // properly recreated e.g. on live updates.

  import { ref, onMounted } from 'vue';
  import { prepareExample } from './GrainJsExample';
  const el = ref();
  const props = defineProps(['heightRem'])
  onMounted(() => { prepareExample(el.value, props.heightRem); });

</script>

<template>
  <div ref="el"></div>
</template>
