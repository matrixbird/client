### Matrixbird client

This is the WIP client powering [matrixbird.com](https://matrixbird.com).

#### Roadmap

- [x] Email-like client
- [x] Mailbox rooms
- [x] Auto-join email rooms for email-like experience
- [x] Screen email room invites 
- [ ] Search
- [ ] Locally store email events
- [ ] End-to-end encryption
- [ ] Chat/Video features

#### Running

This is a sveltekit project and can be deployed in different ways.

Refer to the [docs](https://svelte.dev/docs/kit/building-your-app) for more information.

The `.env.example` file contains the environment variables needed to run the project. If you skip setting up env variables, the client will attempt to discover the matrixbird server using well-known discovery mechanism.

#### Development

To run the project locally:

```bash
npm run dev
```

If you want to emulate a prod environment and use a local dummy domain, copy the `.env.local.example` file to `.env.local` and set the appropriate values:

```env
VITE_LOCAL_ORIGIN=https://app.one.local
VITE_ALLOWED_HOST=.one.local
```

See the docs on [local setup](https://github.com/matrixbird/matrixbird/blob/main/docs/local-synapse-setup.md) for more.

### Discuss

To discuss this project, join the [#matrixbird:matrix.org](https://matrix.to/#/#matrixbird:matrix.org) room.

