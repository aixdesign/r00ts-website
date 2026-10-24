<script lang="ts">
    import { asset } from "$app/paths";
    import Button from "./Button.svelte";

    import Icon from "@iconify/svelte";

    let isPlaying = $state(false);

    const tracks = [asset("SustainSJ_Rec1.mp3"), asset("SustainSJ_Rec2.mp3")];
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
        isPlaying ? "fluent:speaker-2-24-filled" : "fluent:speaker-0-24-filled",
    );
</script>

<Button {onclick}>
    Listen <Icon icon={iconName} inline={true} />
</Button>
