export type CustomAction = {
    name: string;
    description: string;
    parameters: CustomChatSkillParams[];
};

export type CustomChatSkillParams = {
    key: string;
    type: string;
    description: string;
    required: string;
};

export type ActionResponse = {
    name: string;
    label: string;
    parameters: CustomChatSkillParams[];
};

export type ActionParams = {
    key: string;
    value: string;
};
