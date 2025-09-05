import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAllCategories(): Promise<Category[]> {
    return this.categoriesService.findAllCategories();
  }

  @Get(':name')
  async findOne(@Param('name') name: string): Promise<Category> {
    return this.categoriesService.findCategoryByName(name);
  }
}
