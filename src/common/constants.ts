export enum StatusType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export const DEVICE_TYPE_HEADER = "x-device-type"; // pc || mobile
export const REFRESH_TOKEN_HEADER = "x-refresh-token"; // pc || mobile

export const messages = {
  unauthorizedRetiredLoginMessage: `unauthorized-retired`,
  unauthorizedResetPasswordMessage: `unauthorized-reset-password-required`,
  unauthorizedNoneLoginMessage: `unauthorized-none-login`,
  unauthorizedEmailPhoneMessage: `unauthorized-email-phone`,
  unauthorizedInvoiceFailMessage: `unauthorized-invoice-fail`,
  unauthorizedExceedLoginMessage: `unauthorized-login-exceeded`,
};