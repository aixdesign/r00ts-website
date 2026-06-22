<script lang="ts">
    import Button from "../Button.svelte";

    let show = $state(false);

    function onclick() {
        show = !show;
    }
</script>

<div class="button-container">
    <Button {onclick}>about</Button>
</div>

<div class="container" class:hidden={!show}>
    <div class="panel">
        <button class="close-btn" {onclick}>X</button>
        <h1>About r00ts</h1>
        <p>
            r00ts connects the websites you visit to the datacenters that
            faciltate them.
        </p>
        <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat,
            dignissimos soluta itaque dicta unde ullam dolor corrupti veritatis
            modi quo a, provident atque expedita quod. Similique aspernatur quam
            facere omnis?
        </p>
    </div>
</div>

<style>
    .container {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 11;
        width: 350px;
        overflow: hidden;
        transition: width 1s cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    .panel {
        position: relative;
        background-color: #e7e7e7;
        padding: 1.5em;
        width: 350px;
        max-height: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    .hidden {
        width: 0px;
    }

    button {
        border: none;
        cursor: pointer;
        padding: 1em;
        font-family: inherit;
    }

    .button-container {
        position: absolute;
        top: 1em;
        right: 1em;
        z-index: 5;
    }

    .close-btn {
        position: absolute;
        top: 0;
        right: 0;
    }
</style>
