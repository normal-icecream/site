# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--{repo}--{owner}.hlx.page/
- Live: https://main--{repo}--{owner}.hlx.live/

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template and add a mountpoint in the `fstab.yaml`
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)

## Cloudflare Worker - Local development

1. Run `wrangler deploy` to update worker code in Cloudflare Dashboard. You should `NOT` edit worker code in Cloudflare Dashboard directly. Any changes that need to be made to the worker code should be done through the worker.js file.
1. Run `wrangler dev --remote` to test Square locally, this turns the worker server `ON`. 
    1. If you want to test `production` locally, go to wrangler.toml and change `[vars] ENVIRONMENT = 'production'`
    1. If you want to test `sandbox` locally, go to wrangler.toml and change `[vars] ENVIRONMENT = 'sandbox'`

1. [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands)
