import { UnauthorizedException } from '@nestjs/common';
import { messages } from '../constants';


export class UnauthorizedExceedLoginException extends UnauthorizedException {
	constructor() {
		super(messages.unauthorizedExceedLoginMessage);
	}
}
