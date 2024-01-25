import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { AppController } from "./app.controller";
// import { WinModule } from "./modules/win/win.module";

@Module({
  imports: [],
  providers: [AppService],
  controllers: [AppController],
})
export class AppModule {}
