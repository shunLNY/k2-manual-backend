export class BaseController {
  public response(
    data?: object | object[],
    message?: {
      title?: string;
      body?: string;
    },
    token?: {
      accessToken?: string;
      refreshToken?: string;
      accessTokenExpire?: string;
      SESSION_ID?: string;
    },
  ): object {
    return { data, message, token };
  }

  public testResponse(test?: any): object {
    return { test };
  }

  public fileResponse(file?: any): object {
    return { file };
  }

  public paginateResponse(data?: object | object[], meta?: object) {
    return { data, meta };
  }
}
