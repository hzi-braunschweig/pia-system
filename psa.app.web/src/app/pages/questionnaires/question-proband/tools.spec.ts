import { Tools } from './tools';

describe('Questionnaire tools', () => {
  let tools;
  beforeAll(() => {
    tools = new Tools();
  });

  it('should test getting the right answer option', () => {
    expect(tools.getAnswerVersion('active', 2, 1)).toEqual(2);
    expect(tools.getAnswerVersion('in_progress', 2, 1)).toEqual(2);
    expect(tools.getAnswerVersion('released_once', 1, 1)).toEqual(2);
    expect(tools.getAnswerVersion('released', 1, 1)).toEqual(2);
    expect(tools.getAnswerVersion('released_once', 0, 2)).toEqual(1);
    expect(tools.getAnswerVersion('released', 0, 2)).toEqual(1);
  });
});
