<script lang="ts">
    import { markerState } from "$lib/components/Map/marker.svelte";
    import Button from "../Button.svelte";
    import MapLegend from "./MapLegend.svelte";

    interface Props {
        show: boolean;
    }

    let { show }: Props = $props();

    function toggle() {
        show = !show;
        markerState.datacenter = null;
    }
</script>

<div class="button-container">
    <Button onclick={toggle}>About</Button>
</div>

<div class="container" class:hidden={!show}>
    <button class="close-btn" onclick={() => (show = !show)}>X</button>
    <div class="panel">
        <p>
            <b>
                We went looking for where each URL lives IRL. Turns out, it's
                not one address, but many.
            </b>
        </p>
        <p>
            A single webpage pulls from data centers all over — some near(ish)
            you, some hundreds of kms away.
        </p>
        <p>
            r00ts traces your browser session back to those places. So the next
            time you hear about data center droughts, land rights battles, or
            the communities pushing back, you can find out if you're part of
            their story too.
        </p>
        <h3>Team</h3>
        <p>r00ts was created by AIxDESIGN including:</p>
        <ul>
            <li>Ploipailin Flynn, Research Lead</li>
            <li>Arran Lyon, Researcher + Developer</li>
            <li>Andrea Albiac Casado, Designer</li>
        </ul>
        <p>with generous support from Stimuleringsfonds.</p>

        <h3>We're still digging</h3>
        <p>
            Everything we've found so far lives on a public Miro board: notes,
            sources, loose threads, dead ends and all. Have a poke around, add
            what you know, tell us what we've missed.
        </p>
        <p>
            [ <a href="https://miro.com/app/board/uXjVGCwJpO8=/">
                Browse the research board
            </a> ]
        </p>

        <p>
            And this August, we're hosting an open community session to shape
            where r00ts goes next. Whether you've got a data center story, a
            technical lead, or just good questions — pull up a chair.
        </p>
        <p>[ Sign up for the August workshop ]</p>

        <h3>Privacy</h3>
        <p>
            <em>r00ts.xyz</em> does not record your browsing history nor collect
            <b>any</b> information about your browsing habits or your access to the
            site. We do not use any cookies or tracking technologies. If you use
            the "Locate" feature, this information stays within your browser and
            we do not see it.
        </p>

        <p>
            <em>r00ts</em> browser extension, by it's very nature, records the
            IP addresses of all web traffic of the webpage in the tab it is open
            in. <em>Only</em> these IP addresses are sent to our server for the
            sole purpose of looking up who owns the IP block, and therefore the
            datacenters that might facilitate the address. The extension
            <em>does not</em> send the website or URLs that connect to the
            address, nor send any other identifiable information that can be
            linked to a user or browsing session. The server <em>does</em> check
            the country of origin of your own IP address to better narrow down the
            list of possible datacenters, however this information is not recorded.
        </p>

        <hr />
        <p>Map Legend:</p>
        <MapLegend />
        <p>
            Map data: <a href="https://openfreemap.org/" target="_blank">
                OpenFreeMap
            </a>
            <a href="https://www.openmaptiles.org/" target="_blank">
                ©OpenMapTiles
            </a>
            <a href="https://www.openstreetmap.org/copyright" target="_blank">
                OpenStreetMap
            </a>
            <br />Aerial images:
            <a href="https://www.mapbox.com/about/maps" target="_blank">
                ©Mapbox
            </a>
            <a href="https://www.maxar.com" target="_blank"> ©Maxar </a>
        </p>
        <p>
            Font: GT Pressura Mono (Light, Regular, Bold) from <a
                href="https://www.grillitype.com/"
                target="_blank"
            >
                Grilli Type
            </a>
        </p>
        <p>©2026 AIxDESIGN</p>
    </div>
</div>

<style>
    a,
    a:visited {
        color: blue;
    }

    .container,
    .panel {
        width: 450px;
    }

    .container {
        position: absolute;
        top: 5em;
        right: 2em;
        height: calc(100vh - 5em - 8em);
        z-index: 11;
        overflow: hidden;
        transition: width 1s cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    .panel {
        background-color: white;
        position: relative;
        padding: 1.5em;
        margin-top: 3em;
        height: calc(100% - 3em);
        overflow-y: scroll;
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
        background: inherit;
    }

    .button-container {
        position: absolute;
        top: 1em;
        right: 1em;
        z-index: 5;
    }

    .close-btn {
        position: absolute;
        color: white;
        background: black;
        top: 0;
        left: 0;
        aspect-ratio: 1;
        width: 3em;
        box-sizing: border-box;
    }

    hr {
        margin: 1em 0em;
    }
</style>
