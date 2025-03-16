<script lang="ts">
import {
    uploadImage,
} from '$lib/assets/icons'

import { createMatrixStore } from '$lib/store/matrix.svelte'
const store = createMatrixStore()

type Props = {
    setAvatarUrl: (url: string) => void,
}

let { 
    setAvatarUrl,
}: Props = $props();

let fileInput: HTMLInputElement;

function select() {
    fileInput.click()
}

let uploading = $state(false);
let avatar: string | null = $state(null);

let process = async (e: InputEvent) => {
    uploading = true;

    if(!e.target) return


    for(let i =0 ; i < e.target.files.length ; i++) {

        const file = e.target.files[i]

        if (file.size > 3145728) {
            alert("That's too large. 3MB max.")
            break
        }

        var image = new Image();
        image.src = URL.createObjectURL(file)
        image.onload = () => {
            file.info = {}
            file.info.h = image.height
            file.info.w = image.width
            image.remove()
            URL.revokeObjectURL(image.src);

            let width = image.width;
            let height = image.height;

            let scaleFactor = 1;

            if (width > height) {
                scaleFactor = 140 / height;
                width *= scaleFactor;
                height = 140;
            } else {
                scaleFactor = 140 / width;
                height *= scaleFactor;
                width = 140;
            }

            const canvas = document.createElement('canvas');
            canvas.width = 140;
            canvas.height = 140;

            const offsetX = (width - 140) / 2;
            const offsetY = (height - 140) / 2;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, -offsetX, -offsetY, width, height);


            canvas.toBlob(async function(blob: Blob) {
                avatar = URL.createObjectURL(blob);

                let upload = await store.client.uploadContent(blob)
                if(!upload?.content_uri) {
                    uploading = false
                    return
                }

                //setAvatarUrl(upload.content_uri)
                await store.client.setAvatarUrl(upload.content_uri)
                uploading = false


                /*
                await store.client.setAvatarUrl(upload.content_uri)
                uploading = false
                */

                //const extension = file.name.split('.').pop();
                //const presignedURL = await getPresignedURL(extension);
                //await uploadAttachment(blob, presignedURL.url);

                //dispatch('uploaded', presignedURL.key )
                //uploading = false

            });

        }


    }

}

</script>

<input bind:this={fileInput} onchange={process}  type="file" accept="image/*" id="upload-avatar" class="hidden" />

<div class="avatar-upload relative" class:animate-pulse={uploading}>
<div class="avatar group grid place-items-center text-xs bg-bird-900 rounded-[50%]
    w-20 h-20 cursor-pointer hover:bg-bird-800"
    style="background-image: url({avatar})"
    onclick={select}>

    {#if !avatar}
    <div class="font-semibold text-white uppercase opacity-70 duration-100
        group-hover:opacity-100">
            {@html uploadImage}
    </div>
    {/if}

</div>
    {#if uploading}
        <div class="absolute top-0 right-0 bottom-0 left-0 rounded-[50%] bg-bird-900 opacity-40">
        </div>
    {/if}

</div>

<style lang="postcss">
@reference "tailwindcss/theme";
img {
    border-radius: 50%;
}
.avatar {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}
</style>

