<script lang="ts">
import { browser } from '$app/environment';
import { page } from '$app/state';

import { ui_state } from '$lib/store/app.svelte'

import { createMatrixStore } from '$lib/store/matrix.svelte'
const matrixStore = createMatrixStore()


$effect(() => {
})

</script>
