export interface IJobs {
  docker: string[];
  lint: string[];
  testUnit: string[];
  testInt: string[];
  testE2e: string[];
  npmInstall: string[];
}

export interface IDockerBuild {
  tag: string;
  context: string;
  dockerfile?: string;
  args: { [index: string]: string };
}
