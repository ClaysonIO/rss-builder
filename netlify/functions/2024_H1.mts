import type { Context } from "@netlify/functions"
import {Feed} from "@numbered/feed";
import dayjs from "dayjs";
import {parseCronExpression} from "cron-schedule";
import Mixpanel from 'mixpanel';
import {Posts_2024_H1} from './data/2024_H1';

export default async (req: Request, context: Context) => {

    const url = new URL(req.url);
    const params = new URLSearchParams(url.search);

    const cron = params.get('cron');
    const start = params.get('startDate');
    const stamp = params.get('stamp');

    if(process?.env?.MIXPANEL_TOKEN){
        var mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);

// Note: you must supply the user_id who performed the event in the `distinct_id` field
        mixpanel.track("Accessed RSS Feed", {
            distinct_id: stamp || 'unknown',
            type: 'RSS Feed',
            cron,
            start
        });
    }

    // return new Response(JSON.stringify({cron, start}))

    const feed = new Feed({
        title: "2024 General Conference Talks",
        description: "Customizable conference talks feed",
        id: "https://rss.clayson.io/",
        link: "https://rss.clayson.io/",
        language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
        image: "https://rss.clayson.io/image.png",
        favicon: "https://rss.clayson.io/favicon.ico",
        copyright: "All talks are property of The Church of Jesus Christ of Latter-day Saints. This is an unofficial feed.",
        generator: "awesome", // optional, default = 'Feed for Node.js'
        feedLinks: {
            json: "https://rss.clayson.io/json",
            atom: "https://rss.clayson.io/atom"
        },
        author: {
            name: "The Church of Jesus Christ of Latter-day Saints",
            link: "https://www.churchofjesuschrist.org/",
        }
    });

    const startDate = dayjs(start, 'YYYY-MM-DD').startOf('day').toDate();
    const cronGenerator = parseCronExpression(cron)
        .getNextDatesIterator(startDate, dayjs().add(1, 'd').toDate());

    let iterator = 0;

    function isValidDate(d) {
        return d instanceof Date && !isNaN(d);
    }

    while(true){
        const post = Posts_2024_H1[iterator];
        const date = cronGenerator.next().value;

        if(!post || !date || !isValidDate(date)) break;
        feed.addItem({
            title: post.title,
            id: post.url,
            link: post.url,
            description: post.speaker,
            author: [{
                name: post.speaker,
                email: ''
            }],
            date: dayjs(date).subtract(1, 'day').startOf('day').toDate(),
            image: post.image,
            enclosure: {
                url: post.url,
                type: "audio/mpeg",
                length: 0
            }
        });


        iterator++;
        if(iterator >= Posts_2024_H1.length) break;
    }

// Output: RSS 2.0

    return new Response(feed.rss2(), {
        headers: {
            'Content-Type': 'application/rss+xml'
        }
    })
}