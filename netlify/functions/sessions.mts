import {type Context, Handler} from '@netlify/functions';
import * as fs from 'fs';
import * as path from 'path';

function getAllFilesInData(): string[] {
    try {
        // Try multiple possible paths that could work in Netlify Functions
        const possiblePaths = [
            path.join(process.cwd(), 'netlify/functions/data'),
            path.join(process.cwd(), 'data'),
            path.join(process.env.LAMBDA_TASK_ROOT || '', 'data'),
            path.join(process.env.LAMBDA_TASK_ROOT || '', 'netlify/functions/data'),
            path.join(process.env.LAMBDA_TASK_ROOT || '', '../functions-dist/data')
        ];

        // Log all paths we're trying for debugging
        console.log('Attempting to find data directory at:', possiblePaths);

        // Find first path that exists
        const dataPath = possiblePaths.find(p => fs.existsSync(p));

        if (!dataPath) {
            console.error('Could not find data directory in any of the attempted paths');
            return [];
        }

        console.log('Found data directory at:', dataPath);
        const files = fs.readdirSync(dataPath);
        console.log('Files found:', files);
        return files;
    } catch (error) {
        console.error('Error reading data directory:', error);
        return []; // Return empty array instead of throwing to prevent function failure
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