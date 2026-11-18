import { Module } from '@nestjs/common';
import { AppController } from './genres.service';
import { AppService } from './genres.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
