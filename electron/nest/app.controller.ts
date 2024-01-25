import { Controller, Get } from "@nestjs/common";

@Controller("app")
export class AppController {
  @Get()
  async getHello() {
    return {
      data: "Hello World!",
      message: "ok",
    };
  }
}
