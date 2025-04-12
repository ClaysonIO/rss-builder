import {type Context, Handler} from '@netlify/functions';
import * as fs from 'fs';
import * as path from 'path';

function getAllFilesInData(): string[] {
    try {
        // For Netlify Functions, use path resolution through environment variables
        const dataPath = path.resolve(process.env.LAMBDA_TASK_ROOT || '', '../functions-dist/data');

        // Check if the directory exists
        if (!fs.existsSync(dataPath)) {
            console.error(`Directory does not exist: ${dataPath}`);
            return [];
        }

        // Read all files in the data directory
        return fs.readdirSync(dataPath);
    } catch (error) {
        console.error('Error reading data directory:', error);
        throw new Error(`Directory does not exist: ${error}`);
    }
}

export default async (req: Request, context: Context) => {
    try {
        const files = getAllFilesInData();

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