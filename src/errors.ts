/**
 * ExtendableError provides a base Error class to source off of that does not
 * break the inheritence chain.
 */
export class ExtendableError {
  public readonly message: string;
  public readonly stack: any;

  constructor(message: string = null) {
    this.message = message;
    this.stack = (new Error()).stack;
  }
}

/**
 * APIError is the base error that all application issued errors originate, they
 * are composed of data used by the front end and backend to handle errors
 * consistently.
 */
export class APIError extends ExtendableError {
  public readonly translationKey?: string;
  public readonly metadata: object;

  constructor(message: string = null, translationKey: string = null, metadata: object = {}) {
    super(message);

    this.translationKey = translationKey;
    this.metadata = metadata;
  }

  public toJSON() {
    return {
      message: this.message,
      translation_key: this.translationKey,
      metadata: this.metadata,
    };
  }
}

// ErrPasswordTooShort is returned when the password length is too short.
export const PASSWORD_LENGTH = 'PASSWORD_LENGTH';

export const EMAIL_REQUIRED = 'EMAIL_REQUIRED';

export const PASSWORD_REQUIRED = 'PASSWORD_REQUIRED';

export const EMAIL_IN_USE = 'EMAIL_IN_USE';

export const USERNAME_IN_USE = 'USERNAME_IN_USE';

export const NO_SPECIAL_CHARACTERS = 'NO_SPECIAL_CHARACTERS';

export const USERNAME_REQUIRED = 'USERNAME_REQUIRED';

// ErrMissingToken is returned in the event that the password reset is requested
// without a token.
export const MISSING_TOKEN = 'MISSING_TOKEN';

// ErrAssetCommentingClosed is returned when a comment or action is attempted on
// a stream where commenting has been closed.
export class ErrAssetCommentingClosed extends APIError {
  constructor(closedMessage = null) {
    super('asset commenting is closed', 'COMMENTING_CLOSED', {

      // Include the closedMessage in the metadata piece of the error.
      closedMessage,
    });
  }
}

/**
 * ErrAuthentication is returned when there is an error authenticating and the
 * message is provided.
 */
export class ErrAuthentication extends APIError {
  constructor(message = null) {
    super('authentication error occured', 'AUTH_ERROR', {
      message,
    });
  }
}

/**
 * ErrAlreadyExists is returned when an attempt to create a resource failed due to an existing one.
 */
export class ErrAlreadyExists extends APIError {
  constructor(existing = null) {
    super('resource already exists', 'ALREADY_EXISTS', {
      existing,
    });
  }
}

// ErrContainsProfanity is returned in the event that the middleware detects
// profanity/wordlisted words in the payload.
export const PROFANITY_ERROR = 'PROFANITY_ERROR';

export const NOT_FOUND = 'NOT_FOUND';

export const INVALID_ASSET_URL = 'INVALID_ASSET_URL';

// ErrNotAuthorized is an error that is returned in the event an operation is
// deemed not authorized.
export const NOT_AUTHORIZED = 'NOT_AUTHORIZED';

// ErrSettingsNotInit is returned when the settings are required but not
// initialized.
export const SETTINGS_NOT_INIT = 'SETTINGS_NOT_INIT';

// ErrSettingsInit is returned when the setup endpoint is hit and we are already
// initialized.
export const SETTINGS_ALREADY_INIT = 'SETTINGS_ALREADY_INIT';

// ErrInstallLock is returned when the setup endpoint is hit and the install
// lock is present.
export const INSTALL_LOCK_PRESENT = 'INSTALL_LOCK_PRESENT';

// ErrPermissionUpdateUsername is returned when the user does not have permission to update their username.
export const EDIT_USERNAME_NOT_AUTHORIZED = 'EDIT_USERNAME_NOT_AUTHORIZED';

// ErrSameUsernameProvided is returned when attempting to update a username to the same username.
export const SAME_USERNAME_PROVIDED = 'SAME_USERNAME_PROVIDED';

// ErrLoginAttemptMaximumExceeded is returned when the login maximum is exceeded.
export const LOGIN_MAXIMUM_EXCEEDED = 'LOGIN_MAXIMUM_EXCEEDED';

// ErrEditWindowHasEnded is returned when the edit window has expired.
export const EDIT_WINDOW_ENDED = 'EDIT_WINDOW_ENDED';

// ErrCommentTooShort is returned when the comment is too short.
export const COMMENT_TOO_SHORT = 'COMMENT_TOO_SHORT';

// ErrAssetURLAlreadyExists is returned when a rename operation is requested
// but an asset already exists with the new url.
export const ASSET_URL_ALREADY_EXISTS = 'ASSET_URL_ALREADY_EXISTS';
