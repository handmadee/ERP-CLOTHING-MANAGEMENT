import { Global, Module } from '@nestjs/common';
import { CustomLogger } from '../services/logger.service';

@Global()
@Module({
    providers: [CustomLogger],
    exports: [CustomLogger],
})
export class LoggerModule { } 