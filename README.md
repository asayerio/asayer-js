# Asayer JS
A component to load Asayer snippet inside your bundle.
This method is best suited for modern web applications which keeps code cleaner and saves loading time.

## Installation
```bash
npm i @asayerio/js --save
```

## Usage
Initialize the package from your codebase entry point.

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
