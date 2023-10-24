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
  const installArgs = [
    "--no-lockfile",
    "--non-interactive",
    "--ignore-engines",
    "--skip-integrity-check",
    "--cache-folder ./",
    ...(options.installArgs as string[]),
  ];
  const yarnCli = options.yarnCliPath
    ? `node ${options.yarnCliPath}`
    : await ensureYarnCli();

  await fs.ensureDir(packagePath);
  const command = `${yarnCli} add ${depString} ${ignoreScripts} ${registry} ${installArgs.join(
    " ",
  )}`;
  // set strict-ssl false
  await exec(`${yarnCli} config set strict-ssl false`);

  await exec(command, {
    cwd: packagePath,
  });
}

async function ensureYarnCli() {
  const yarnFile = "yarn/lib/cli.js";
  let yarnPath = path.resolve(__dirname, `../../../../${yarnFile}`);
  if (!(await fs.exists(yarnPath))) {
    yarnPath = path.resolve(__dirname, `../../../node_modules/${yarnFile}`);
  }
  if (!(await fs.exists(yarnPath))) {
    return "npx yarn";
  }
  return `node ${yarnPath}`;
}
