<script lang="ts">
    import { resolve } from "$app/paths";
    import Button from "./Button.svelte";

    import Icon from "@iconify/svelte";

    let isPlaying = $state(false);

    const root = resolve("/");
    const tracks = [`${root}SustainSJ_Rec1.mp3`, `${root}SustainSJ_Rec2.mp3`];
    let track_id = 0;

    let audioFile: HTMLAudioElement;

    function onclick() {
        if (!isPlaying) {
            audioFile = new Audio(tracks[track_id]);
            audioFile.play();
            audioFile.loop = true;
        } else {
            track_id = (track_id + 1) % tracks.length;
            audioFile?.pause();
        }

        isPlaying = !isPlaying;
    }

    let iconName = $derived(
        isPlaying ? "fluent:pause-20-filled" : "fluent:play-20-filled",
    );
</script>

<Button {onclick}>
    <Icon icon={iconName} inline={true} />
</Button>
