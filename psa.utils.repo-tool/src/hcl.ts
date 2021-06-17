export interface IHclTarget {
  context: string;
  dockerfile: string;
  tags: string[];
  args: { [key: string]: string };
}

export type IHclTargets = { [index: string]: IHclTarget };

export class Hcl {
  private createHclEntry(type: string, name: string, children: string[]) {
    let result = `${type} "${name}" {\n`;
    for (const child of children) {
      const cs = child.split('\n');
      result += cs.map((c) => `	${c}\n`).join('');
    }
    result += '}';
    return result;
  }

  private createHclArray(name: string, entries: string[]) {
    return `${name} = [ ${entries.map((entry) => `"${entry}"`).join(',')}]`;
  }

  private createHclString(name: string, value: string) {
    return `${name} = "${value}"`;
  }

  private createHclObj(name: string, children: string[]) {
    let result = `${name} = {\n`;
    for (const child of children) {
      result += `	${child}\n`;
    }
    result += '}';
    return result;
  }

  public stringify(target: IHclTargets): string {
    let hcl = '';

    hcl += this.createHclEntry('variable', 'TAG', [
      this.createHclString('default', 'latest'),
    ]);
    hcl += '\n\n';
    hcl += this.createHclEntry('group', 'default', [
      this.createHclArray('targets', Object.keys(target)),
    ]);
    hcl += '\n\n';

    for (const t of Object.keys(target)) {
      hcl += this.createHclEntry('target', t, [
        this.createHclString('context', target[t].context),
        this.createHclString('dockerfile', target[t].dockerfile),
        this.createHclArray('tags', target[t].tags),
        this.createHclObj(
          'args',
          Object.keys(target[t].args).map((arg) => {
            return this.createHclString(arg, target[t].args[arg]);
          })
        ),
      ]);
      hcl += '\n\n';
    }
    return hcl;
  }
}
