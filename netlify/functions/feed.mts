import type {Context} from "@netlify/functions"
import Mixpanel from 'mixpanel';
import {createFeedFromData} from "./helpers/createFeedFromData";
import dayjs from "dayjs";

export default async (req: Request, context: Context) => {

    const url = new URL(req.url);
    const params = new URLSearchParams(url.search);

    const conference = params.get('conference');
    const cron = params.get('cron');
    const start = params.get('startDate');
    const stamp = params.get('stamp');

    if (process?.env?.MIXPANEL_TOKEN) {
        const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);

        mixpanel.track("Accessed RSS Feed", {
            distinct_id: stamp || 'unknown',
            type: 'RSS Feed',
            cron,
            start
        });
    }

    const posts = require(`./data/${conference}.ts`).default
    console.log("POSTS", posts)
    const conferenceDate = dayjs(conference, 'YYYY_MM')

    const feed = createFeedFromData({
        title: "General Conference Talks: " + conferenceDate.format('MMM YYYY'),
        description: "Customizable conference talks feed",
        id: "https://rss.clayson.io/",
        link: "https://rss.clayson.io/",
        language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
        image: "https://rss.clayson.io/image.png",
        favicon: "https://rss.clayson.io/favicon.ico",
        copyright: "All talks are property of The Church of Jesus Christ of Latter-day Saints. This is an unofficial feed.",
        generator: "awesome", // optional, default = 'Feed for Node.js'
        author: {
            name: "The Church of Jesus Christ of Latter-day Saints",
            link: "https://www.churchofjesuschrist.org/",
        },
        cron: cron ?? '',
        start: start ?? '',
        posts: posts
    })

    return new Response(
        feed.rss2(),
        {
            headers: {
                'Content-Type': 'application/rss+xml'
            }
        })
}