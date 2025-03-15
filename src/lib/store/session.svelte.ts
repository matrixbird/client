export type Session = {
    user_id: string | null,
    access_token: string | null,
    device_id: string | null,
}

export const session: Session = $state({
    user_id: null,
    access_token: null,
    device_id: null,
});

export function updateSession(data: Session) {
    if(data.user_id === null || data.access_token === null || data.device_id === null) {
        console.error('updateSession: invalid data', data)
        return
    }

    session.user_id = data.user_id
    session.access_token = data.access_token
    session.device_id = data.device_id

    console.info('Session updated', session)
}
