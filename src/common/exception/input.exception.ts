import { BadRequestException } from '@nestjs/common';


export class InputException extends BadRequestException {
  constructor(name?: string, message?: string) {
    super({
      statusCode: 400,
      error: 'Bad Request',
      message: [
        {
          property: name,
          children: [],
          constraints: {
            inputError: message || message,
          },
        },
      ],
    });
  }
}
