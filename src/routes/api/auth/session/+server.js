export async function POST({ request, cookies }) {
    const { session_id, device_id } = await request.json();

    cookies.set('session_id', session_id, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
        secure: true,
        sameSite: 'strict',
        path: '/'
    });

  /*
    cookies.set('device_id', device_id, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
        secure: true,
        sameSite: 'strict',
        path: '/'
    });
  */

    return new Response(JSON.stringify({ success: true }));
}
