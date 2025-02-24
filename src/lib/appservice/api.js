import { PUBLIC_APPSERVICE } from '$env/static/public';

export const login = async (body) => {
  console.log(body)
  const url = `${PUBLIC_APPSERVICE}/auth/login`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(body)
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}

export const verify_email = async (body) => {
  console.log(body)
  const url = `${PUBLIC_APPSERVICE}/auth/email/verify`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(body)
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}

export const verify_code = async (body) => {
  console.log(body)
  const url = `${PUBLIC_APPSERVICE}/auth/code/verify`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(body)
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}

export const signup = async (body) => {
  console.log(body)
  const url = `${PUBLIC_APPSERVICE}/auth/signup`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(body)
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}

export const usernameAvailable = async (username) => {
  const url = `${PUBLIC_APPSERVICE}/auth/username/available/${username}`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}

export const request_invite = async (email) => {
  const url = `${PUBLIC_APPSERVICE}/auth/request/invite/${email}`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}

export const query_code = async (code) => {
  const url = `${PUBLIC_APPSERVICE}/auth/code/validate/${code}`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}

