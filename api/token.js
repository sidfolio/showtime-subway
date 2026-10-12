// Vercel serverless endpoint for minting a short-lived Reactor session token.
// REACTOR_API_KEY is read only on the server and is never sent to the browser.
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({error: 'Method not allowed.'});
  }

  const apiKey=process.env.REACTOR_API_KEY?.trim();
  if (!apiKey || apiKey === 'rk_your_key_here') {
    return response.status(500).json({error: 'REACTOR_API_KEY is not configured on Vercel.'});
  }

  try {
    const upstream=await fetch('https://api.reactor.inc/tokens', {
      method: 'POST',
      headers: {'Reactor-API-Key': apiKey},
    });
    const body=await upstream.json().catch(()=>({error: 'Reactor returned an invalid response.'}));
    if (!upstream.ok) return response.status(upstream.status).json(body);
    if (!body.jwt) return response.status(502).json({error: 'Reactor token response did not include a JWT.'});
    return response.status(200).json({jwt: body.jwt});
  } catch (error) {
    console.error('Reactor token request failed:', error instanceof Error ? error.message : error);
    return response.status(502).json({error: 'Unable to reach Reactor right now.'});
  }
}
