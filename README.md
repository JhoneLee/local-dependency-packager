locally running codesandbox dependency packager.
There is no aws-s3 and aws-lambda.
Only run locally.


```js
const { pack } = require("local-dependency-packager");
async function exec() {
 await pack(
    {
      name: "jquery",
      version: "3.7.1",
    },
    {
      registry: "https://registry.npmmirror.com"
    }
  );
}

```
