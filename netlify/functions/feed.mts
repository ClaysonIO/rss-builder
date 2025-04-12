import type {Context} from "@netlify/functions"
import Mixpanel from 'mixpanel';
import {createFeedFromData} from "./helpers/createFeedFromData";
import dayjs from "dayjs";

export default async (req: Request, context: Context) => {

    const url = new URL(req.url);
    const params = new URLSearchParams(url.search);
    const baseUrl = process.env.BASE_URL ?? 'https://rss.clayson.io'

    const sessions = params.get('session') ?? '';
    const cron = params.get('cron')?.replaceAll('_', ' ');
    const start = params.get('startDate');
    const stamp = params.get('stamp');

    if(!sessions) return errorMessage('Session parameter is required.')
    if(sessions.split(',').map(y=>y.match(/^\d{4}_\d{2}$/)).find(x=>x === null) === null) return errorMessage('Session parameter is invalid. Must be in the format of YYYY_MM.')
    if(!cron) return errorMessage('Cron parameter is required.')
    if(!start) return errorMessage('Start Date parameter is required.')
    if(!start.match(/^\d{4}-\d{2}-\d{2}$/)) return errorMessage('Start Date parameter is invalid. Must be in the format of YYYY-MM-DD.')


    if (process?.env?.MIXPANEL_TOKEN) {
        const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);

        mixpanel.track("Accessed RSS Feed", {
            distinct_id: stamp || 'unknown',
            type: 'RSS Feed',
            cron,
            start
        });
    }

    try {
        const posts = sessions.split(',')
            .map(session=> require(`./data/${session}.ts`).default)
            .flat()

        const firstSession = sessions.split(',')[0]
        const lastSession = sessions.split(',')[sessions.split(',').length - 1]

        const conferenceDateStart = dayjs(firstSession.replace('_', '-'), 'YYYY-MM')
        const conferenceDateEnd = dayjs(lastSession.replace('_', '-'), 'YYYY-MM')

        const titleDateRange = conferenceDateStart.diff(conferenceDateEnd, 'month') === 0
            ? conferenceDateStart.format('MMM YYYY')
            : conferenceDateStart.format('MMM YYYY') + ' - ' + conferenceDateEnd.format('MMM YYYY');

        const feed = createFeedFromData({
            title: "General Conference Talks: " + titleDateRange,
            description: "Customizable conference talks feed",
            id: baseUrl,
            link: baseUrl,
            language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
            image: `${baseUrl}/logo.png`,
            favicon: `${baseUrl}/favicon.ico`,
            copyright: "All talks are property of The Church of Jesus Christ of Latter-day Saints. This is an unofficial feed.",
            generator: "Feed for Node.js",
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
    } catch (e: any) {
        if (e.message.includes('Module not found in bundle')) {
            return errorMessage('General Conference Session has not been added to this application yet. Please check back later, or reach out to the developer for more information.')
        } else {
            return errorMessage('Application has run into an error. Please try again later.')
        }

    }
}

function errorMessage(message: string) {
    return new Response(
        JSON.stringify({error: message}),
        {
            headers: {
                'Content-Type': 'application/json'
            },
            status: 500
        }
    )
}