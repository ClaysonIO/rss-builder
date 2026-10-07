import {Feed} from "@numbered/feed";
import dayjs from "dayjs";
import type {ScheduledPost} from "./schedulePosts";

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
    posts: ScheduledPost[]
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

    for (const post of posts) {
        feed.addItem({
            title: post.title,
            id: post.id,
            link: post.href,
            description: post.speaker,
            author: [{
                name: post.speaker,
                email: ''
            }],
            date: dayjs(post.date).subtract(1, 'day').startOf('day').toDate(),
            enclosure: {
                url: post.audioUrl,
                type: "audio/mpeg",
                length: 0
            }
        });
    }

    return feed;
}