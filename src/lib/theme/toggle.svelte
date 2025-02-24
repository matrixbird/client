<script>
import { browser } from '$app/environment';
let toggle = () => {
    const darkClassActive = document.documentElement.classList.contains('dark');
    console.log("darkClassActive", darkClassActive)
    if(darkClassActive) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

let el;

</script>

<div class="toggle grid relative place-items-center my-[20px]" >
    <button class="font-bold py-2 px-4" onclick={toggle}>Toggle</button>
</div>

<style>
.toggle {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
}
</style>
