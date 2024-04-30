import {Feed} from "@numbered/feed";
import dayjs from "dayjs";
import {parseCronExpression} from "cron-schedule";

function isValidDate(d: any) {
    return d instanceof Date && !isNaN(d);
}

export function createFeedFromData({
                                       title,
                                       description,
                                       id,
                                       link,
                                       language,
                                       image,
                                       favicon,
                                       copyright,
                                       generator,
                                       author,
                                       start,
                                       cron,
                                       posts
                                   }: {
    title: string,
    description: string,
    id: string,
    link: string,
    language: string,
    image: string,
    favicon: string,
    copyright: string,
    generator: string,
    author: {
        name: string,
        link: string
    },
    start: string,
    cron: string,
    posts: { href: string,  title: string, audioUrl: string, speaker: string }[]
}) {

    const feed = new Feed({
        title,
        description,
        id,
        link,
        language,
        image,
        favicon,
        copyright,
        generator,
        author
    });

    const startDate = dayjs(start, 'YYYY-MM-DD').startOf('day').toDate();
    const cronGenerator = parseCronExpression(cron)
        .getNextDatesIterator(startDate, dayjs().add(1, 'd').toDate());

    let iterator = 0;


    while (iterator < posts.length) {
        const post = posts[iterator];
        const date = cronGenerator.next().value;

        if (!post || !date || !isValidDate(date)) break;
        feed.addItem({
            title: post.title,
            id: post.audioUrl,
            link: post.href,
            description: post.speaker,
            author: [{
                name: post.speaker,
                email: ''
            }],
            date: dayjs(date).subtract(1, 'day').startOf('day').toDate(),
            enclosure: {
                url: post.audioUrl,
                type: "audio/mpeg",
                length: 0
            }
        });


        iterator++;
    }

    return feed;
}