import serverless from 'serverless-http';
import { app, initializeServices } from '../../server/app'; // Adjust path if needed

// Kick off initialization when the function loads.
// Capture the promise to ensure we don't block cold starts excessively
// but still wait for it before handling requests.
const initializePromise = initializeServices().catch(err => {
  // Log the initialization error, but don't prevent the handler from being created.
  // Requests might fail if services are critical, but the function can still load.
  console.error("Initialization failed:", err);
  // Optionally, set a flag or re-throw if initialization is absolutely critical
  // for *any* request handling.
});

// Create the serverless-http handler instance *once*.
const serverlessHandler = serverless(app);

// Export the final handler function for Netlify
export const handler = async (event, context) => {
  // Wait for the initialization promise to settle before handling the request.
  // This ensures services are ready (or failed trying) before proceeding.
  await initializePromise;

  // Call the serverless-http handler with the event and context.
  return await serverlessHandler(event, context);
}; 