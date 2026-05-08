import { NestInterceptor, ExecutionContext, CallHandler, UseInterceptors } from "@nestjs/common";
import { map } from "rxjs/operators";
import { plainToInstance } from "class-transformer";

interface ClassConstructor {
    new (...args: any[]): any;
}

export function Serialize(dto: ClassConstructor | ClassConstructor[]) {
    return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
    constructor(private dto: any) {}

    async intercept(context: ExecutionContext, next: CallHandler) {
        const dto = this.dto;

        return next.handle().pipe(
            map(function (response) {
                const data = plainToInstance(dto, response.data, {
                    excludeExtraneousValues: true,
                });
                return {
                    ...response,
                    data,
                };
            }),
        );
    }
}
