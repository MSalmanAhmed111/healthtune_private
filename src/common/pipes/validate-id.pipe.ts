import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ErrorResponseMessages } from '@messages';

@Injectable()
export class ValidateId implements PipeTransform<string> {
    transform(value: string): number {
        const parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue) || !Number.isInteger(parsedValue) || parsedValue <= 0) {
            throw new BadRequestException(ErrorResponseMessages.invalidId);
        }
        return parsedValue;
    }
}
