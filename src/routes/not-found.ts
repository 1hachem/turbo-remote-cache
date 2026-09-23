// Every unauthorized or unmatched request gets this exact response, so probing
// a real route is indistinguishable from probing a nonexistent one.
export const notFound = () => new Response(null, { status: 404 });
