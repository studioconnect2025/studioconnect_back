import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async findAllCategories(): Promise<Category[]> {
    return await this.categoriesRepository.find();
  }

  async findCategoryByName(name: string): Promise<Category> {
    const categoryName = await this.categoriesRepository.findOne({
      where: { name },
      relations: { instruments: true },
    });

    if (!categoryName) {
      throw new NotFoundException(`Categoria ${name} no encontrado`);
    }

    return categoryName;
  }
}
