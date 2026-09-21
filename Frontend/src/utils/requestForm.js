export const FormFieldType = Object.freeze({
    TEXT_INPUT: 1,
    NUMBER_INPUT: 2,
    SELECT: 3,
    RADIO: 4
});

export const TextInputStyle = Object.freeze({
    SHORT: 1,
    PARAGRAPH: 2,
    UPLOAD: 3
});

export const TextInputValidation = Object.freeze({
    NONE: 0,
    EMAIL: 1,
    URL: 2,
    PLAYER: 3,
    LINKS: 4,
    GITHUB: 5,
    DISCORD_MESSAGE_URL: 6
});

export const TextInputValidationToType = Object.freeze({
    [TextInputValidation.NONE]: 'text',
    [TextInputValidation.EMAIL]: 'email',
    [TextInputValidation.URL]: 'url',
    [TextInputValidation.PLAYER]: 'text',
    [TextInputValidation.LINKS]: 'text',
    [TextInputValidation.GITHUB]: 'text',
    [TextInputValidation.DISCORD_MESSAGE_URL]: 'url'
});

export const getInputType = (field) => {
    if (field.type !== FormFieldType.TEXT_INPUT) {
        return undefined;
    }

    return TextInputValidationToType[field.validate] || 'text';
};

export const isTextArea = (field) => {
    return (
        field.type === FormFieldType.TEXT_INPUT &&
        field.style === TextInputStyle.PARAGRAPH
    );
};

export const getInitialFieldValue = (field) => {
    if (field.disabled) {
        return undefined;
    }

    if (field.type === FormFieldType.SELECT) {
        if (field.maxValues > 1) {
            return field.options
                ?.filter((option) => option.default)
                .map((option) => option.value) || [];
        }

        return (
            field.options?.find((option) => option.default)?.value || ''
        );
    }

    if (field.type === FormFieldType.RADIO) {
        return field.defaultOption || '';
    }

    if (field.type === FormFieldType.NUMBER_INPUT) {
        return field.min ?? '';
    }

    return field.value ?? '';
};

export const isEmptyFieldValue = (value) => {
    return (
        value === undefined ||
        value === null ||
        (
            typeof value === 'string' &&
            value.trim().length === 0
        )
    );
};

export const validateField = (field, value) => {
    const empty = isEmptyFieldValue(value);

    if (field.required && empty) {
        return `${field.label} is required.`;
    }

    if (empty) {
        return null;
    }

    if (
        field.type === FormFieldType.NUMBER_INPUT
    ) {
        const numberValue = Number(value);

        if (Number.isNaN(numberValue)) {
            return `${field.label} must be a valid number.`;
        }

        if (
            field.min !== undefined &&
            numberValue < field.min
        ) {
            return `${field.label} must be at least ${field.min}.`;
        }

        if (
            field.max !== undefined &&
            numberValue > field.max
        ) {
            return `${field.label} must not exceed ${field.max}.`;
        }

        return null;
    }

    if (
        field.type === FormFieldType.SELECT
    ) {
        const isMulti = field.maxValues > 1;
        const selected = isMulti
            ? Array.isArray(value)
                ? value
                : []
            : value
                ? [value]
                : [];

        if (
            field.minValues !== undefined &&
            selected.length < field.minValues
        ) {
            return `You must select at least ${field.minValues} option${field.minValues === 1 ? '' : 's'}.`;
        }

        if (
            field.maxValues !== undefined &&
            selected.length > field.maxValues
        ) {
            return `You may select at most ${field.maxValues} option${field.maxValues === 1 ? '' : 's'}.`;
        }

        const validValues = new Set(
            (field.options || []).map((option) => option.value)
        );

        if (selected.some((option) => !validValues.has(option))) {
            return `${field.label} contains an invalid option.`;
        }

        return null;
    }

    if (
        field.type === FormFieldType.RADIO
    ) {
        const validOptions = field.options || [];

        if (!validOptions.includes(value)) {
            return `${field.label} contains an invalid option.`;
        }

        return null;
    }

    const stringValue = String(value);

    if (
        field.minLength !== undefined &&
        stringValue.length < field.minLength
    ) {
        return `${field.label} must be at least ${field.minLength} characters long.`;
    }

    if (
        field.maxLength !== undefined &&
        stringValue.length > field.maxLength
    ) {
        return `${field.label} must not exceed ${field.maxLength} characters.`;
    }

    return null;
};

export const validateRequestFields = (fields, values) => {
    for (const field of fields || []) {
        if (field.disabled) {
            continue;
        }

        const error = validateField(
            field,
            values[field.name]
        );

        if (error) {
            return {
                field,
                message: error
            };
        }
    }

    return null;
};

export const normalizeRequestFields = (fields, values) => {
    const normalized = {};

    for (const field of fields || []) {
        if (field.disabled) {
            continue;
        }

        const value = values[field.name];

        if (value === undefined || value === null) {
            continue;
        }

        if (typeof value === 'string') {
            normalized[field.name] = value.trim();
        } else {
            normalized[field.name] = value;
        }
    }

    return normalized;
};

export const getCharacterCount = (value) => {
    return String(value ?? '').length;
};
