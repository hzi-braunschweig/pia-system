const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);

const docker = {
  rmf: async function (containerName) {
    try {
      await exec(`docker rm -v -f ${containerName}`);
    } catch (err) {}
  },
  run: async function (containerName, imageName, env, ports, cmd) {
    let envStr = '';
    for ([key, value] of Object.entries(env)) {
      envStr += `-e "${key}=${value}" `;
    }
    let portStr = '';
    for ([key, value] of Object.entries(ports)) {
      envStr += `-p "${key}:${value}" `;
    }
    let command = `docker run -d --name ${containerName} ${envStr}${portStr}${imageName}`;
    if (cmd) {
      command += ' ' + cmd;
    }
    await exec(command);
  },
  exec: async function (containerName, cmd) {
    await exec(`docker exec -i ${containerName} ${cmd}`);
  },
  build: async function (imageName, path, buildArgs, dockerFile) {
    const arg = Object.entries(buildArgs)
      .map(([key, value]) => `--build-arg ${key}=${value}`)
      .join(' ');
    const command = `docker build --tag ${imageName} ${arg} -f ${dockerFile} ${path}`;
    await exec(command, {
      env: {
        DOCKER_BUILDKIT: '1',
      },
    });
  },
};

module.exports = docker;
