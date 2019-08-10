# Asayer JS
A component to load Asayer snippet inside your bundle.
This method is best suited for modern web applications which keeps code cleaner and saves loading time.

## Installation
```bash
npm i @asayerio/js --save
```

## Usage
Initialize the package from your codebase entry point. This would start the Asayer tracking snippet. SITE_ID can be found in your Asayer dashboard after clicking on **Tracking Code** under [Preferences -> Sites](https://app.asayer.io/client/sites).

```js
import { init } from '@asayerio/js';

init({
  siteID: SITE_ID,
});
```

Then you can use [Asayer JavaScript API](https://docs.asayer.io/reference#vars) anywhere in your code.

```js
import asayer from '@asayerio/js';

asayer.vars('userId', 'my_custom_user_id');
```

Also, there is the set of additional methods available when using the package

### fetch

In order to write down the payload of the requests and responses, and simplify the integration with backend logs, you can use our wrapper over the `fetch`

```js
import { init, fetch } from '@asayerio/js';

init({ siteID: XXX, fetch: { sessionIDHeader: 'X-SessionID' } }); // header name for sessionID (optional)

fetch('http://example.com/movies.json')
  .then(...)
```

### profiler

To measure the performance of specific part of your code you can use `profiler` call

```js
import { profiler } from '@asayerio/js';

var fn = profiler('call_name')(function () {
  ...
}, thisArg); // thisArg is optional
```
