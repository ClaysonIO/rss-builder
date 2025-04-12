import {type Context, Handler} from '@netlify/functions';
import * as fs from 'fs';
import * as path from 'path';

export default async (req: Request, context: Context) => {
    try {
        // Path to the data folder
        const dataPath = path.join(__dirname, 'data');

        // Read all files in the data directory
        const files = fs.readdirSync(dataPath);

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