import { redirect } from "@sveltejs/kit";

export const actions = {
    default: async ({ cookies }) => {
        cookies.delete('session_id', { path: '/' });
        cookies.delete('device_id', { path: '/' });
        redirect(303, '/login');
    }
};
