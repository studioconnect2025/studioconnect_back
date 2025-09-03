import { Controller } from '@nestjs/common';
import { StudiosService } from './studios.service';

@Controller('studios')
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) {}
}
