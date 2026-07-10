import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const [, , coordinatesPath, repositoryPath] = process.argv;

if (!coordinatesPath || !repositoryPath) {
  throw new Error(
    'usage: node mirror-gradle-cache.mjs <coordinates.txt> <repository>',
  );
}

const gradleHome =
  process.env.GRADLE_USER_HOME ?? path.join(homedir(), '.gradle');
const moduleCache = path.join(gradleHome, 'caches', 'modules-2', 'files-2.1');
const initialCoordinates = (await readFile(coordinatesPath, 'utf8'))
  .split(/\r?\n/u)
  .map(line => line.trim())
  .filter(Boolean);
const pendingCoordinates = [...initialCoordinates];
const queuedCoordinates = new Set(initialCoordinates);
const mirroredCoordinates = [];

async function digest(filePath) {
  const contents = await readFile(filePath);
  return createHash('sha256').update(contents).digest('hex');
}

let copiedFileCount = 0;

function tagValue(xml, tagName) {
  const match = xml.match(
    new RegExp(`<${tagName}>\\s*([^<]+?)\\s*</${tagName}>`, 'u'),
  );
  return match?.[1]?.trim() ?? null;
}

function referencedPomCoordinates(xml) {
  const references = [];
  const parentBlock = xml.match(/<parent>([\s\S]*?)<\/parent>/u)?.[1];

  if (parentBlock) {
    references.push({
      group: tagValue(parentBlock, 'groupId'),
      module: tagValue(parentBlock, 'artifactId'),
      version: tagValue(parentBlock, 'version'),
    });
  }

  const dependencyManagement = xml.match(
    /<dependencyManagement>([\s\S]*?)<\/dependencyManagement>/u,
  )?.[1];
  if (dependencyManagement) {
    for (const dependency of dependencyManagement.matchAll(
      /<dependency>([\s\S]*?)<\/dependency>/gu,
    )) {
      const block = dependency[1];
      if (tagValue(block, 'type') !== 'pom') continue;
      if (tagValue(block, 'scope') !== 'import') continue;

      references.push({
        group: tagValue(block, 'groupId'),
        module: tagValue(block, 'artifactId'),
        version: tagValue(block, 'version'),
      });
    }
  }

  return references.filter(
    reference =>
      reference.group &&
      reference.module &&
      reference.version &&
      !reference.version.includes('${'),
  );
}

while (pendingCoordinates.length > 0) {
  const coordinate = pendingCoordinates.shift();
  const [group, module, version, ...rest] = coordinate.split(':');
  if (!group || !module || !version || rest.length > 0) {
    throw new Error(`Invalid Maven coordinate: ${coordinate}`);
  }

  const cacheDirectory = path.join(moduleCache, group, module, version);
  const hashDirectories = await readdir(cacheDirectory, {withFileTypes: true}).catch(
    error => {
      throw new Error(
        `Gradle cache entry not found for ${coordinate}: ${cacheDirectory}`,
        {cause: error},
      );
    },
  );
  const destinationDirectory = path.join(
    repositoryPath,
    ...group.split('.'),
    module,
    version,
  );

  await mkdir(destinationDirectory, {recursive: true});
  const copiedPomPaths = [];
  const moduleMetadataPaths = [];

  for (const hashDirectory of hashDirectories) {
    if (!hashDirectory.isDirectory()) continue;

    const sourceDirectory = path.join(cacheDirectory, hashDirectory.name);
    const cachedFiles = await readdir(sourceDirectory, {withFileTypes: true});

    for (const cachedFile of cachedFiles) {
      if (!cachedFile.isFile()) continue;

      const source = path.join(sourceDirectory, cachedFile.name);
      const destination = path.join(destinationDirectory, cachedFile.name);
      const destinationInfo = await stat(destination).catch(() => null);

      if (destinationInfo) {
        const [sourceDigest, destinationDigest] = await Promise.all([
          digest(source),
          digest(destination),
        ]);
        if (sourceDigest !== destinationDigest) {
          throw new Error(
            `Conflicting cached files for ${coordinate}: ${cachedFile.name}`,
          );
        }
      } else {
        await copyFile(source, destination);
        copiedFileCount += 1;
      }

      if (cachedFile.name.endsWith('.pom')) {
        copiedPomPaths.push(destination);
      }
      if (cachedFile.name.endsWith('.module')) {
        moduleMetadataPaths.push(destination);
      }
    }
  }

  mirroredCoordinates.push(coordinate);

  // 일부 Kotlin Multiplatform 모듈은 캐시 파일명과 Maven URL 파일명이 다르다.
  // Gradle module metadata의 url 이름으로 별도 복사해 로컬 Maven 레이아웃을 복원한다.
  for (const metadataPath of moduleMetadataPaths) {
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    for (const variant of metadata.variants ?? []) {
      for (const artifact of variant.files ?? []) {
        if (!artifact.name || !artifact.url || artifact.name === artifact.url) continue;
        if (artifact.name.includes('/') || artifact.url.includes('/')) continue;

        const cachedNamePath = path.join(destinationDirectory, artifact.name);
        const mavenUrlPath = path.join(destinationDirectory, artifact.url);
        const [cachedNameInfo, mavenUrlInfo] = await Promise.all([
          stat(cachedNamePath).catch(() => null),
          stat(mavenUrlPath).catch(() => null),
        ]);

        if (cachedNameInfo?.isFile() && !mavenUrlInfo) {
          await copyFile(cachedNamePath, mavenUrlPath);
          copiedFileCount += 1;
        }
      }
    }
  }

  for (const pomPath of copiedPomPaths) {
    const pom = await readFile(pomPath, 'utf8');
    for (const reference of referencedPomCoordinates(pom)) {
      const referencedCoordinate = `${reference.group}:${reference.module}:${reference.version}`;
      if (queuedCoordinates.has(referencedCoordinate)) continue;

      queuedCoordinates.add(referencedCoordinate);
      pendingCoordinates.push(referencedCoordinate);
    }
  }
}

const manifestPath = path.join(
  path.dirname(repositoryPath),
  'mirrored-dependencies.txt',
);
await writeFile(manifestPath, `${mirroredCoordinates.sort().join('\n')}\n`);

process.stdout.write(
  `Mirrored ${mirroredCoordinates.length} module(s), ${copiedFileCount} file(s).\n`,
);
