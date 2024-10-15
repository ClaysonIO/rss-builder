import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
        headless: true, fullPage: true, defaultViewport: null, args: ['--start-maximized']
    });
    const page = await browser.newPage();


    const years = []
    for(let i = 2024; i <= 2024; i++){
        // years.push(`${i}_04`)
        years.push(`${i}_10`)
    }

    for(let year of years) {

        // Navigate the page to a URL
        await page.goto(`https://www.churchofjesuschrist.org/study/general-conference/${year.replace('_', '/')}?lang=eng`);


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
                    if (childrenTextContent[0]?.includes('Church Auditing Department Report')
                        || childrenTextContent[0]?.includes('Statistical Report')
                        || childrenTextContent[0]?.includes('Session')
                        || childrenTextContent[0]?.includes('Sustaining of General Authorities')
                        || childrenTextContent[1]?.includes('Church Auditing Department Report')
                        || childrenTextContent[1]?.includes('Session')
                        || childrenTextContent[1]?.includes('Statistical Report')
                        || childrenTextContent[1]?.includes('Sustaining of General Authorities')
                    ) return null;

                    return {
                        href: "https://www.churchofjesuschrist.org" + anchor.getAttribute('href'),
                        title: childrenTextContent[0],
                        speaker: childrenTextContent[1],
                        description: childrenTextContent[2],
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
        // Click the button with the title of 'Options'

        await page.click('button[title="Options"]');
        let openedDownloads = false;


        for (let link of uniqueLinks) {
            await page.click('a[href="' + link.node + '"]');
            try {
                if (!openedDownloads) {
                    await new Promise((resolve)=>setTimeout(resolve, 3000));
                    await page.waitForSelector('div[data-testId=download-menu-label]', {timeout: 3000});
//
                    await page.click('div[data-testId=download-menu-label]');
                    console.log("Clicked Download button");
                    openedDownloads = true
                }
            } catch (error) {
                console.log(`Download button not found for ${link.speaker}. Skipping...`);
            }
            try {
                // Wait for the 'downloadLink' element to be visible for up to 3 seconds
                await page.waitForSelector('a[data-testId=download-link-0]', {timeout: 1000});
                // If the 'downloadLink' element is found, get its href
                const downloadLink = await page.$eval('a[data-testId=download-link-0]', anchor => anchor.getAttribute('href'));
                link.audioUrl = downloadLink;
                console.log("DOWNLOAD LINK", downloadLink);
            } catch (error) {
                console.log(`Download link not found for ${link.speaker}. Skipping...`);
            }
        }

        // Save the links to a JSON file
        fs.writeFileSync(`./netlify/functions/data/${year}.ts`, `const Posts_${year} = ${JSON.stringify(uniqueLinks.map(x => ({...x, node: undefined})), null, 2)} \n\r export default Posts_${year}`);

    }
    await browser.close();
})();