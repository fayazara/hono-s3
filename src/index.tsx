import { Hono } from "hono";
import { validateBlob } from "../utils/blob";
import { FileStorage } from "../services/storage";

const app = new Hono();

app.post("/upload", async (c) => {
  try {
    console.log("Request received");
    const form = await c.req.parseBody();
    const image = form.image;

    if (!(image instanceof File)) {
      throw new Error("Image is not a File");
    }

    validateBlob(image, {
      maxSize: "1MB",
      types: ["image/png", "image/jpeg", "image/webp"],
    });

    const imageId = Math.random().toString(36).substring(2, 15);
    const uniqueKey = `${imageId}-${image.name}`;

    const storageService = new FileStorage(c);
    await storageService.upload(uniqueKey, image);
    const publicUrl = storageService.getObjectUrl(uniqueKey);

    return c.json({ url: publicUrl });
  } catch (error) {
    console.error(error);
    return c.json({ error: error.message }, 400);
  }
});

export default app;
