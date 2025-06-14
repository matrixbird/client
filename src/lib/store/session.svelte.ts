export type Session = {
    session_id: string | undefined,
    user_id: string | undefined,
    access_token: string | undefined,
    device_id: string | undefined,
    home_server: string | undefined,
    server_name: string | undefined,
}

export const session: Session = $state({
    session_id: undefined,
    user_id: undefined,
    access_token: undefined,
    device_id: undefined,
    home_server: undefined,
    server_name: undefined,
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
    session.home_server = data.home_server
    session.server_name = data.server_name
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
    session.home_server = undefined
    session.server_name = undefined
    console.info('Session cleared', session)
}

export function createSessionStore() {

  return {

    get session() {
      return session;
    },

    get session_id() {
      return session.session_id;
    },

    get access_token() {
      return session.access_token;
    },

    get user_id() {
      return session.user_id;
    },

    get device_id() {
      return session.device_id;
    },


  };
}

