import { Module } from '@nestjs/common';
import { AppController, GenreService } from './genres.service';
import { AppService } from './genres.service';
import { GenresController } from './genres.controller';

@Module({
  imports: [],
  controllers: [GenresController],
  providers: [GenreService],
})
export class GenresModule {}
