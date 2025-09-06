import { Controller, Get, Res } from '@nestjs/common';
import express from 'express';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {
  
  constructor() {}

  @Get()
  @ApiExcludeEndpoint() 
  redirect(@Res() res: express.Response) {
    return res.redirect('/api');
  }
}