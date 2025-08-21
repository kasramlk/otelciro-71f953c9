import { auditLogger } from './audit-logger';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export class ApplicationError extends Error {
  public code: string;
  public statusCode: number;
  public context?: ErrorContext;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    context?: ErrorContext
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, field?: string, context?: ErrorContext) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
    if (field) {
      this.context = { ...this.context, field };
    }
  }
}

export class NetworkError extends ApplicationError {
  constructor(message: string, url?: string, context?: ErrorContext) {
    super(message, 'NETWORK_ERROR', 0, context);
    this.name = 'NetworkError';
    if (url) {
      this.context = { ...this.context, url };
    }
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required', context?: ErrorContext) {
    super(message, 'AUTH_ERROR', 401, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions', context?: ErrorContext) {
    super(message, 'AUTHORIZATION_ERROR', 403, context);
    this.name = 'AuthorizationError';
  }
}

export class BusinessLogicError extends ApplicationError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'BUSINESS_LOGIC_ERROR', 422, context);
    this.name = 'BusinessLogicError';
  }
}

// Error handling utility
export class ErrorHandler {
  private static instance: ErrorHandler;

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private userFriendlyMessages: Record<string, string> = {
    VALIDATION_ERROR: 'Please check your input and try again.',
    NETWORK_ERROR: 'Connection problem. Please check your internet and try again.',
    AUTH_ERROR: 'Please log in to continue.',
    AUTHORIZATION_ERROR: 'You don\'t have permission to perform this action.',
    BUSINESS_LOGIC_ERROR: 'This operation cannot be completed due to business rules.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  };

  async handleError(
    error: Error | ApplicationError,
    context?: ErrorContext,
    showToUser: boolean = true
  ): Promise<{
    userMessage: string;
    shouldRetry: boolean;
    shouldReload: boolean;
    shouldRedirect?: string;
  }> {
    // Log error for monitoring
    await this.logError(error, context);

    if (error instanceof ApplicationError) {
      return this.handleApplicationError(error, showToUser);
    }

    // Handle standard JavaScript errors
    return this.handleGenericError(error, showToUser);
  }

  private async logError(error: Error, context?: ErrorContext): Promise<void> {
    try {
      await auditLogger.logSystemError(error, context?.component || context?.action, {
        ...context,
        timestamp: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  private handleApplicationError(
    error: ApplicationError,
    showToUser: boolean
  ): {
    userMessage: string;
    shouldRetry: boolean;
    shouldReload: boolean;
    shouldRedirect?: string;
  } {
    let userMessage = showToUser 
      ? this.userFriendlyMessages[error.code] || error.message
      : error.message;

    let shouldRetry = false;
    let shouldReload = false;
    let shouldRedirect: string | undefined;

    switch (error.code) {
      case 'NETWORK_ERROR':
        shouldRetry = true;
        break;
      
      case 'AUTH_ERROR':
        shouldRedirect = '/auth';
        userMessage = 'Your session has expired. Please log in again.';
        break;
      
      case 'AUTHORIZATION_ERROR':
        // Stay on current page, just show message
        break;
      
      case 'VALIDATION_ERROR':
        // Don't retry validation errors
        break;
      
      case 'BUSINESS_LOGIC_ERROR':
        // Usually specific business rule violations
        userMessage = error.message;
        break;
      
      default:
        shouldRetry = true;
        shouldReload = error.statusCode >= 500;
    }

    return {
      userMessage,
      shouldRetry,
      shouldReload,
      shouldRedirect,
    };
  }

  private handleGenericError(
    error: Error,
    showToUser: boolean
  ): {
    userMessage: string;
    shouldRetry: boolean;
    shouldReload: boolean;
  } {
    let userMessage = showToUser
      ? this.userFriendlyMessages.UNKNOWN_ERROR
      : error.message;

    // Check for common error patterns
    if (error.message.includes('fetch')) {
      return {
        userMessage: showToUser ? this.userFriendlyMessages.NETWORK_ERROR : error.message,
        shouldRetry: true,
        shouldReload: false,
      };
    }

    if (error.message.includes('JSON')) {
      return {
        userMessage: showToUser ? 'Invalid response from server. Please try again.' : error.message,
        shouldRetry: true,
        shouldReload: false,
      };
    }

    return {
      userMessage,
      shouldRetry: true,
      shouldReload: false,
    };
  }

  // Utility methods for common error scenarios
  handleSupabaseError(error: any, context?: ErrorContext): ApplicationError {
    if (error?.code === 'PGRST301') {
      return new AuthorizationError('You don\'t have permission to access this data.', context);
    }

    if (error?.code === '42501') {
      return new AuthorizationError('Database permission denied.', context);
    }

    if (error?.message?.includes('JWT')) {
      return new AuthenticationError('Your session has expired.', context);
    }

    if (error?.message?.includes('connection')) {
      return new NetworkError('Database connection failed.', undefined, context);
    }

    return new ApplicationError(
      error?.message || 'Database operation failed.',
      'DATABASE_ERROR',
      500,
      context
    );
  }

  handleApiError(response: Response, context?: ErrorContext): ApplicationError {
    if (response.status === 401) {
      return new AuthenticationError('Authentication required.', context);
    }

    if (response.status === 403) {
      return new AuthorizationError('Access denied.', context);
    }

    if (response.status === 422) {
      return new ValidationError('Invalid data provided.', undefined, context);
    }

    if (response.status >= 500) {
      return new ApplicationError(
        'Server error occurred.',
        'SERVER_ERROR',
        response.status,
        context
      );
    }

    return new ApplicationError(
      `Request failed with status ${response.status}.`,
      'HTTP_ERROR',
      response.status,
      context
    );
  }
}

// Singleton instance
export const errorHandler = ErrorHandler.getInstance();

// React Hook for error handling
export const useErrorHandler = () => {
  const handleError = async (
    error: Error | ApplicationError,
    context?: ErrorContext,
    showToUser: boolean = true
  ) => {
    return await errorHandler.handleError(error, context, showToUser);
  };

  const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    context?: ErrorContext,
    onError?: (error: ApplicationError) => void
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      const handledError = error instanceof ApplicationError 
        ? error 
        : new ApplicationError(
            error instanceof Error ? error.message : 'Unknown error occurred',
            'ASYNC_OPERATION_ERROR',
            500,
            context
          );

      await handleError(handledError, context);
      
      if (onError) {
        onError(handledError);
      }

      return null;
    }
  };

  return {
    handleError,
    handleAsyncOperation,
    ValidationError,
    NetworkError,
    AuthenticationError,
    AuthorizationError,
    BusinessLogicError,
    ApplicationError,
  };
};

// Global error handler setup
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    errorHandler.handleError(
      new ApplicationError(
        'Unhandled promise rejection',
        'UNHANDLED_PROMISE',
        500
      ),
      { component: 'global', action: 'unhandled_promise' }
    );
  });

  // Handle general JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global JavaScript error:', event.error);
    errorHandler.handleError(
      event.error || new ApplicationError('JavaScript error', 'JS_ERROR', 500),
      { component: 'global', action: 'javascript_error' }
    );
  });
};