locally running codesandbox dependency packager.
There is no aws-s3 and aws-lambda.
Only run locally.

```js
const { pack } = require("local-dependency-packager");
const path = require("path");
async function exec() {
  const response = await pack(
    {
      name: "axios",
      version: "1.5.1",
    },
    {
      registry: "https://registry.npmmirror.com",
      installArgs: ["--json"],
      yarnCliPath: path.resolve(__dirname, "./node_modules/yarn/lib/cli"),
    },
  );
}

exec();
```
