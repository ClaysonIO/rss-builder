import dayjs from "dayjs";
import {parseCronExpression} from "cron-schedule";

export type Post = { href: string, title: string, audioUrl: string, speaker: string };
export type ScheduledPost = Post & { id: string, date: Date };

// Upper bounds so a very frequent cron or an old start date can't run away
const MAX_SLOTS = 100000;
const MAX_ITEMS = 1000;

/** The conference after `session` (YYYY_MM), e.g. 2026_04 -> 2026_10, 2026_10 -> 2027_04 */
export function nextConference(session: string): string {
    const [year, month] = session.split('_').map(Number);
    return month < 10 ? `${year}_10` : `${year + 1}_04`;
}

/** A conference counts as "out" from the Monday after the first Sunday of its month (UTC). */
export function conferenceAvailableAt(session: string): Date {
    const [year, month] = session.split('_').map(Number);
    const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const firstSunday = 1 + (7 - firstOfMonth.getUTCDay()) % 7;
    return new Date(Date.UTC(year, month - 1, firstSunday + 1));
}

/**
 * Assign posts to the dates produced by the cron schedule.
 *
 * - The selected sessions play in order first.
 * - autoFuture: once they run out, newer conferences are played as they come out.
 * - repeat: when the current session runs out, it is replayed until the next conference comes out.
 *   With autoFuture the feed then moves on to the new conference; without it, the feed stops.
 */
export function schedulePosts({
                                  cron,
                                  start,
                                  posts,
                                  latestSession,
                                  autoFuture,
                                  repeat,
                                  loadSession
                              }: {
    cron: string,
    start: string,
    posts: Post[],
    latestSession: string,
    autoFuture: boolean,
    repeat: boolean,
    loadSession: (session: string) => Post[] | null
}): ScheduledPost[] {
    const startDate = dayjs(start, 'YYYY-MM-DD').startOf('day').toDate();
    const endDate = dayjs().add(1, 'd').toDate();
    const slots = parseCronExpression(cron).getNextDatesIterator(startDate, endDate);

    // Talks without audio (session meetings, or audio not published yet) can't go in a podcast feed
    const playable = (sessionPosts: Post[]) => sessionPosts.filter(post => post.audioUrl);

    const loaded = new Map<string, Post[] | null>();
    function load(session: string) {
        if (!loaded.has(session)) {
            const sessionPosts = loadSession(session);
            loaded.set(session, sessionPosts && playable(sessionPosts));
        }
        return loaded.get(session);
    }

    // The earliest conference after `after` that is out by `date` and has data
    function findNextAvailable(after: string, date: Date): { session: string, posts: Post[] } | null {
        for (let session = nextConference(after); conferenceAvailableAt(session) <= date; session = nextConference(session)) {
            const sessionPosts = load(session);
            if (sessionPosts?.length) return {session, posts: sessionPosts};
        }
        return null;
    }

    let current = {session: latestSession, posts: playable(posts)};
    let index = 0;
    let pass = 0;
    const scheduled: ScheduledPost[] = [];

    for (let slot = 0; slot < MAX_SLOTS; slot++) {
        const {value: date, done} = slots.next();
        if (done || !date || isNaN(date.getTime())) break;

        const finished = index >= current.posts.length;

        // Move on to a newer conference once the current one has been played through
        if (autoFuture && (finished || pass > 0)) {
            const next = findNextAvailable(current.session, date);
            if (next) {
                current = next;
                index = 0;
                pass = 0;
            }
        }

        if (index >= current.posts.length) {
            const nextIsOut = conferenceAvailableAt(nextConference(current.session)) <= date;
            if (repeat && (autoFuture || !nextIsOut) && current.posts.length > 0) {
                index = 0;
                pass++;
            } else if (autoFuture) {
                continue; // Wait for the next conference
            } else {
                break;
            }
        } else if (repeat && !autoFuture && pass > 0
            && conferenceAvailableAt(nextConference(current.session)) <= date) {
            break; // Stop repeating once the next conference is out
        }

        const post = current.posts[index];
        if (!post) break;
        scheduled.push({
            ...post,
            // Podcast apps de-duplicate by id, so replays need their own
            id: pass === 0 ? post.audioUrl : `${post.audioUrl}#${dayjs(date).format('YYYY-MM-DD-HH-mm')}`,
            date
        });
        if (scheduled.length > MAX_ITEMS) scheduled.shift();
        index++;
    }

    return scheduled;
}
