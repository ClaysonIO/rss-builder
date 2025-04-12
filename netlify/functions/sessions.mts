import {type Context} from '@netlify/functions';
import dayjs from "dayjs";

async function getAllFilesInData(): string[] {
    try {
        let currentDate = dayjs('2000-04', 'YYYY-MM');

        let missedCounter = 0;
        const sessionFiles: string[] = [];

        while (missedCounter < 3){
            const fileName = `${currentDate.format('YYYY_MM')}.ts`
            try{

                const sessionModule = await require(`./data/${fileName}`);
                if (!!sessionModule || !!sessionModule.default) {
                    sessionFiles.push(fileName);
                    console.log("FOUND FILE", fileName)
                } else {
                    missedCounter++;
                }
            } catch (e){
                console.log("FILE NOT FOUND", fileName)
                missedCounter++;
            }
            currentDate = currentDate.add(6, 'month')
        }
        console.log("FOUND ALL FILES", sessionFiles)
        return sessionFiles;

    } catch (error) {
        console.error('Error reading data directory:', error);
        return []; // Return empty array instead of throwing to prevent function failure
    }
}

export default async (req: Request, context: Context) => {
    try {
        const files = await getAllFilesInData();

        // Filter filenames to only include those in YYYY_MM format and remove .ts extension
        const sessionFiles = files
            .filter(file => /^\d{4}_\d{2}\.ts$/.test(file))  // Match YYYY_MM.ts pattern
            .map(file => file.replace('.ts', ''))
            .sort()
            .reverse();  // Remove .ts extension

        console.log("READY TO RETURN", sessionFiles)
        // Return the filtered list as JSON
      return new Response(
          JSON.stringify(sessionFiles),
          {
            headers: {
              'Content-Type': 'application/rss+xml'
            }
          })
    } catch (error) {
        // Return an error response if anything goes wrong
        console.error('Error reading session files:', error);
        return errorMessage({error: `Failed to retrieve sessions: ${error}`})
    }
};

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