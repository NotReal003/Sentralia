import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IoSend } from 'react-icons/io5';
import { ImExit } from 'react-icons/im';
import { FaSpinner } from 'react-icons/fa';
import { FaPeopleGroup } from 'react-icons/fa6';
import toast, { Toaster } from 'react-hot-toast';
import DOMPurify from 'dompurify';
import apiClient, { API } from '../utils/api';

import {
  FormFieldType,
  getInitialFieldValue,
  getInputType,
  isTextArea,
  validateRequestFields,
  normalizeRequestFields,
  getCharacterCount
} from '../utils/requestForm';

const Request = () => {
  const { requestType } = useParams();
  const navigate = useNavigate();

  const [requestConfig, setRequestConfig] = useState(null);
  const [fields, setFields] = useState({});
  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sanitize = (input) =>
    DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });

  useEffect(() => {
    const fetchRequestConfig = async () => {
      setLoading(true);
      setRequestConfig(null);
      setFields({});
      setAgree(false);

      try {
        const response = await apiClient.get(
          `${API}/requests/submissions/${requestType}`
        );

        const config = response.data;

        setRequestConfig(config);

        const initialFields = {};

        for (const field of config.fields || []) {
          const value = getInitialFieldValue(field);

          if (value !== undefined) {
            initialFields[field.name] = value;
          }
        }

        setFields(initialFields);
      } catch (error) {
        console.error('Error fetching request form:', error);

        toast.error(
          error.response?.data?.message ||
          'Failed to load the request form.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequestConfig();
  }, [requestType]);

  const handleFieldChange = (fieldName, value) => {
    setFields((prev) => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!agree) {
      toast.error('Please agree to terms.');
      return;
    }

    if (!requestConfig?.fields) {
      toast.error('Request form is not available.');
      return;
    }

    const validationError = validateRequestFields(
      requestConfig.fields,
      fields
    );

    if (validationError) {
      toast.error(validationError.message);
      return;
    }

    setIsSubmitting(true);

    const normalizedFields = normalizeRequestFields(
      requestConfig.fields,
      fields
    );

    const sanitizedFields = Object.fromEntries(
      Object.entries(normalizedFields).map(([name, value]) => [
        name,
        typeof value === 'string'
          ? sanitize(value)
          : value
      ])
    );

    try {
      const response = await apiClient.post(
        `${API}/requests/${requestType}`,
        sanitizedFields
      );

      toast.success(
        response.data.message ||
        'Request submitted successfully.'
      );

      const requestId = response.data.request?.id;

      if (requestId) {
        navigate(`/success?request=${requestId}`);
      } else {
        navigate('/success');
      }
    } catch (error) {
      console.error('Error submitting request:', error);

      const data = error.response?.data;

      if (data?.errors?.length) {
        const firstError = data.errors[0];

        toast.error(
          firstError.message ||
          data.message ||
          'Submission failed.'
        );
      } else {
        toast.error(
          data?.message ||
          'Submission failed.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, agree, requestConfig, navigate, requestType]);

  const renderField = (field) => {
    if (field.disabled) {
      return null;
    }

    const value = fields[field.name];

    const fieldHeader = (
      <>
        <label
          htmlFor={field.name}
          className="block text-sm font-semibold mb-1"
        >
          {field.label}

          {field.required && (
            <span className="text-red-400"> *</span>
          )}
        </label>

        {field.description && (
          <p className="text-xs text-gray-500 mb-2">
            {field.description}
          </p>
        )}
      </>
    );

    if (field.type === FormFieldType.TEXT_INPUT) {
      const inputValue = value ?? '';
      const textarea = isTextArea(field);

      const remaining =
        field.maxLength !== undefined
          ? field.maxLength - getCharacterCount(inputValue)
          : null;

      return (
        <div key={field.name}>
          {fieldHeader}

          {textarea ? (
            <textarea
              id={field.name}
              name={field.name}
              className="w-full p-3 rounded-lg bg-[#111]/50 border border-gray-700 text-gray-200 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              rows={4}
              required={field.required}
              minLength={field.minLength}
              maxLength={field.maxLength}
              placeholder={field.placeholder || ''}
              value={inputValue}
              onChange={(e) =>
                handleFieldChange(
                  field.name,
                  e.target.value
                )
              }
            />
          ) : (
            <input
              id={field.name}
              name={field.name}
              type={getInputType(field)}
              className="w-full p-3 rounded-lg bg-[#111]/50 border border-gray-700 text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
              required={field.required}
              minLength={field.minLength}
              maxLength={field.maxLength}
              placeholder={field.placeholder || ''}
              value={inputValue}
              onChange={(e) =>
                handleFieldChange(
                  field.name,
                  e.target.value
                )
              }
            />
          )}

          {remaining !== null && (
            <p
              className={`text-xs mt-1 ${
                remaining < 0
                  ? 'text-red-400'
                  : 'text-gray-500'
              }`}
            >
              {remaining} characters remaining
            </p>
          )}
        </div>
      );
    }

    if (field.type === FormFieldType.NUMBER_INPUT) {
      const inputValue = value ?? '';

      return (
        <div key={field.name}>
          {fieldHeader}

          <input
            id={field.name}
            name={field.name}
            type="number"
            className="w-full p-3 rounded-lg bg-[#111]/50 border border-gray-700 text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
            required={field.required}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder || ''}
            value={inputValue}
            onChange={(e) =>
              handleFieldChange(
                field.name,
                e.target.value
              )
            }
          />
        </div>
      );
    }

    if (field.type === FormFieldType.SELECT) {
      const isMulti = field.maxValues > 1;

      const selectedValues = isMulti
        ? Array.isArray(value)
          ? value
          : []
        : value ?? '';

      return (
        <div key={field.name}>
          {fieldHeader}

          <select
            id={field.name}
            name={field.name}
            multiple={isMulti}
            required={field.required}
            value={selectedValues}
            onChange={(e) => {
              if (isMulti) {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                );

                handleFieldChange(
                  field.name,
                  selected
                );
              } else {
                handleFieldChange(
                  field.name,
                  e.target.value
                );
              }
            }}
            className="w-full p-3 rounded-lg bg-[#111]/50 border border-gray-700 text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
          >
            {!isMulti && (
              <option value="">
                {field.placeholder || 'Select an option'}
              </option>
            )}

            {(field.options || []).map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          {isMulti && (
            <p className="text-xs text-gray-500 mt-1">
              Select between {field.minValues ?? 0} and{' '}
              {field.maxValues ?? field.options?.length ?? 0} options.
            </p>
          )}
        </div>
      );
    }

    if (field.type === FormFieldType.RADIO) {
      const options = field.options || [];

      return (
        <div key={field.name}>
          {fieldHeader}

          <div className="space-y-2">
            {options.map((option) => {
              const optionValue =
                typeof option === 'object'
                  ? option.value
                  : option;

              const optionLabel =
                typeof option === 'object'
                  ? option.label
                  : option;

              const optionDescription =
                typeof option === 'object'
                  ? option.description
                  : null;

              return (
                <label
                  key={optionValue}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#111]/50 border border-gray-700 cursor-pointer hover:border-purple-500/50 transition-colors"
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={optionValue}
                    checked={value === optionValue}
                    required={field.required}
                    onChange={(e) =>
                      handleFieldChange(
                        field.name,
                        e.target.value
                      )
                    }
                    className="radio radio-primary mt-1"
                  />

                  <div>
                    <span className="text-gray-200">
                      {optionLabel}
                    </span>

                    {optionDescription && (
                      <p className="text-xs text-gray-500 mt-1">
                        {optionDescription}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <FaSpinner className="animate-spin text-purple-500 w-10 h-10" />
      </div>
    );
  }

  if (!requestConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <p className="text-red-400 text-lg font-semibold">
            Failed to load the request form.
          </p>

          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-5 py-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative text-gray-200 font-sans overflow-hidden">
      <Toaster position="top-center" />

      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#151515] z-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-purple-700/20 to-transparent blur-3xl animate-spin-slow" />

        <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-gradient-to-bl from-indigo-700/20 to-transparent blur-2xl animate-spin-slow-reverse" />
      </div>

      <div className="relative z-10 w-full max-w-lg bg-gray-900/30 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-purple-500/20 shadow-2xl shadow-purple-900/20">

        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-6 flex items-center justify-center text-center">
          <FaPeopleGroup className="mr-3 shrink-0" />
          {requestConfig.title || 'Request'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {requestConfig.fields?.map(renderField)}

          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) =>
                setAgree(e.target.checked)
              }
              className="checkbox checkbox-accent"
              required
            />

            <span>
              I agree to the{' '}
              <a
                className="link link-primary"
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms
              </a>{' '}
              &{' '}
              <a
                className="link link-primary"
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>

          <div className="flex justify-between items-center pt-6 border-t border-gray-700">

            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-lg bg-gradient-to-r from-gray-800 to-gray-700 text-white hover:from-gray-700 hover:to-gray-600 transition-all disabled:opacity-50"
            >
              <ImExit className="inline mr-2" />
              Back
            </button>

            <button
              type="submit"
              disabled={!agree || isSubmitting}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold flex items-center hover:scale-105 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <IoSend className="mr-2" />
              )}

              {isSubmitting
                ? 'Submitting...'
                : 'Submit'}
            </button>

          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 25s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Request;
