export interface IGitlabCiNeeds {
  job: string;
  artifacts: boolean;
}

export interface IGitlabCiService {
  name: string;
  alias: string;
  command: string;
}

export interface IGitlabCiArtifacts {
  reports?: { [type: string]: string | string[] };
  paths?: string[];
}

export interface IGitlabCiParallel {
  matrix: { [index: string]: string[] }[];
}

export interface IGitlabCiTemplate {
  [jobName: string]: IGitlabCiJob;
}

export interface IGitlabCiJob {
  image: string;
  needs: IGitlabCiNeeds[];
  script: string[];
  services: IGitlabCiService[];
  artifacts?: IGitlabCiArtifacts;
  parallel?: IGitlabCiParallel;
}

export class GitlabCi {}
