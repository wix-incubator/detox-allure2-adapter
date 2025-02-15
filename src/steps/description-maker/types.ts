export type StepDescription = {
  message: string;
  args: StepArgs;
};

export type StepArgs = Record<string, any> | null | undefined;

export type StepDescriptionMaker = (payload: unknown) => StepDescription | null;
