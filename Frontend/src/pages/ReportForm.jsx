import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSend } from "react-icons/io5";
import { ImExit } from "react-icons/im";
import { FaSpinner, FaShieldHalved } from "react-icons/fa";
import { FaShieldHalved } from "react-icons/fa6";
import toast, { Toaster } from 'react-hot-toast';
import DOMPurify from "dompurify";
import apiClient, { API } from '../utils/api';
import {
  FormFieldType,
  isTextArea,
  getInputType,
  getInitialFieldValue,
  validateRequestFields,
  normalizeRequestFields,
  getCharacterCount
} from '../utils/requestForm';

const ReportForm = () => {
  const [requestConfig, setRequestConfig] = useState(null);
  const [fields, setFields] = useState({});
  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const sanitize = (input) =>
    DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });

  useEffect(() => {
    const fetchRequestConfig = async () => {
      try {
        const response = await apiClient.get(
          `${API}/requests/submissions/2`
        );

        setRequestConfig(response.data);

        const initialFields = {};

        for (const field of response.data.fields || []) {
          const value = getInitialFieldValue(field);

          if (value !== undefined) {
            initialFields[field.name] = value;
          }
        }

        setFields(initialFields);
      } catch (error) {
        console.error('Error fetching report form:', error);

        toast.error(
          error.response?.data?.message ||
          'Failed to load the report form.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequestConfig();
  }, []);

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
      toast.error('Report form is not available.');
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
        typeof value === 'string' ? sanitize(value) : value
      ])
    );

    try {
      const response = await apiClient.post(
        `${API}/requests/2`,
        sanitizedFields
      );

      toast.success(
        response.data.message ||
        'Report submitted successfully!'
      );

      const requestId = response.data.request?.id;

      if (requestId) {
        navigate(`/success?request=${requestId}`);
      } else {
        navigate('/success');
      }
    } catch (error) {
      console.error('Error submitting report:', error);

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
  }, [fields, agree, requestConfig, navigate]);

  const renderField = (field) => {
    if (field.disabled) {
      return null;
    }

    if (field.type !== FormFieldType.TEXT_INPUT) {
      return null;
    }

    const value = fields[field.name] ?? '';

    const remaining =
      field.maxLength !== undefined
        ? field.maxLength - getCharacterCount(value)
        : null;

    return (
      <div key={field.name}>
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

        {isTextArea(field) ? (
          <textarea
            id={field.name}
            name={field.name}
            className="w-full p-3 rounded-lg bg-[#111]/50 border border-gray-700 text-gray-200 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            rows={4}
            required={field.required}
            minLength={field.minLength}
            maxLength={field.maxLength}
            placeholder={field.placeholder || ''}
            value={value}
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
            value={value}
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
            Failed to load the report form.
          </p>

          <button
            type="button"
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
        <div className="absolute left-0 top-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-green-700/20 to-transparent blur-3xl animate-spin-slow" />

        <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-gradient-to-bl from-teal-700/20 to-transparent blur-2xl animate-spin-slow-reverse" />
      </div>

      <div className="relative z-10 w-full max-w-lg bg-gray-900/30 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-purple-500/20 shadow-2xl shadow-purple-900/20">

        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-300 to-sky-300 bg-clip-text text-transparent mb-6 flex items-center justify-center">
          <FaShieldHalved className="mr-3 text-green-300" />
          {requestConfig.title || 'Discord Report'}
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
              className="px-5 py-3 rounded-lg bg-gradient-to-r from-gray-800 to-gray-700 text-white hover:from-gray-700 hover:to-gray-600 transition-all"
              disabled={isSubmitting}
            >
              <ImExit className="inline mr-2" />
              Back
            </button>

            <button
              type="submit"
              disabled={!agree || isSubmitting}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold flex items-center hover:scale-105 transition-all disabled:opacity-50"
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

export default ReportForm;
