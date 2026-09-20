import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import apiClient, { API } from '../utils/api';

const MailIcon = ({ className = 'h-6 w-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail preview-icon"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
);

const SendIcon = ({ className = 'h-5 w-5' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
    >
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);

const BackIcon = ({ className = 'h-5 w-5' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
    >
        <path
            fillRule="evenodd"
            d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z"
            clipRule="evenodd"
        />
    </svg>
);

const SpinnerIcon = ({ className = 'h-5 w-5' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`${className} animate-spin`}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.691V5.006h-4.992v.001M7.965 4.356l-3.18 3.182m0 0h4.992m-4.992 0l3.18 3.182"
        />
    </svg>
);
import { FaSpinner } from "react-icons/fa";

const Support = () => {
    const [requestConfig, setRequestConfig] = useState(null);
    const [fields, setFields] = useState({});
    const [agree, setAgree] = useState(false);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequestConfig = async () => {
            try {
                const response = await apiClient.get(`${API}/requests/submissions/1`);

                setRequestConfig(response.data);

                const initialFields = {};

                for (const field of response.data.fields || []) {
                    if (!field.disabled) {
                        initialFields[field.name] = '';
                    }
                }

                setFields(initialFields);
            } catch (error) {
                console.error('Error fetching support form:', error);

                toast.error(
                    error.response?.data?.message ||
                    'Failed to load the support form.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchRequestConfig();
    }, []);

    const handleFieldChange = (fieldName, value) => {
        setFields((previous) => ({
            ...previous,
            [fieldName]: value
        }));
    };

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!agree) {
            toast.error(
                'You must agree to the Terms of Service and Privacy Policy.'
            );
            return;
        }

        if (!requestConfig?.fields) {
            toast.error('Support form is not available.');
            return;
        }

        for (const field of requestConfig.fields) {
            if (field.disabled) {
                continue;
            }

            const value = fields[field.name];

            const empty =
                value === undefined ||
                value === null ||
                (
                    typeof value === 'string' &&
                    value.trim().length === 0
                );

            if (field.required && empty) {
                toast.error(`${field.label} is required.`);
                return;
            }

            if (empty) {
                continue;
            }

            const stringValue = String(value);

            if (
                field.minLength !== undefined &&
                stringValue.length < field.minLength
            ) {
                toast.error(
                    `${field.label} must be at least ${field.minLength} characters long.`
                );
                return;
            }

            if (
                field.maxLength !== undefined &&
                stringValue.length > field.maxLength
            ) {
                toast.error(
                    `${field.label} must not exceed ${field.maxLength} characters.`
                );
                return;
            }
        }

        setIsSubmitting(true);

        const submittedFields = {};

        for (const field of requestConfig.fields) {
            const value = fields[field.name];

            if (value === undefined || value === null) {
                continue;
            }

            submittedFields[field.name] =
                typeof value === 'string'
                    ? value.trim()
                    : value;
        }

        try {
            const response = await apiClient.post(
                `${API}/requests/1`,
                submittedFields
            );

            toast.success(
                response.data.message ||
                'Your support request has been submitted successfully!'
            );

            const requestId = response.data.request?.id;

            if (requestId) {
                navigate(`/success?request=${requestId}`);
            } else {
                navigate('/one');
            }
        } catch (error) {
            console.error('Error submitting support request:', error);

            const data = error.response?.data;

            if (data?.errors?.length) {
                const firstError = data.errors[0];

                toast.error(
                    firstError.message ||
                    data.message ||
                    'An issue occurred while submitting your request.'
                );
            } else {
                toast.error(
                    data?.message ||
                    'An issue occurred while submitting your request.'
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [fields, agree, requestConfig, navigate]);

    const renderField = (field) => {
        if (field.disabled) {
            return null;
        }

        const value = fields[field.name] ?? '';

        const isTextarea =
            field.style === 2 ||
            field.maxLength > 500;

        const remaining =
            field.maxLength !== undefined
                ? field.maxLength - String(value).length
                : null;

        return (
            <div className="form-control" key={field.name}>
                <label
                    htmlFor={field.name}
                    className="block text-sm font-medium text-gray-200 mb-2"
                >
                    {field.label}
                    {field.required && !field.label?.includes('*') && (
                        <span className="text-red-400"> *</span>
                    )}
                </label>

                {field.description && (
                    <p className="text-xs text-gray-400 mb-2">
                        {field.description}
                    </p>
                )}

                {isTextarea ? (
                    <textarea
                        id={field.name}
                        name={field.name}
                        className="block w-full rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2 text-white placeholder-gray-500 transition-colors duration-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        rows={field.style === 2 ? 4 : 5}
                        placeholder={field.placeholder || ''}
                        value={value}
                        onChange={(e) =>
                            handleFieldChange(
                                field.name,
                                e.target.value
                            )
                        }
                        required={field.required}
                        minLength={field.minLength}
                        maxLength={field.maxLength}
                    />
                ) : (
                    <input
                        id={field.name}
                        name={field.name}
                        type="text"
                        className="block w-full rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2 text-white placeholder-gray-500 transition-colors duration-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={field.placeholder || ''}
                        value={value}
                        onChange={(e) =>
                            handleFieldChange(
                                field.name,
                                e.target.value
                            )
                        }
                        required={field.required}
                        minLength={field.minLength}
                        maxLength={field.maxLength}
                    />
                )}

                {remaining !== null && (
                    <p
                        className={`mt-2 text-xs ${
                            remaining < 0
                                ? 'text-red-400'
                                : 'text-gray-400'
                        }`}
                    >
                        {remaining} characters remaining
                    </p>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gray-900">
                <FaSpinner className="h-10 w-10 animate-spin text-indigo-400" />
            </main>
        );
    }

    if (!requestConfig) {
        return (
            <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gray-900 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-400">
                        Failed to load Support Center
                    </h1>

                    <p className="mt-3 text-gray-400">
                        Please try again later.
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-500 transition-all"
                    >
                        Go Back
                    </button>
                </div>

                <Toaster />
            </main>
        );
    }

    return (
        <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gray-900 font-sans p-4">

            <div className="absolute inset-0 z-0">
                <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,150,0.45),rgba(255,255,255,0))]" />

                <div className="absolute bottom-[-80px] right-[-30%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(100,100,255,0.35),rgba(255,255,255,0))]" />
            </div>

            <form
                onSubmit={handleSubmit}
                className="relative z-10 flex w-full max-w-2xl flex-col space-y-6 rounded-2xl border border-gray-700/50 bg-gray-800/50 p-6 sm:p-8 shadow-2xl backdrop-blur-lg"
                noValidate
            >
                <header className="text-center">
                    <div className="inline-flex items-center justify-center gap-3">
                        <MailIcon className="h-8 w-8 text-indigo-400" />

                        <h1 className="text-3xl font-bold text-white">
                            {requestConfig.title || 'Support Center'}
                        </h1>
                    </div>

                    <p className="mt-3 text-gray-300">
                        Need help? Fill out the form below and our team will get back to you.
                    </p>
                </header>

                <div
                    role="alert"
                    className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200"
                >
                    For applications, please specify "Application" in your request.
                    For all other inquiries, provide as much detail as possible
                    to help us resolve your issue quickly.
                </div>

                <div className="space-y-6">
                    {requestConfig.fields?.map(renderField)}
                </div>

                <div className="form-control">
                    <label className="flex items-start sm:items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            id="agree"
                            name="agree"
                            className="mt-1 sm:mt-0 h-5 w-5 rounded border-gray-600 bg-gray-900/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800"
                            checked={agree}
                            onChange={(e) =>
                                setAgree(e.target.checked)
                            }
                            required
                        />

                        <span className="text-sm text-gray-300">
                            I agree to the{' '}
                            <a
                                href="https://support.notreal003.org/terms"
                                className="font-medium text-indigo-400 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a
                                href="https://support.notreal003.org/privacy"
                                className="font-medium text-indigo-400 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Privacy Policy
                            </a>
                            .
                        </span>
                    </label>
                </div>

                <footer className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 border-t border-gray-700/50 pt-6">

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        disabled={isSubmitting}
                        className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-gray-600 bg-transparent px-4 text-sm font-semibold text-gray-300 transition-all duration-300 hover:border-gray-500 hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <BackIcon />
                        <span>Back</span>
                    </button>

                    <button
                        type="submit"
                        className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:bg-indigo-600/50"
                        disabled={isSubmitting || !agree}
                    >
                        {isSubmitting ? (
                            <SpinnerIcon />
                        ) : (
                            <SendIcon />
                        )}

                        <span>
                            {isSubmitting
                                ? 'Submit...'
                                : 'Submit'}
                        </span>
                    </button>

                </footer>
            </form>

            <Toaster />
        </main>
    );
};

export default Support;
