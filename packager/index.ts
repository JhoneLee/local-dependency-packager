import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";

import findDependencyDependencies from "./dependencies/find-dependency-dependencies";
import installDependencies from "./dependencies/install-dependencies";

import findPackageInfos, { IPackage } from "./packages/find-package-infos";
import findRequires, { IFileData } from "./packages/find-requires";

import getHash from "./utils/get-hash";

export interface IDependency {
  name: string;
  version: string;
}

export interface IOptions {
  registry?: string;
  packPath?: string;
  installArgs?: string[];
  yarnCliPath?: string;
}

async function getContents(
  dependency: any,
  packagePath: string,
  packageInfos: { [p: string]: IPackage },
): Promise<IFileData> {
  const contents = await findRequires(
    dependency.name,
    packagePath,
    packageInfos,
  );

  const packageJSONFiles = Object.keys(packageInfos).reduce(
    (total, next) => ({
      ...total,
      [next.replace(packagePath, "")]: {
        content: JSON.stringify(packageInfos[next]),
      },
    }),
    {},
  );

  return { ...contents, ...packageJSONFiles };
}

/**
 * Delete `module` field if the module doesn't exist at all
 */
function verifyModuleField(pkg: IPackage, pkgLoc: string) {
  if (!pkg.module) {
    return;
  }

  try {
    const basedir = path.dirname(pkgLoc);

    const found = [
      path.join(basedir, pkg.module),
      path.join(basedir, pkg.module + ".js"),
      path.join(basedir, pkg.module + ".cjs"),
      path.join(basedir, pkg.module + ".mjs"),
      path.join(basedir, pkg.module, "index.js"),
      path.join(basedir, pkg.module, "index.mjs"),
    ].find((p) => {
      try {
        const l = fs.statSync(p);
        return l.isFile();
      } catch (e) {
        return false;
      }
    });

    if (!found) {
      pkg.csbInvalidModule = pkg.module;
      delete pkg.module;
    }
  } catch (e) {
    /* */
  }
}

async function packDependency(
  dependency: IDependency,
  packagePath: string,
  options: IOptions,
) {
  await installDependencies(dependency, packagePath, options);
  const packageInfos = await findPackageInfos(dependency.name, packagePath);

  Object.keys(packageInfos).map((pkgJSONPath) => {
    const pkg = packageInfos[pkgJSONPath];

    verifyModuleField(pkg, pkgJSONPath);
  });

  const contents = await getContents(dependency, packagePath, packageInfos);

  const requireStatements = new Set<string>();
  Object.keys(contents).forEach((p) => {
    const c = contents[p];

    if (c.requires) {
      c.requires.forEach((r) => requireStatements.add(r));
    }
  });

  return {
    contents,
    dependency,
    ...findDependencyDependencies(
      dependency,
      packagePath,
      packageInfos,
      requireStatements,
      contents,
    ),
  };
}

export async function pack(dependency: IDependency, options: IOptions = {}) {
  const hash = getHash(dependency);
  options.packPath =
    options.packPath ||
    `${process.env.HOME || process.env.USERPROFILE || ""}/tmp`;
  options.installArgs = options.installArgs || [];
  if (!hash) {
    return;
  }
  const packagePath = path.resolve(
    options.packPath as string,
    `./${hash}_build_${Date.now()}`,
  );
  let response;
  try {
    response = await packDependency(dependency, packagePath, options);
  } catch (e) {
    console.error(e);
  } finally {
    await fs.remove(packagePath);
  }

  // windows
  if (os.platform() === "win32") {
    const newContents = {};
    for (const key of Object.keys(response.contents)) {
      newContents[key.split(path.sep).join("/")] = response.contents[key];
    }
    response.contents = newContents;
  }
  return response || null;
}
