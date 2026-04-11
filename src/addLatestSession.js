import puppeteer from 'puppeteer';
import fs from 'fs';
import dayjs from "dayjs";

/**
 * Puppeteer's default click() uses hit-testing (center-point must be unobstructed). That often
 * fails in headless CI (small viewport, sticky chrome, overlays). Scroll into view and use a
 * real DOM click instead.
 */
async function clickConferenceLink(page, hrefPath) {
    // Keep evaluate synchronous — async page.evaluate can trigger "Promise was collected" in Puppeteer.
    await page.evaluate((path) => {
        const el = [...document.querySelectorAll('a[href]')].find(
            (a) => a.getAttribute('href') === path
        );
        if (!el) {
            throw new Error(`Anchor not found for href: ${path}`);
        }
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        el.click();
    }, hrefPath);
    if (process.env.GITHUB_ACTIONS) {
        await new Promise((resolve) => setTimeout(resolve, 75));
    }
}


(async () => {
    const launchArgs = process.env.GITHUB_ACTIONS
        ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        : ['--start-maximized'];

    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
        headless: true,
        fullPage: true,
        defaultViewport: process.env.GITHUB_ACTIONS ? { width: 1920, height: 1080 } : null,
        args: launchArgs
    });
    const page = await browser.newPage();
    if (process.env.GITHUB_ACTIONS) {
        page.setDefaultNavigationTimeout(120000);
        page.setDefaultTimeout(120000);
    }

    const years = []

    // Do the most recent year
    const month = +dayjs().format('MM');

    if (month < 4) {
        const year = dayjs().subtract(1, 'year').format('YYYY');
        years.push(`${year}_10`)
    } else if (month >= 4 && month < 10) {
        const year = dayjs().format('YYYY');
        years.push(`${year}_04`)
    } else {
        const year = dayjs().format('YYYY');
        years.push(`${year}_10`)
    }

    for (let year of years) {

        // Navigate the page to a URL (CI/Docker networks can exceed Puppeteer's 30s default)
        const conferenceUrl = `https://www.churchofjesuschrist.org/study/general-conference/${year.replace('_', '/')}?lang=eng`;
        await page.goto(
            conferenceUrl,
            process.env.GITHUB_ACTIONS ? { waitUntil: 'domcontentloaded' } : {}
        );


        const links = await page.$$eval('a', anchors => {
            return anchors
                .filter(anchor => {
                    const href = anchor.getAttribute('href');
                    const parentULs = anchor.closest('ul ul');
                    return href.startsWith('/study/general-conference') && parentULs;
                })
                .map((anchor) => {
                    function getTextContent(element) {
                        if (element.children.length > 0) {
                            return Array.from(element.children).flatMap(getTextContent);
                        } else {
                            return element.textContent.trim();
                        }
                    }

                    const childrenTextContent = getTextContent(anchor);

                    if (childrenTextContent.length === 4) return null;
                    if (childrenTextContent[0]?.includes('Church Auditing Department Report') || childrenTextContent[0]?.includes('Statistical Report') || childrenTextContent[0]?.includes('Session') || childrenTextContent[0]?.includes('Sustaining of General Authorities') || childrenTextContent[1]?.includes('Church Auditing Department Report') || childrenTextContent[1]?.includes('Session') || childrenTextContent[1]?.includes('Statistical Report') || childrenTextContent[1]?.includes('Sustaining of General Authorities')) return null;

// Function to remove any non-standard characters
                    function removeNonStandardCharacters(str) {
                        if(!str) return str;
                        return str.replace(/[^\x20-\x7E]/g, ' '); // Keep only standard ASCII characters
                    }

                    return {
                        href: "https://www.churchofjesuschrist.org" + anchor.getAttribute('href'),
                        title: removeNonStandardCharacters(childrenTextContent[0]),
                        speaker: removeNonStandardCharacters(childrenTextContent[1]),
                        description: removeNonStandardCharacters(childrenTextContent[2]),
                        audioUrl: '',
                        node: anchor.getAttribute('href')
                    };
                })
                .filter(x => x);
        });

        //Remove duplicates
        const uniqueLinks = links.filter((v, i, a) => a.findIndex(t => (t.href === v.href)) === i);

        console.log("LINKS", links.length);
        console.log("UNIQUE LINKS", uniqueLinks.length);

        try {
            await page.click('button[title="Options"]');
        } catch (error) {
            console.log("Error clicking Options button", error);
        }

        let openedDownloads = false;

        for (let link of uniqueLinks) {
            try {
                await clickConferenceLink(page, link.node);
                try {
                    if (!openedDownloads) {
                        await new Promise((resolve) => setTimeout(resolve, 3000));
                        await page.waitForSelector('div[data-testId=download-menu-label]', { timeout: 3000 });
                        await page.click('div[data-testId=download-menu-label]');
                        console.log("Clicked Download button");
                        openedDownloads = true;
                    }
                } catch {
                    console.log(`Download button not found for ${link.speaker}. Skipping...`);
                }
                try {
                    await page.waitForSelector('a[data-testId=download-link-0]', { timeout: 1000 });
                    const downloadLink = await page.$eval('a[data-testId=download-link-0]', (anchor) =>
                        anchor.getAttribute('href')
                    );
                    link.audioUrl = downloadLink;
                    console.log("DOWNLOAD LINK", downloadLink);
                } catch {
                    console.log(`Download link not found for ${link.speaker}. Skipping...`);
                }
            } catch (error) {
                console.log(`Error processing ${link.speaker}:`, error.message || error);
            }
        }

        // Save the links to a JSON file
        fs.writeFileSync(`./netlify/functions/data/${year}.ts`, `const Posts_${year} = ${JSON.stringify(uniqueLinks.map(x => ({
            ...x, node: undefined
        })), null, 2)} \n\r export default Posts_${year}`);

    }
    await browser.close();
})();
