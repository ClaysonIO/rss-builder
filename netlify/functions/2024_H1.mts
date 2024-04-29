import type { Context } from "@netlify/functions"
import {Feed} from "@numbered/feed";
import dayjs from "dayjs";
import {parseCronExpression} from "cron-schedule";
import Mixpanel from 'mixpanel';

const posts: {url: string, speaker: string}[] = [
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-1030-jeffrey-r-holland-32k-eng.mp3?download=true",
        "speaker": "jeffrey-r-holland"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-1040-j-anette-dennis-32k-eng.mp3?download=true",
        "speaker": "j-anette-dennis"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-1050-alexander-dushku-32k-eng.mp3?download=true",
        "speaker": "alexander-dushku"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-1060-ulisses-soares-32k-eng.mp3?download=true",
        "speaker": "ulisses-soares"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-1070-jack-n-gerard-32k-eng.mp3?download=true",
        "speaker": "jack-n-gerard"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-1080-henry-b-eyring-32k-eng.mp3?download=true",
        "speaker": "henry-b-eyring"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-2010-david-a-bednar-32k-eng.mp3?download=true",
        "speaker": "david-a-bednar"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-2020-massimo-de-feo-32k-eng.mp3?download=true",
        "speaker": "massimo-de-feo"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-2030-brent-h-nielson-32k-eng.mp3?download=true",
        "speaker": "brent-h-nielson"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-2040-jose-l-alonso-32k-eng.mp3?download=true",
        "speaker": "jose-l-alonso"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-2050-gerrit-w-gong-32k-eng.mp3?download=true",
        "speaker": "gerrit-w-gong"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-2060-michael-t-nelson-32k-eng.mp3?download=true",
        "speaker": "michael-t-nelson"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-2070-quentin-l-cook-32k-eng.mp3?download=true",
        "speaker": "quentin-l-cook"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-3010-shayne-m-bowen-32k-eng.mp3?download=true",
        "speaker": "shayne-m-bowen"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-3020-steven-r-bangerter-32k-eng.mp3?download=true",
        "speaker": "steven-r-bangerter"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-3030-andrea-munoz-spannaus-32k-eng.mp3?download=true",
        "speaker": "andrea-munoz-spannaus"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-3040-matthew-l-carpenter-32k-eng.mp3?download=true",
        "speaker": "matthew-l-carpenter"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-3050-dieter-f-uchtdorf-32k-eng.mp3?download=true",
        "speaker": "dieter-f-uchtdorf"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-4010-ronald-a-rasband-32k-eng.mp3?download=true",
        "speaker": "ronald-a-rasband"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-4020-susan-h-porter-32k-eng.mp3?download=true",
        "speaker": "susan-h-porter"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-4030-dale-g-renlund-32k-eng.mp3?download=true",
        "speaker": "dale-g-renlund"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-4040-paul-b-pieper-32k-eng.mp3?download=true",
        "speaker": "paul-b-pieper"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-4050-patrick-kearon-32k-eng.mp3?download=true",
        "speaker": "patrick-kearon"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-4060-brian-k-taylor-32k-eng.mp3?download=true",
        "speaker": "brian-k-taylor"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-4070-dallin-h-oaks-32k-eng.mp3?download=true",
        "speaker": "dallin-h-oaks"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-5010-d-todd-christofferson-32k-eng.mp3?download=true",
        "speaker": "d-todd-christofferson"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-5020-taylor-g-godoy-32k-eng.mp3?download=true",
        "speaker": "taylor-g-godoy"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-5030-gary-e-stevenson-32k-eng.mp3?download=true",
        "speaker": "gary-e-stevenson"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-5040-mathias-held-32k-eng.mp3?download=true",
        "speaker": "mathias-held"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-5050-neil-l-andersen-32k-eng.mp3?download=true",
        "speaker": "neil-l-andersen"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-5060-mark-l-pace-32k-eng.mp3?download=true",
        "speaker": "mark-l-pace"
    },
    {
        "url": "https://media2.ldscdn.org/assets/general-conference/april-2024-general-conference/2024-04-5070-russell-m-nelson-32k-eng.mp3?download=true",
        "speaker": "russell-m-nelson"
    }
];

export default async (req: Request, context: Context) => {

    const url = new URL(req.url);
    const params = new URLSearchParams(url.search);

    const cron = params.get('cron');
    const start = params.get('startDate');
    const stamp = params.get('stamp');

    if(process?.env?.MIXPANEL_TOKEN){
        var mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);

// Note: you must supply the user_id who performed the event in the `distinct_id` field
        mixpanel.track("Signed Up", {
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
        const post = posts[iterator];
        const date = cronGenerator.next().value;

        if(!date || !isValidDate(date)) break;
        feed.addItem({
            title: post.speaker,
            id: post.url,
            link: post.url,
            description: post.speaker,
            author: [],
            date: dayjs(date).subtract(1, 'day').startOf('day').toDate(),
            image: post.image,
            enclosure: {
                url: post.url,
                type: "audio/mpeg",
                length: 0
            }
        });


        iterator++;
        if(iterator >= posts.length) break;
    }

// Output: RSS 2.0

    return new Response(feed.rss2(), {
        headers: {
            'Content-Type': 'application/rss+xml'
        }
    })
}