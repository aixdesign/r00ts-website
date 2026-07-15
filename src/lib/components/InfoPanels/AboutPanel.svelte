<script lang="ts">
    import Icon from "@iconify/svelte";
    import Button from "../Button.svelte";
    import MapLegend from "./MapLegend.svelte";

    interface Props {
        show: boolean;
    }

    let { show = $bindable() }: Props = $props();

    function toggle() {
        show = !show;
    }
</script>

<div class="button-container">
    <Button onclick={toggle}>About</Button>
</div>

<div class="container" class:hidden={!show}>
    <button class="close-btn" onclick={() => (show = !show)}>
        <Icon icon="material-symbols:close" height="1.4em" inline={true} />
    </button>
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
            <li>Nadia Piet, Creative Direction</li>
        </ul>
        <p>
            with generous support from Stimuleringsfonds Creative Industries —
            <a
                href="https://www.stimuleringsfonds.nl/en/awarded-grants/open-oproep-grounding-the-cloud-8-projecten-geselecteerd"
                target="_blank"
            >
                "Grounding the Cloud" Open Call
            </a>
        </p>

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
        <p>
            [ <a href="https://luma.com/3gk55ede" target="_blank">
                Sign up for the August playtest
            </a> ]
        </p>

        <h3>Privacy</h3>
        <p>
            <em>r00ts.xyz</em> does not record your browsing history nor collect
            <em>any</em> information about your access to the site. We do not use
            any cookies or tracking technologies. If you use the "Locate" feature,
            this information stays within your browser and we do not see it.
        </p>
        <p>
            <em>r00ts</em> browser extension, by it's very nature, records the IP
            addresses of all web traffic of the webpage in the tab it is open in.
            These IP addresses and domains are sent to our server for the purpose
            of looking up who owns the IP block, and therefore the datacenters that
            might facilitate the address.
        </p>
        <p>
            The extension does not record anything else about the web requests,
            such as transmitted data or user agent info. URLs are stripped of
            any sub-domains, paths or queries — only the base hostname is sent
            to our server. The extension does not send any identifiable
            information that can be linked to a user, device or browsing
            session. Our server <em>does</em> check the country of origin of your
            own IP address to better narrow down the list of possible datacenters,
            however this information is not recorded.
        </p>
        <p>
            You have the option to anonymously contribute your results for a
            website to the community database that other vistors can query with
            the search bar. Your submission will be combined with all other
            results for the submitted website and are not stored as an
            individual entry.
        </p>

        <hr />

        <p>Map Legend:</p>
        <MapLegend />

        <hr />

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
        <p>
            Open source under <a
                href="https://github.com/aixdesign/r00ts-website/blob/main/LICENSE"
                target="_blank"
            >
                AGPL-3.0
            </a>
            ·
            <Icon icon="mdi:github" inline={true} />
            <a
                href="https://github.com/aixdesign/r00ts-website"
                target="_blank"
            >
                View the code
            </a>
            ·
            <a
                href="https://nadiapiet.notion.site/r00ts-Privacy-Policy-39d37d00383380ecb3befa8325c00a6e"
                target="_blank"
            >
                Privacy
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
        width: 500px;
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
        width: 0px !important;
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
        box-sizing: border-box;
    }

    hr {
        margin: 1em 0em;
    }

    @media (width < 720px) {
        .container {
            top: 6em;
            right: 0em;
            width: 100%;
        }

        .panel {
            width: 100%;
            height: calc(100% - 4em);
        }
    }
</style>
