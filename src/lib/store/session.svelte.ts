export type Session = {
    session_id: string | undefined,
    user_id: string | undefined,
    access_token: string | undefined,
    device_id: string | undefined,
}

export const session: Session = $state({
    session_id: undefined,
    user_id: undefined,
    access_token: undefined,
    device_id: undefined
});

export function updateSession(data: Session) {
    if(data.session_id == undefined || data.user_id === undefined || data.access_token === undefined || data.device_id === undefined) {
        console.error('Could not update session: invalid data', data)
        return
    }

    session.session_id = data.session_id
    session.user_id = data.user_id
    session.access_token = data.access_token
    session.device_id = data.device_id
    console.info('Session updated', $state.snapshot(session))
}

export function sessionExists(): boolean {
    return session.session_id !== undefined && session.user_id !== undefined && session.access_token !== undefined && session.device_id !== undefined;
}

export function clearSession() {
    session.session_id = undefined
    session.user_id = undefined
    session.access_token = undefined
    session.device_id = undefined
    console.info('Session cleared', session)
}
