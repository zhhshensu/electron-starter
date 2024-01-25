import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const port = 3344;
async function bootstrap() {
  // 启动electron窗口
  const main = await import("./index");
  await main.bootstrapElectron();
  const app = await NestFactory.create(AppModule);
  await app.listen(port, () => {
    console.log("🚀 ~ awaitapp.listen ~ port:", port)
    console.log('server is running in ', `http://localhost:${port}`);
  });
}
bootstrap();
