import npa from "npm-package-arg";
import * as path from "path";
import * as fs from "fs-extra";
import exec from "./utils/execute";
import { IOptions } from "..";

export default async function (
  dependency: { name: string; version: string },
  packagePath: string,
  options: IOptions,
) {
  const depString = `${dependency.name}@${dependency.version}`;
  const spec = npa(depString);

  const registry = options.registry ? `--registry=${options.registry}` : "";
  const ignoreScripts = spec.type === "git" ? "" : "--ignore-scripts";
  const installArgs = ["--no-lockfile", "--non-interactive"];

  await fs.ensureDir(packagePath);
  const command = `npx yarn add ${depString} ${ignoreScripts} ${registry} ${installArgs.join(
    " ",
  )}`;

  await exec(command, {
    cwd: packagePath,
  });
}
